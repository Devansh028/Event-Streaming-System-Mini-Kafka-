require("dotenv").config();
const logger = require("./utils/simpleLogger");
const redis = require("./config/redis");
const redisPub = require("./config/redis");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

console.log(" Worker starting...");
logger.info("Worker starting (structured log)");

const Event = mongoose.model(
  "Event",
  new mongoose.Schema({
    type: String,
    payload: Object,
    topic: {
      type: String,
      default: "default",
    },
    status: { type: String, enum: ["pending", "processed", "failed", "retrying"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
  })
);

/** Must match server `streamNameForTopic`: `{topic}-stream` (topics default | orders | payments). */
const streams = ["default-stream", "orders-stream", "payments-stream"];

const GROUP_NAME = "workers-group";
const CONSUMER_NAME = "consumer-1";

const topicFromStreamName = (streamName) => {
  if (typeof streamName === "string" && streamName.endsWith("-stream")) {
    return streamName.slice(0, -"-stream".length);
  }
  return "default";
};

const parseFields = (fields) => {
  if (!fields) {
    return {};
  }

  // ioredis returns flat field-value arrays for stream entries.
  if (Array.isArray(fields)) {
    const parsed = {};
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      if (typeof key === "string") {
        parsed[key] = value;
      }
    }
    return parsed;
  }

  if (typeof fields === "object") {
    return fields;
  }

  return {};
};

/**
 * Ensure each stream exists and has the consumer group before XREADGROUP.
 * Redis: XGROUP CREATE stream group $ MKSTREAM — ignore BUSYGROUP.
 */
const ensureConsumerGroupsForStreams = async () => {
  for (const stream of streams) {
    try {
      await redis.xgroup("CREATE", stream, GROUP_NAME, "$", "MKSTREAM");
      logger.info("Created Redis consumer group on stream", { stream, group: GROUP_NAME });
      console.log(`[consumer] XGROUP CREATE OK: ${stream} → ${GROUP_NAME} (MKSTREAM)`);
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.includes("BUSYGROUP")) {
        logger.info("Consumer group already exists (BUSYGROUP), skipping create", {
          stream,
          group: GROUP_NAME,
        });
        console.log(`[consumer] Group already exists on ${stream} (BUSYGROUP)`);
        continue;
      }
      logger.error("XGROUP CREATE failed", { stream, group: GROUP_NAME, error: msg });
      console.error(`[consumer] XGROUP CREATE failed for ${stream}:`, msg);
      throw err;
    }
  }
};

