"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "How do I index my journal?",
  "What is AfriScholar ID (ASID)?",
  "How can I claim my profile?",
  "Global indexing for Scopus & WoS"
];

export default function AIAssistantWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! Welcome to AfriJournal Index. I am your 24/7 Editorial & Scholar Assistant. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      const reply = data.reply || "Thank you. Our editorial team can also be reached at afrijournalindex@gmail.com.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I am having trouble connecting. Please feel free to email our editorial desk at afrijournalindex@gmail.com or reach us on WhatsApp."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 99999 }}>
      {/* Expanded Chat Box */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            right: "0",
            width: "360px",
            maxWidth: "calc(100vw - 32px)",
            height: "500px",
            maxHeight: "calc(100vh - 100px)",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              padding: "1rem 1.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  color: "#ffffff"
                }}
              >
                AJI
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.2 }}>AfriJournal Assistant</div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                  Online • 24/7 Editorial Support
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: "1.1rem",
                cursor: "pointer",
                padding: "4px"
              }}
              title="Close chat"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
              backgroundColor: "#f8fafc"
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    maxWidth: "84%",
                    padding: "0.7rem 0.95rem",
                    borderRadius: m.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: m.role === "user" ? "#ea580c" : "#ffffff",
                    color: m.role === "user" ? "#ffffff" : "#1e293b",
                    fontSize: "0.85rem",
                    lineHeight: 1.45,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "0.6rem 0.9rem",
                    borderRadius: "14px 14px 14px 2px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Consulting AfriJournal registry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Pills */}
          {messages.length <= 2 && (
            <div style={{ padding: "0.5rem 0.8rem", background: "#f1f5f9", display: "flex", gap: "6px", overflowX: "auto", borderTop: "1px solid #e2e8f0" }}>
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(q)}
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "12px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#334155",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: "0.75rem",
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about indexing, ASID, journals..."
              style={{
                flex: 1,
                padding: "0.55rem 0.85rem",
                borderRadius: "20px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: input.trim() && !loading ? "#ea580c" : "#cbd5e1",
                color: "#ffffff",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <i className="fa-solid fa-paper-plane" style={{ fontSize: "0.8rem" }}></i>
            </button>
          </form>

          {/* Direct Human Fallback Line */}
          <div
            style={{
              background: "#fafaf9",
              padding: "5px 12px",
              textAlign: "center",
              fontSize: "0.68rem",
              color: "#64748b",
              borderTop: "1px solid #f1f5f9"
            }}
          >
            Prefer WhatsApp?{" "}
            <a
              href="https://wa.me/254725788400?text=Hello%20AfriJournal%20Support"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#16a34a", fontWeight: 700, textDecoration: "none" }}
            >
              Chat on WhatsApp <i className="fa-brands fa-whatsapp"></i>
            </a>
          </div>
        </div>
      )}

      {/* Floating Corner Bubble Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#ea580c",
          color: "#ffffff",
          border: "none",
          boxShadow: "0 6px 20px rgba(234, 88, 12, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.45rem",
          cursor: "pointer",
          transition: "transform 0.2s, background-color 0.2s"
        }}
        title="Chat with AfriJournal Assistant"
      >
        <i className={isOpen ? "fa-solid fa-chevron-down" : "fa-solid fa-headset"}></i>
      </button>
    </div>
  );
}
