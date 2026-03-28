import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import AISwitcher from "./components/AISwitcher";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [mode, setMode] = useState("study");
  const [selectedAI, setSelectedAI] = useState("groq");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sidebarKey, setSidebarKey] = useState(0);

  const handleNewChat = () => {
    setCurrentSessionId(null);
  };

  const handleSelectSession = (id) => {
    setCurrentSessionId(id);
  };

  const handleSessionCreated = (id) => {
    setCurrentSessionId(id);
    setSidebarKey((k) => k + 1); // refresh sidebar list
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setCurrentSessionId(null);
    setSelectedAI(newMode === "study" ? "groq" : "qwen3");
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === "study" ? "active" : ""}`}
              onClick={() => handleModeSwitch("study")}
            >
              Study
            </button>
            <button
              className={`mode-btn ${mode === "code" ? "active" : ""}`}
              onClick={() => handleModeSwitch("code")}
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

      <div className="app-body">
        <Sidebar
          key={sidebarKey}
          mode={mode}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={() => setSidebarKey((k) => k + 1)}
        />
        <main className="main-content">
          <ChatWindow
            mode={mode}
            selectedAI={selectedAI}
            currentSessionId={currentSessionId}
            onSessionCreated={handleSessionCreated}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
