import React from "react";
import "./Sidebar.css";

function Sidebar({
  documents,
  selectedDoc,
  setSelectedDoc,
  onUploadClick,
  mode,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">
          {mode === "study" ? "Documents" : "Project Files"}
        </span>
        <button
          className="upload-btn"
          onClick={onUploadClick}
          title="Upload file"
        >
          +
        </button>
      </div>

      <div className="sidebar-list">
        {documents.length === 0 ? (
          <div className="sidebar-empty">
            <p>No files yet.</p>
            <button className="upload-cta" onClick={onUploadClick}>
              Upload a file
            </button>
          </div>
        ) : (
          documents.map((doc) => (
            <button
              key={doc._id}
              className={`doc-item ${selectedDoc?._id === doc._id ? "active" : ""}`}
              onClick={() => setSelectedDoc(doc)}
            >
              <span className="doc-item-icon">{getIcon(doc.fileType)}</span>
              <span className="doc-item-name">{doc.originalName}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

function getIcon(fileType) {
  switch (fileType) {
    case "pdf":
      return "📄";
    case "docx":
      return "📝";
    case "pptx":
      return "📊";
    case "image":
      return "🖼️";
    default:
      return "📁";
  }
}

export default Sidebar;
