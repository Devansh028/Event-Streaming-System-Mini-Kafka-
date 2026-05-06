let totalPublishedToStream = 0;
let totalPublishDurationMs = 0;

/** Timestamps (ms) of API publishes in the last 10s window for events/sec. */
const publishTimestamps = [];
const PUBLISH_WINDOW_MS = 10_000;

const recordPublish = (durationMs) => {
  const n = Number(durationMs) || 0;
  totalPublishedToStream += 1;
  totalPublishDurationMs += n;
};

const prunePublishTimestamps = (now) => {
  while (publishTimestamps.length > 0 && now - publishTimestamps[0] > PUBLISH_WINDOW_MS) {
    publishTimestamps.shift();
  }
};

const recordPublishEventTime = () => {
  const now = Date.now();
  publishTimestamps.push(now);
  prunePublishTimestamps(now);
};

const getEventsPerSecond = () => {
  const now = Date.now();
  prunePublishTimestamps(now);
  return publishTimestamps.length / 10;
};

const getRuntimeSnapshot = () => ({
  totalPublishedToStream,
  avgPublishMs:
    totalPublishedToStream > 0
      ? Math.round((totalPublishDurationMs / totalPublishedToStream) * 100) / 100
      : 0,
  eventsPerSecond: getEventsPerSecond(),
});

module.exports = { recordPublish, recordPublishEventTime, getRuntimeSnapshot, getEventsPerSecond };
