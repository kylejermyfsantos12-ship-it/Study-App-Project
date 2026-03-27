const express = require("express");
const router = express.Router();
const Document = require("../models/Document");

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { documentId, message, chatHistory = [] } = req.body;

    if (!documentId || !message) {
      return res
        .status(400)
        .json({ error: "documentId and message are required" });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Build message array with full chat history
    const messages = [
      // Inject document as first context message
      {
        role: "user",
        content: `Here is the document I want to discuss:\n\n${document.extractedText}`,
      },
      {
        role: "assistant",
        content: `I have read the document "${document.originalName}". Ask me anything about it.`,
      },
      // Append all previous messages from history
      ...chatHistory,
      // Append the new message
      {
        role: "user",
        content: message,
      },
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 2048,
          messages: [
            {
              role: "system",
              content: `You are an intelligent academic study assistant. Always reference the uploaded document when answering. Cite which part of the document your answer comes from. Explain concepts clearly, as if teaching a student. Never make up information not in the document. Tone: friendly, patient, encouraging.`,
            },
            ...messages,
          ],
        }),
      },
    );

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.json({
      success: true,
      reply,
      aiUsed: "groq",
    });
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: "Failed to get response" });
  }
});

module.exports = router;
