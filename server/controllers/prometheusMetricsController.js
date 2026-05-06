const Event = require("../models/eventModel");
const { getRuntimeSnapshot } = require("../utils/runtimeMetrics");

const getPrometheusMetrics = async (req, res) => {
  try {
    const [totalEvents, processedEvents, failedEvents] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: "processed" }),
      Event.countDocuments({ status: "failed" }),
    ]);

    const runtime = getRuntimeSnapshot();
    const eps = runtime.eventsPerSecond ?? 0;

    const lines = [
      "# HELP events_db_total Total event documents in MongoDB",
      "# TYPE events_db_total gauge",
      `events_db_total ${totalEvents}`,
      "# HELP events_db_processed Processed event documents",
      "# TYPE events_db_processed gauge",
      `events_db_processed ${processedEvents}`,
      "# HELP events_db_failed Failed event documents",
      "# TYPE events_db_failed gauge",
      `events_db_failed ${failedEvents}`,
      "# HELP events_published_total Events published to Redis stream (this process)",
      "# TYPE events_published_total counter",
      `events_published_total ${runtime.totalPublishedToStream}`,
      "# HELP event_publish_duration_ms_avg Average publish duration in ms (this process)",
      "# TYPE event_publish_duration_ms_avg gauge",
      `event_publish_duration_ms_avg ${runtime.avgPublishMs}`,
      "# HELP events_publish_rate_per_s API publish rate over last 10s window (this process)",
      "# TYPE events_publish_rate_per_s gauge",
      `events_publish_rate_per_s ${eps}`,
      "",
    ];

    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    return res.send(lines.join("\n"));
  } catch (err) {
    return res.status(500).send(`# error ${err.message}\n`);
  }
};

module.exports = getPrometheusMetrics;
