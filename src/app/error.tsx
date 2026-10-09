"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AfriJournal Index Runtime Error:", error);
  }, [error]);

  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "2rem",
        background: "var(--color-bg-light, #f8f9fa)"
      }}
    >
      <div 
        className="card-surface" 
        style={{ 
          maxWidth: "560px", 
          width: "100%", 
          textAlign: "center", 
          padding: "3.5rem 2rem",
          borderRadius: "16px",
          background: "#fff",
          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
          border: "1px solid rgba(220, 53, 69, 0.2)"
        }}
      >
        <div 
          style={{ 
            width: "72px", 
            height: "72px", 
            borderRadius: "50%", 
            background: "rgba(220, 53, 69, 0.1)", 
            color: "#dc3545",
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontSize: "2rem",
            marginBottom: "1.5rem"
          }}
        >
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-main, #212529)", marginBottom: "0.75rem" }}>
          Something went wrong
        </h1>

        <p style={{ color: "var(--color-text-body, #6c757d)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "2rem" }}>
          An unexpected error occurred while processing this request. Our technical team has been notified.
        </p>

        {error?.digest && (
          <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.5rem", fontFamily: "monospace" }}>
            Error Reference ID: {error.digest}
          </p>
        )}

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button 
            onClick={() => reset()} 
            className="btn btn-primary" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              border: "none",
              borderRadius: "8px"
            }}
          >
            <i className="fa-solid fa-rotate-right"></i>
            Try Again
          </button>

          <Link 
            href="/" 
            className="btn btn-secondary" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              padding: "0.75rem 1.5rem",
              textDecoration: "none",
              borderRadius: "8px"
            }}
          >
            <i className="fa-solid fa-house"></i>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
