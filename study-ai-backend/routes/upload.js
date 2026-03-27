const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const cloudinary = require("cloudinary").v2;
const Document = require("../models/Document");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer — store file in memory, not disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "text/plain",
      "text/csv",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },
});

// Helper — detect file type from mimetype
function getFileType(mimetype) {
  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.includes("wordprocessingml")) return "docx";
  if (mimetype.includes("presentationml")) return "pptx";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype === "text/csv") return "csv";
  return "txt";
}

// Helper — extract text based on file type
async function extractText(file) {
  const { mimetype, buffer } = file;

  if (mimetype === "application/pdf") {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (mimetype.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimetype === "text/plain" || mimetype === "text/csv") {
    return buffer.toString("utf-8");
  }

  // Images and PPTX — no text extraction, handled by AI vision later
  return "";
}

// POST /api/upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { originalname, mimetype, buffer } = req.file;

    // 1. Extract text
    const extractedText = await extractText(req.file);

    // 2. Upload file to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "study-ai",
          public_id: `${Date.now()}_${originalname}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(buffer);
    });

    // 3. Save document record to MongoDB
    const document = new Document({
      filename: uploadResult.public_id,
      originalName: originalname,
      fileType: getFileType(mimetype),
      extractedText,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
    });

    await document.save();

    res.json({
      success: true,
      document: {
        id: document._id,
        originalName: document.originalName,
        fileType: document.fileType,
        cloudinaryUrl: document.cloudinaryUrl,
        hasText: extractedText.length > 0,
      },
    });
  } catch (error) {
    console.error("Upload route error:", error);
    res.status(500).json({ error: "Upload failed: " + error.message });
  }
});

module.exports = router;
