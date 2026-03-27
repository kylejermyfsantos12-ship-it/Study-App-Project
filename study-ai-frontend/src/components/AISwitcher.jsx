import React, { useState, useRef, useEffect } from "react";
import "./AISwitcher.css";

const STUDY_AIs = [
  { id: "groq", label: "Llama 3.3 70B", via: "Groq", badge: "default" },
  { id: "gemini", label: "Gemini Flash 2.0", via: "Gemini", badge: "" },
  { id: "deepseek", label: "DeepSeek V3", via: "OpenRouter", badge: "" },
];

const CODE_AIs = [
  {
    id: "qwen3",
    label: "Qwen3 Coder 480B",
    via: "OpenRouter",
    badge: "default",
  },
  { id: "qwen25", label: "Qwen2.5 Coder 32B", via: "OpenRouter", badge: "" },
  { id: "groq", label: "Llama 3.3 70B", via: "Groq", badge: "" },
];

function AISwitcher({ selectedAI, setSelectedAI, mode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const list = mode === "study" ? STUDY_AIs : CODE_AIs;
  const current = list.find((a) => a.id === selectedAI) || list[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset to mode default when mode changes
  useEffect(() => {
    setSelectedAI(mode === "study" ? "groq" : "qwen3");
  }, [mode, setSelectedAI]);

  return (
    <div className="ai-switcher" ref={ref}>
      <button className="ai-trigger" onClick={() => setOpen((v) => !v)}>
        <span className="ai-trigger-dot" />
        <span className="ai-trigger-label">{current.label}</span>
        <span className="ai-trigger-via">{current.via}</span>
        <span className={`ai-trigger-arrow ${open ? "open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="ai-dropdown">
          <div className="ai-dropdown-header">
            {mode === "study" ? "Study Mode AIs" : "Code Mode AIs"}
          </div>
          {list.map((ai) => (
            <button
              key={ai.id}
              className={`ai-option ${selectedAI === ai.id ? "active" : ""}`}
              onClick={() => {
                setSelectedAI(ai.id);
                setOpen(false);
              }}
            >
              <span className="ai-option-dot" />
              <span className="ai-option-info">
                <span className="ai-option-label">{ai.label}</span>
                <span className="ai-option-via">via {ai.via}</span>
              </span>
              {ai.badge && <span className="ai-option-badge">{ai.badge}</span>}
              {selectedAI === ai.id && <span className="ai-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AISwitcher;
