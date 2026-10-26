"use client";

import React, { useState } from "react";

export default function WhatsAppSupport() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "26px",
        right: "26px",
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}
    >
      {/* Tooltip Pill on Hover */}
      {hovered && (
        <div
          style={{
            background: "#0f172a",
            color: "#ffffff",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "0.8rem",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            animation: "fadeIn 0.15s ease-out"
          }}
        >
          Chat with AfriJournal Index Support
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/254725788400?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20AfriJournal%20Indexing%20services."
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with AfriJournal Support on WhatsApp (+254 725 788 400)"
        aria-label="Contact AfriJournal Index on WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          backgroundColor: "#25D366",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: hovered
            ? "0 10px 28px rgba(37, 211, 102, 0.55)"
            : "0 6px 20px rgba(37, 211, 102, 0.38)",
          cursor: "pointer",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease",
          fontSize: "1.75rem",
          textDecoration: "none"
        }}
      >
        <i className="fa-brands fa-whatsapp"></i>
      </a>
    </div>
  );
}
