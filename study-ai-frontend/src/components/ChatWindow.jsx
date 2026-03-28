import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import "./ChatWindow.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function ChatWindow({ mode, selectedAI, currentSessionId, onSessionCreated }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [aiWarning, setAiWarning] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load session messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSession(currentSessionId);
    } else {
      setMessages([]);
      setSelectedDoc(null);
      setAiWarning("");
    }
  }, [currentSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentSessionId]);

  const loadSession = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(
          data.session.messages.map((m) => ({
            id: m._id,
            role: m.role,
            text: m.text,
            aiUsed: m.aiUsed,
            replyTo: m.replyTo,
            timestamp: m.timestamp,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSelectedDoc(data.document);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      replyTo: replyTo || null,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setReplyTo(null);
    setLoading(true);
    setAiWarning("");

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          documentId: selectedDoc?.id || null,
          aiProvider: selectedAI,
          mode,
          sessionId: currentSessionId,
          history: messages.map((m) => ({ role: m.role, content: m.text })),
          replyTo: replyTo
            ? { role: replyTo.role, content: replyTo.text }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");

      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        text: data.reply,
        aiUsed: data.aiUsed || selectedAI,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (data.warning) setAiWarning(data.warning);

      // If new session was created, notify App
      if (data.sessionId && !currentSessionId) {
        onSessionCreated(data.sessionId);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "error",
          text: `Error: ${err.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="chat-window">
      {aiWarning && <div className="ai-warning">⚠️ {aiWarning}</div>}

      {selectedDoc && (
        <div className="doc-bar">
          <span className="doc-bar-icon">📄</span>
          <span className="doc-bar-name">{selectedDoc.originalName}</span>
          <button
            className="doc-bar-remove"
            onClick={() => setSelectedDoc(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="messages-list">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">{mode === "study" ? "📚" : "💻"}</div>
            <p className="empty-title">
              {mode === "study" ? "Study Mode" : "Code Mode"}
            </p>
            <p className="empty-sub">
              {mode === "study"
                ? "Upload a file or ask anything to get started."
                : "Describe what you want to build or paste your code."}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            {msg.replyTo && (
              <div className="reply-preview">
                <span className="reply-preview-label">
                  {msg.replyTo.role === "user" ? "You" : "AI"}
                </span>
                <span className="reply-preview-text">
                  {msg.replyTo.text?.length > 80
                    ? msg.replyTo.text.slice(0, 80) + "…"
                    : msg.replyTo.text}
                </span>
              </div>
            )}
            <div className={`bubble ${msg.role}`}>
              <div className="bubble-text">
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
              <div className="bubble-meta">
                {msg.aiUsed && <span className="ai-badge">{msg.aiUsed}</span>}
                <span className="bubble-time">{formatTime(msg.timestamp)}</span>
                <button
                  className="reply-btn"
                  onClick={() => {
                    setReplyTo({ id: msg.id, text: msg.text, role: msg.role });
                    inputRef.current?.focus();
                  }}
                  title="Reply"
                >
                  ↩
                </button>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row assistant">
            <div className="bubble assistant loading-bubble">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        {replyTo && (
          <div className="reply-bar">
            <div className="reply-bar-content">
              <span className="reply-bar-label">
                Replying to {replyTo.role === "user" ? "yourself" : "AI"}
              </span>
              <span className="reply-bar-text">
                {replyTo.text?.length > 80
                  ? replyTo.text.slice(0, 80) + "…"
                  : replyTo.text}
              </span>
            </div>
            <button className="reply-cancel" onClick={() => setReplyTo(null)}>
              ✕
            </button>
          </div>
        )}

        <div className="input-box">
          <div className="input-top">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={
                mode === "study"
                  ? "Ask anything…"
                  : "Describe what to build or paste your code…"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
          <div className="input-bottom">
            <div className="input-left-actions">
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept=".pdf,.docx,.pptx,.txt,.csv,.png,.jpg,.jpeg"
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
              <button
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                disabled={uploading}
              >
                {uploading ? "⏳" : "📎"}
              </button>
              {selectedDoc && (
                <span className="attached-name">
                  📄 {selectedDoc.originalName}
                </span>
              )}
            </div>
            <div className="input-right-actions">
              <span className="input-hint">
                Enter to send · Shift+Enter for new line
              </span>
              <button
                className={`send-btn ${loading || !input.trim() ? "disabled" : ""}`}
                onClick={sendMessage}
                disabled={loading || !input.trim()}
              >
                {loading ? "…" : "↑"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
