const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// GET /api/history — load chat history for a session
router.get("/", async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"] || "default";
    const messages = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    res.json({ success: true, messages });
  } catch (error) {
    console.error("History GET error:", error);
    res.status(500).json({ error: "Failed to load history" });
  }
});

// DELETE /api/history — clear chat history for a session
router.delete("/", async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"] || "default";
    await Message.deleteMany({ sessionId });
    res.json({ success: true, message: "History cleared" });
  } catch (error) {
    console.error("History DELETE error:", error);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

module.exports = router;
