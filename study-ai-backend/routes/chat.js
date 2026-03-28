const express = require("express");
const router = express.Router();
const Document = require("../models/Document");
const Session = require("../models/Session");
const { routeToAI } = require("../utils/aiRouter");
const { getSystemPrompt } = require("../utils/systemPrompts");

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const {
      message,
      documentId,
      aiProvider = "groq",
      mode = "study",
      sessionId,
      history = [],
      replyTo = null,
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // Build message array for AI
    const messages = [];

    // Inject document context if a doc is selected
    if (documentId) {
      const document = await Document.findById(documentId);
      if (document && document.extractedText) {
        messages.push({
          role: "user",
          content: `Here is the document I want to discuss:\n\n${document.extractedText}`,
        });
        messages.push({
          role: "assistant",
          content: `I have read the document "${document.originalName}". Ask me anything about it.`,
        });
      }
    }

    // Append chat history
    history.forEach((m) => {
      messages.push({ role: m.role, content: m.content });
    });

    // Append the new message (with reply context if replying)
    if (replyTo) {
      messages.push({
        role: "user",
        content: `[Replying to: "${replyTo.content?.slice(0, 200) || ""}"]\n\n${message}`,
      });
    } else {
      messages.push({ role: "user", content: message });
    }

    // Get system prompt for this mode
    const systemPrompt = getSystemPrompt(mode);

    // Route to the selected AI
    const { reply, aiUsed, warning } = await routeToAI(
      aiProvider,
      messages,
      systemPrompt,
    );

    // Save to session in MongoDB
    let session;
    if (sessionId) {
      session = await Session.findById(sessionId);
    }

    if (!session) {
      // Create new session, title = first 40 chars of first message
      session = new Session({
        mode,
        title: message.slice(0, 40) + (message.length > 40 ? "…" : ""),
      });
    }

    // Push user message
    session.messages.push({
      role: "user",
      text: message,
      replyTo: replyTo
        ? { role: replyTo.role, text: replyTo.content }
        : undefined,
    });

    // Push assistant reply
    session.messages.push({
      role: "assistant",
      text: reply,
      aiUsed,
    });

    session.updatedAt = new Date();
    await session.save();

    res.json({
      success: true,
      reply,
      aiUsed,
      warning: warning || null,
      sessionId: session._id,
    });
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: "Failed to get response: " + error.message });
  }
});

module.exports = router;
