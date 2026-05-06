const redis = require("../config/redis");
const { addEventToStream } = require("../streams/eventStream");
const logger = require("../utils/simpleLogger");
const Event = require("../models/eventModel");
const { buildPendingEnvelope } = require("../utils/eventEnvelope");

const DLQ_STREAM = "dead-letter-stream";

const parseStreamFields = (fields) => {
  if (!fields || !Array.isArray(fields)) {
    return {};
  }
  const parsed = {};
  for (let i = 0; i < fields.length; i += 2) {
    const key = fields[i];
    const value = fields[i + 1];
    if (typeof key === "string") {
      parsed[key] = value;
    }
  }
  return parsed;
};

exports.retryFromDlq = async (req, res) => {
  try {
    let entries;
    const { messageId } = req.body || {};

    if (messageId && typeof messageId === "string") {
      entries = await redis.xrange(DLQ_STREAM, messageId, messageId);
    } else {
      entries = await redis.xrange(DLQ_STREAM, "-", "+", "COUNT", 1);
    }

    if (!entries || entries.length === 0) {
      return res.status(404).json({ message: "No DLQ messages to retry" });
    }

    const [id, fields] = entries[0];
    const payloadMap = parseStreamFields(fields);
    const raw = payloadMap.data;

    if (typeof raw !== "string" || raw.trim() === "") {
      return res.status(400).json({ message: "Invalid DLQ entry: missing data" });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return res.status(400).json({ message: "Invalid DLQ entry: data is not JSON" });
    }

    if (!data || typeof data.type !== "string") {
      return res.status(400).json({ message: "Invalid DLQ payload: type required" });
    }

    const topic =
      data.topic != null &&
      typeof data.topic === "string" &&
      data.topic.trim() !== ""
        ? data.topic.trim()
        : "default";

    const payload = data.payload !== undefined && data.payload !== null ? data.payload : {};
    const envelope = buildPendingEnvelope({ topic, type: data.type, payload });

    await addEventToStream(envelope, topic);

    let mongoDoc = await Event.findOne({
      status: "failed",
      type: envelope.type,
      payload: envelope.payload,
    }).sort({ createdAt: -1 });
    if (!mongoDoc) {
      mongoDoc = await Event.findOne({ status: "failed", type: envelope.type }).sort({
        createdAt: -1,
      });
    }
    if (mongoDoc) {
      mongoDoc.status = "retrying";
      await mongoDoc.save();
    }

    await redis.xdel(DLQ_STREAM, id);

    logger.info("DLQ message requeued to event-stream", { dlqMessageId: id, type: envelope.type });

    return res.json({
      message: "Requeued to event-stream",
      dlqMessageId: id,
      event: envelope,
    });
  } catch (err) {
    logger.error("retryFromDlq failed", { error: err.message });
    return res.status(500).json({ message: "Retry failed", error: err.message });
  }
};
