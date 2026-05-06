const redis = require('../config/redis');

const streamNameForTopic = (topic) => `${topic}-stream`;

/** Default topic stream; used by worker and when topic is omitted. */
const STREAM_NAME = streamNameForTopic("default");

const addEventToStream = async (event, topic = "default") => {
    const stream = streamNameForTopic(topic);
    const id = await redis.xadd(
        stream,
        "*",
        "data",
        JSON.stringify(event)
    );
    const t = event && typeof event.type === "string" ? event.type : "?";
    console.log(`[publish] XADD ${stream} id=${id} topic=${topic} type=${t}`);
};

module.exports = { addEventToStream, streamNameForTopic, STREAM_NAME };