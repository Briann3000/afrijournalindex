"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("aji_cookie_consent");
      if (!consent) {
        // Small delay so it smoothly animates in after page load
        const timer = setTimeout(() => setVisible(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage disabled or private browsing
    }
  }, []);

  const handleConsent = (level: "all" | "essential") => {
    try {
      localStorage.setItem("aji_cookie_consent", level);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        right: "1rem",
        maxWidth: "860px",
        margin: "0 auto",
        zIndex: 99999,
        background: "#0f172a",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.6)",
        borderRadius: "14px",
        padding: "1.1rem 1.4rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.25rem",
        flexWrap: "wrap",
        animation: "fadeInUp 0.3s ease-out"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1, minWidth: "260px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            flexShrink: 0
          }}
        >
          <i className="fa-solid fa-cookie-bite"></i>
        </div>
        <div>
          <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: "0.88rem", marginBottom: "3px" }}>
            Cookie &amp; Research Privacy Notice
          </div>
          <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>
            AfriJournal Index uses essential cookies to authenticate scholar sessions, preserve reading lists, and measure continental citation provenance. See our{" "}
            <Link href="/privacy" style={{ color: "#10b981", textDecoration: "underline" }}>
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => handleConsent("essential")}
          style={{
            background: "transparent",
            border: "1px solid #334155",
            color: "#cbd5e1",
            borderRadius: "8px",
            padding: "0.45rem 0.85rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={() => handleConsent("all")}
          style={{
            background: "#10b981",
            border: "1px solid #059669",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "0.45rem 1rem",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
