import React, { useEffect, useState } from "react";
import "./Sidebar.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Sidebar({
  mode,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, [mode]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sessions?mode=${mode}`);
      const data = await res.json();
      if (data.success) setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await fetch(`${API_URL}/api/sessions/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s._id !== id));
    if (currentSessionId === id) onNewChat();
  };

  const groupByDate = (sessions) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const groups = { Today: [], Yesterday: [], "Past 7 Days": [], Older: [] };
    sessions.forEach((s) => {
      const d = new Date(s.updatedAt);
      if (d.toDateString() === today.toDateString()) groups["Today"].push(s);
      else if (d.toDateString() === yesterday.toDateString())
        groups["Yesterday"].push(s);
      else if ((today - d) / (1000 * 60 * 60 * 24) <= 7)
        groups["Past 7 Days"].push(s);
      else groups["Older"].push(s);
    });
    return groups;
  };

  const grouped = groupByDate(sessions);

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <span className="app-logo-side">
          study<span className="accent">AI</span>
        </span>
        <button className="new-chat-btn" onClick={onNewChat} title="New Chat">
          ✏️
        </button>
      </div>

      <div className="sidebar-list">
        {Object.entries(grouped).map(([label, items]) =>
          items.length > 0 ? (
            <div key={label} className="session-group">
              <span className="session-group-label">{label}</span>
              {items.map((s) => (
                <div
                  key={s._id}
                  className={`session-item ${currentSessionId === s._id ? "active" : ""}`}
                  onClick={() => onSelectSession(s._id)}
                >
                  <span className="session-title">{s.title || "New Chat"}</span>
                  <button
                    className="session-delete"
                    onClick={(e) => handleDelete(e, s._id)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          ) : null,
        )}
        {sessions.length === 0 && (
          <p className="sidebar-empty-text">No conversations yet.</p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
