const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const requireAdmin = require("../middlewares/requireAdmin");
const { retryFromDlq } = require("../controllers/retryController");

router.post("/retry", authMiddleware, requireAdmin, retryFromDlq);

module.exports = router;
