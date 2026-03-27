import React, { useState, useRef } from "react";
import "./UploadPanel.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ACCEPTED_TYPES = [
  ".pdf",
  ".docx",
  ".pptx",
  ".txt",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
];

function UploadPanel({ onUploaded, onCancel }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    setProgress("Uploading…");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setProgress("Done!");
      onUploaded(data.document);
    } catch (err) {
      setError(err.message);
      setUploading(false);
      setProgress("");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="upload-panel">
      <div className="upload-inner">
        <button className="upload-back" onClick={onCancel}>
          ← Back
        </button>

        <h2 className="upload-title">Upload a File</h2>
        <p className="upload-sub">
          Supported: PDF, DOCX, PPTX, TXT, CSV, PNG, JPG
        </p>

        <div
          className={`drop-zone ${dragging ? "dragging" : ""} ${uploading ? "uploading" : ""}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            style={{ display: "none" }}
            onChange={onFileChange}
          />

          {uploading ? (
            <div className="upload-status">
              <div className="spinner" />
              <span>{progress}</span>
            </div>
          ) : (
            <>
              <div className="drop-icon">📂</div>
              <p className="drop-main">Drag & drop or click to browse</p>
              <p className="drop-hint">Max 10MB per file</p>
            </>
          )}
        </div>

        {error && <p className="upload-error">⚠️ {error}</p>}
      </div>
    </div>
  );
}

export default UploadPanel;
