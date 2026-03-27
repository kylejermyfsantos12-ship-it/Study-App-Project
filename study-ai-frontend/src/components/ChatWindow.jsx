import React, { useState, useEffect, useRef } from "react";
import "./ChatWindow.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function ChatWindow({ selectedDoc, selectedAI, mode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, text, role }
  const [aiWarning, setAiWarning] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when doc changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedDoc]);

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
          documentId: selectedDoc?._id || null,
          aiProvider: selectedAI,
          mode,
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

  const handleReply = (msg) => {
    setReplyTo({ id: msg.id, text: msg.text, role: msg.role });
    inputRef.current?.focus();
  };

  const cancelReply = () => setReplyTo(null);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-window">
      {/* DOC CONTEXT BAR */}
      {selectedDoc && (
        <div className="doc-bar">
          <span className="doc-bar-icon">📄</span>
          <span className="doc-bar-name">{selectedDoc.originalName}</span>
          <span className="doc-bar-badge">
            {mode === "study" ? "Study Mode" : "Code Mode"}
          </span>
        </div>
      )}

      {/* AI WARNING */}
      {aiWarning && <div className="ai-warning">⚠️ {aiWarning}</div>}

      {/* MESSAGE LIST */}
      <div className="messages-list">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            {selectedDoc ? (
              <>
                <div className="empty-icon">💬</div>
                <p className="empty-title">
                  Ask anything about <strong>{selectedDoc.originalName}</strong>
                </p>
                <p className="empty-sub">
                  Chat history is saved automatically.
                </p>
              </>
            ) : (
              <>
                <div className="empty-icon">
                  {mode === "study" ? "📚" : "💻"}
                </div>
                <p className="empty-title">
                  {mode === "study" ? "Study Mode" : "Code Mode"}
                </p>
                <p className="empty-sub">
                  {mode === "study"
                    ? "Upload a document from the sidebar to get started."
                    : "Describe what you want to build or paste your code."}
                </p>
              </>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            {/* Reply preview inside bubble */}
            {msg.replyTo && (
              <div className="reply-preview">
                <span className="reply-preview-label">
                  {msg.replyTo.role === "user" ? "You" : "AI"}
                </span>
                <span className="reply-preview-text">
                  {msg.replyTo.text.length > 80
                    ? msg.replyTo.text.slice(0, 80) + "…"
                    : msg.replyTo.text}
                </span>
              </div>
            )}

            <div className={`bubble ${msg.role}`}>
              <div className="bubble-text">{msg.text}</div>
              <div className="bubble-meta">
                {msg.aiUsed && <span className="ai-badge">{msg.aiUsed}</span>}
                <span className="bubble-time">{formatTime(msg.timestamp)}</span>
                <button
                  className="reply-btn"
                  onClick={() => handleReply(msg)}
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

      {/* INPUT AREA */}
      <div className="input-area">
        {replyTo && (
          <div className="reply-bar">
            <div className="reply-bar-content">
              <span className="reply-bar-label">
                Replying to {replyTo.role === "user" ? "yourself" : "AI"}
              </span>
              <span className="reply-bar-text">
                {replyTo.text.length > 80
                  ? replyTo.text.slice(0, 80) + "…"
                  : replyTo.text}
              </span>
            </div>
            <button className="reply-cancel" onClick={cancelReply}>
              ✕
            </button>
          </div>
        )}

        <div className="input-row">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={
              mode === "study"
                ? selectedDoc
                  ? `Ask about ${selectedDoc.originalName}…`
                  : "Ask anything…"
                : "Describe what to build or paste your code…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`send-btn ${loading ? "disabled" : ""}`}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            {loading ? "…" : "↑"}
          </button>
        </div>
        <p className="input-hint">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

export default ChatWindow;
