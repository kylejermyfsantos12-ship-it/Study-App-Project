const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant", "error"], required: true },
  text: { type: String, required: true },
  aiUsed: { type: String, default: "" },
  replyTo: {
    role: { type: String, default: null },
    text: { type: String, default: null },
  },
  timestamp: { type: Date, default: Date.now },
});

const SessionSchema = new mongoose.Schema({
  title: { type: String, default: "New Chat" },
  mode: { type: String, enum: ["study", "code"], default: "study" },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", SessionSchema);
