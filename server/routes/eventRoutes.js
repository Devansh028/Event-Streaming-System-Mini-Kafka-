const express = require('express');
const router = express.Router();
const { createEvent, publish, getDlqFromRedis } = require('../controllers/eventController');
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/event", createEvent);
router.post("/publish", publish);
router.get("/events/dlq", getDlqFromRedis);

module.exports = router;