const startConsumer = async () => {
  await connectDB();

  console.log("Worker connected to DB");
  console.log("Listening to Redis streams:", streams.join(", "));
  await ensureConsumerGroupsForStreams();

  /**
   * XREADGROUP requires: STREAMS key1 key2 ... id1 id2 ...
   * (all stream names first, then one ID per stream — usually ">".)
   * Use redis.call() so the Redis protocol is exact; some clients mis-serialize xreadgroup().
   */
  const streamIds = streams.map(() => ">");
  console.log(
    `[consumer] XREADGROUP layout: STREAMS ${streams.join(" ")} | IDs ${streamIds.join(" ")}`
  );

  while (true) {
    try {
      const response = await redis.call(
        "XREADGROUP",
        "GROUP",
        GROUP_NAME,
        CONSUMER_NAME,
        "BLOCK",
        "0",
        "STREAMS",
        ...streams,
        ...streamIds
      );

      if (!response || response.length === 0) {
        continue;
      }

      for (const streamEntry of response) {
        if (!streamEntry) {
          continue;
        }
        const [streamNameRaw, messages] = streamEntry;
        const streamName =
          streamNameRaw && typeof streamNameRaw !== "string" && streamNameRaw.toString
            ? streamNameRaw.toString()
            : streamNameRaw;
        if (!Array.isArray(messages) || messages.length === 0) {
          continue;
        }

        for (const message of messages) {
          const [messageIdRaw, fields] = message;
          const messageId =
            messageIdRaw && typeof messageIdRaw !== "string" && messageIdRaw.toString
              ? messageIdRaw.toString()
              : messageIdRaw;
          if (!messageId) {
            continue;
          }

        try {
          const payloadMap = parseFields(fields);
          const raw = payloadMap.data;

          if (typeof raw !== "string" || raw.trim() === "") {
            console.warn(`Skipping empty/invalid data for message ${messageId}`);
            logger.warn("Skipping message: empty data field", { messageId, stream: streamName });
            continue;
          }

          let data;
          try {
            data = JSON.parse(raw);
          } catch (err) {
            console.warn(`Invalid JSON for message ${messageId}:`, raw);
            logger.warn("Skipping message: invalid JSON", { messageId, stream: streamName });
            continue;
          }

          if (!data || typeof data !== "object" || Array.isArray(data)) {
            console.warn(`Skipping non-object payload for message ${messageId}`);
            logger.warn("Skipping message: payload not a plain object", { messageId, stream: streamName });
            continue;
          }

          const topic = topicFromStreamName(streamName);

          const shapeOk =
            typeof data.type === "string" &&
            data.type.length > 0 &&
            data.payload != null &&
            typeof data.payload === "object" &&
            !Array.isArray(data.payload);

          if (!shapeOk) {
            console.warn(`Invalid event shape for message ${messageId}, sending to DLQ`);
            logger.warn("Invalid event shape, sending to DLQ", { messageId, stream: streamName });
            try {
              await redis.xadd(
                "dead-letter-stream",
                "*",
                "data",
                JSON.stringify({
                  topic,
                  type: typeof data.type === "string" ? data.type : "UNKNOWN",
                  payload:
                    data.payload != null && typeof data.payload === "object" && !Array.isArray(data.payload)
                      ? data.payload
                      : {},
                  error: "invalid_event_shape",
                  createdAt: new Date().toISOString(),
                })
              );
            } catch (dlqErr) {
              console.error(`DLQ add failed for ${messageId}:`, dlqErr.message);
            }
            continue;
          }

          const topicFinal =
            typeof data.topic === "string" && data.topic.trim() !== ""
              ? data.topic.trim()
              : topic;
          const createdAtIn =
            typeof data.createdAt === "string" && !Number.isNaN(Date.parse(data.createdAt))
              ? new Date(data.createdAt).toISOString()
              : new Date().toISOString();

          const publishWs = async (evt) => {
            await redisPub.publish("events", JSON.stringify(evt));
          };

          try {
            const processedEvent = {
              topic: topicFinal,
              type: data.type,
              payload: data.payload,
              status: "processed",
              createdAt: createdAtIn,
            };
            await Event.create({
              ...processedEvent,
              createdAt: new Date(createdAtIn),
            });
            await publishWs(processedEvent);
            console.log(`Processed message ${messageId} on ${streamName} (${data.type})`);
            logger.info("Consumed and stored event", {
              messageId,
              stream: streamName,
              type: data.type,
              topic: topicFinal,
            });

            if (data.type === "ORDER_CREATED") {
              const basePayload =
                data.payload && typeof data.payload === "object" && !Array.isArray(data.payload)
                  ? data.payload
                  : {};
              await publishWs({
                topic: topicFinal,
                type: "ORDER_PROCESSING",
                payload: { ...basePayload, phase: "processing" },
                status: "processed",
                createdAt: new Date().toISOString(),
              });
              await publishWs({
                topic: topicFinal,
                type: "ORDER_COMPLETED",
                payload: { ...basePayload, phase: "completed" },
                status: "processed",
                createdAt: new Date().toISOString(),
              });
              logger.info("Emitted ORDER_PROCESSING / ORDER_COMPLETED demo events", {
                topic: topicFinal,
              });
            }
          } catch (err) {
            console.error(`Failed to process message ${messageId}:`, err.message);
            logger.error("Processing failed (will DLQ / persist failed status)", {
              messageId,
              stream: streamName,
              error: err.message,
            });
            const failedEvent = {
              topic: topicFinal,
              type: data.type,
              payload: data.payload,
              status: "failed",
              createdAt: createdAtIn,
            };
            try {
              await Event.create({
                ...failedEvent,
                createdAt: new Date(createdAtIn),
              });
            } catch (saveErr) {
              console.error(`Failed to save failed event ${messageId}:`, saveErr.message);
            }
            try {
              await redis.xadd(
                "dead-letter-stream",
                "*",
                "data",
                JSON.stringify({
                  topic: topicFinal,
                  type: data.type,
                  payload: data.payload,
                  error: err.message,
                  createdAt: new Date().toISOString(),
                })
              );
            } catch (dlqErr) {
              console.error(`DLQ add failed for ${messageId}:`, dlqErr.message);
            }
          }
        } finally {
          try {
            await redis.xack(streamName, GROUP_NAME, messageId);
          } catch (ackErr) {
            console.error(`Failed to ack message ${messageId}:`, ackErr.message);
          }
        }
        }
      }
    } catch (err) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.includes("NOGROUP")) {
        console.warn("[consumer] NOGROUP — Redis lost group or wrong STREAMS layout; re-running XGROUP CREATE");
        logger.warn("NOGROUP in XREADGROUP, re-ensuring consumer groups", { detail: msg });
        try {
          await ensureConsumerGroupsForStreams();
        } catch (reErr) {
          logger.error("Re-ensure consumer groups failed", {
            error: String(reErr && reErr.message ? reErr.message : reErr),
          });
          console.error("[consumer] Re-ensure groups failed:", reErr.message || reErr);
        }
      } else {
        console.error("Consumer loop error:", err);
        logger.error("Consumer loop error", { error: msg });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

startConsumer();