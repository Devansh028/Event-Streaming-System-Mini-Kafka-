const { publishEvent } = require("../services/producerService");
const { recordPublish, recordPublishEventTime } = require("../utils/runtimeMetrics");
const { buildPendingEnvelope } = require("../utils/eventEnvelope");
const redis = require("../config/redis");
const Joi = require("joi");

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

const eventSchema = Joi.object({
    type: Joi.string().required(),
    payload: Joi.object().required(),
    topic: Joi.string().trim().max(128).optional()
});

const publishSchema = Joi.object({
    topic: Joi.string().trim().max(128).required(),
    type: Joi.string().trim().required(),
    payload: Joi.object().required()
});

const createEvent = async (req, res) => {
    const { error } = eventSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { type, payload, topic: bodyTopic } = req.body;

    const topic =
      typeof bodyTopic === "string" && bodyTopic.trim() !== ""
        ? bodyTopic.trim()
        : "default";

    const envelope = buildPendingEnvelope({ topic, type, payload });

    const t0 = Date.now();
    await publishEvent(envelope, topic);
    recordPublish(Date.now() - t0);
    recordPublishEventTime();

    res.json({ message: "Event published", event: envelope });
};

const publish = async (req, res) => {
    const { error } = publishSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const topic = req.body.topic.trim();
    const { type, payload } = req.body;
    const envelope = buildPendingEnvelope({ topic, type, payload });

    const t0 = Date.now();
    await publishEvent(envelope, topic);
    recordPublish(Date.now() - t0);
    recordPublishEventTime();

    return res.json({ success: true, topic, type });
};

const getDlqFromRedis = async (req, res) => {
  try {
    const entries = await redis.xrange(DLQ_STREAM, "-", "+", "COUNT", 200);
    const items = [];
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const [messageId, fields] = entry;
        const map = parseStreamFields(fields);
        const raw = map.data;
        if (typeof raw !== "string" || raw.trim() === "") {
          items.push({
            _id: messageId,
            topic: "default",
            type: "UNKNOWN",
            payload: {},
            error: "empty_dlq_payload",
            createdAt: new Date().toISOString(),
            status: "failed",
          });
          continue;
        }
        try {
          const data = JSON.parse(raw);
          const createdAt =
            typeof data.createdAt === "string" && !Number.isNaN(Date.parse(data.createdAt))
              ? new Date(data.createdAt).toISOString()
              : new Date().toISOString();
          items.push({
            _id: messageId,
            topic:
              typeof data.topic === "string" && data.topic.trim() !== ""
                ? data.topic.trim()
                : "default",
            type: typeof data.type === "string" ? data.type : "UNKNOWN",
            payload: data.payload !== undefined && data.payload !== null ? data.payload : {},
            error: data.error != null ? String(data.error) : undefined,
            createdAt,
            status: "failed",
          });
        } catch {
          items.push({
            _id: messageId,
            topic: "default",
            type: "INVALID_JSON",
            payload: { raw },
            error: "json_parse_failed",
            createdAt: new Date().toISOString(),
            status: "failed",
          });
        }
      }
    }
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: "Failed to read DLQ", error: err.message });
  }
};

module.exports = { createEvent, publish, getDlqFromRedis };