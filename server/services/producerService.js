const { addEventToStream } = require("../streams/eventStream");

const publishEvent = async (event, topic = "default") => {
    await addEventToStream(event, topic);
};

module.exports = { publishEvent };