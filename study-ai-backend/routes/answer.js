const express = require("express");
const router = express.Router();
const Document = require("../models/Document");

// POST /api/answer
router.post("/", async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: "documentId is required" });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (!document.extractedText) {
      return res.status(400).json({ error: "Document has no extracted text" });
    }

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
          max_tokens: 4096,
          messages: [
            {
              role: "system",
              content: `You are an intelligent academic study assistant. Always reference the uploaded document when answering. Explain concepts clearly, as if teaching a student. When you detect exam questions, answer each one thoroughly. Tone: friendly, patient, encouraging.`,
            },
            {
              role: "user",
              content: `Find every question in the document below — numbered items, fill-in-the-blanks, essay prompts, multiple choice — and answer each one correctly with a clear explanation.

Format exactly like this:
Question 1: [the question]
Answer: [correct answer + explanation]

If there are no questions, summarize the key points instead.

Document:
${document.extractedText}`,
            },
          ],
        }),
      },
    );

    const data = await response.json();
    const answer = data.choices[0].message.content;

    res.json({
      success: true,
      documentName: document.originalName,
      aiUsed: "groq",
      answer,
    });
  } catch (error) {
    console.error("Answer route error:", error);
    res.status(500).json({ error: "Failed to process document" });
  }
});

module.exports = router;
