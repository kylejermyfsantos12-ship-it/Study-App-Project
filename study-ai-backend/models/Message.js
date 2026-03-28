const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant", "error"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  aiUsed: {
    type: String,
    default: "",
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    default: null,
  },
  replyTo: {
    role: { type: String, default: null },
    content: { type: String, default: null },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", MessageSchema);
