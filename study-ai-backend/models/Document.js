const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ["pdf", "docx", "pptx", "image", "txt", "csv"],
    required: true,
  },
  extractedText: {
    type: String,
    default: "",
  },
  cloudinaryUrl: {
    type: String,
    default: "",
  },
  cloudinaryPublicId: {
    type: String,
    default: "",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Document", DocumentSchema);
