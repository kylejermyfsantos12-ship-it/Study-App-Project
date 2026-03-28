const express = require("express");
const router = express.Router();
const Session = require("../models/Session");

// GET /api/sessions?mode=study  — list all sessions for a mode
router.get("/", async (req, res) => {
  try {
    const { mode } = req.query;
    const query = mode ? { mode } : {};
    const sessions = await Session.find(query)
      .sort({ updatedAt: -1 })
      .select("title mode createdAt updatedAt")
      .lean();
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id  — get full session with messages
router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id
router.delete("/:id", async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
