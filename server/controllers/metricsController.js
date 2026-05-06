const Event = require("../models/eventModel");
const redis = require("../config/redis");
const { getRuntimeSnapshot } = require("../utils/runtimeMetrics");

const getMetrics = async (req, res) => {
  const [totalEvents, processedEvents, failedEvents, dlqCount] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments({ status: "processed" }),
    Event.countDocuments({ status: "failed" }),
    redis.xlen("dead-letter-stream").catch(() => 0),
  ]);

  const runtime = getRuntimeSnapshot();

  res.json({
    totalEvents,
    processedEvents,
    failedEvents,
    dlqCount,
    eventsPerSecond: runtime.eventsPerSecond,
    totalPublishedToStream: runtime.totalPublishedToStream,
    avgPublishMs: runtime.avgPublishMs,
  });
};

module.exports = { getMetrics };
