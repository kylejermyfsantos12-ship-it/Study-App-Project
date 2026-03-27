import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import UploadPanel from "./components/UploadPanel";
import AISwitcher from "./components/AISwitcher";
import "./App.css";

function App() {
  const [mode, setMode] = useState("study"); // 'study' | 'code'
  const [selectedDoc, setSelectedDoc] = useState(null); // currently active document
  const [documents, setDocuments] = useState([]); // all uploaded docs
  const [selectedAI, setSelectedAI] = useState("groq"); // active AI provider
  const [showUpload, setShowUpload] = useState(false); // toggle upload panel

  const handleDocumentUploaded = (doc) => {
    setDocuments((prev) => [doc, ...prev]);
    setSelectedDoc(doc);
    setShowUpload(false);
  };

  return (
    <div className="app">
      {/* TOP BAR */}
      <header className="app-header">
        <div className="header-left">
          <span className="app-logo">
            study<span className="accent">AI</span>
          </span>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === "study" ? "active" : ""}`}
              onClick={() => setMode("study")}
            >
              Study
            </button>
            <button
              className={`mode-btn ${mode === "code" ? "active" : ""}`}
              onClick={() => setMode("code")}
            >
              Code
            </button>
          </div>
        </div>
        <div className="header-right">
          <AISwitcher
            selectedAI={selectedAI}
            setSelectedAI={setSelectedAI}
            mode={mode}
          />
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="app-body">
        <Sidebar
          documents={documents}
          selectedDoc={selectedDoc}
          setSelectedDoc={setSelectedDoc}
          onUploadClick={() => setShowUpload(true)}
          mode={mode}
        />

        <main className="main-content">
          {showUpload ? (
            <UploadPanel
              onUploaded={handleDocumentUploaded}
              onCancel={() => setShowUpload(false)}
            />
          ) : (
            <ChatWindow
              selectedDoc={selectedDoc}
              selectedAI={selectedAI}
              mode={mode}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
