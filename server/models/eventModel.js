const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: String,
    type: String,
    payload: Object,
    topic: {
        type: String,
        default: "default"
    },
    status: { type: String, enum: ["pending", "processed", "failed", "retrying"], default: "pending" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);