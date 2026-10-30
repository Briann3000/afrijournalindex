"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../Header";
import Footer from "../../Footer";

export default function ReviewTrackLookupPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError("Please enter a tracking code.");
      return;
    }
    router.push(`/review/track/${clean}`);
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)", color: "var(--color-text-main)" }}>
      <Header activePage="reviewer" />

      <main style={{ flex: 1, maxWidth: "700px", margin: "0 auto", padding: "4rem 1.5rem 6rem", width: "100%", boxSizing: "border-box" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "2rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/reviewer" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Reviewer Desk</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>Track Manuscript</span>
        </div>

        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "2.5rem 2rem", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)", textAlign: "center" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--color-primary-light)", border: "1px solid rgba(180, 83, 9, 0.2)", color: "var(--color-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "1.25rem" }}>
            <i className="fa-solid fa-magnifying-glass-location"></i>
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.6rem" }}>
            Track Peer Review Progress
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", lineHeight: 1.6, maxWidth: "520px", margin: "0 auto 2rem" }}>
            Enter your manuscript tracking reference code to check reviewer matching status, cascade timers, or access completed evaluation reports.
          </p>

          <form onSubmit={handleLookup} style={{ maxWidth: "480px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. REV-2026-B81C10"
                style={{
                  flex: 1,
                  padding: "0.8rem 1rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  background: "var(--color-bg-card-subtle)",
                  border: error ? "1px solid #ef4444" : "1px solid var(--color-border)",
                  borderRadius: "8px",
                  color: "var(--color-text-main)",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "0.8rem 1.5rem", fontSize: "0.92rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <span>Track</span>
                <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            {error && (
              <div style={{ color: "#ef4444", fontSize: "0.85rem", textAlign: "left", marginBottom: "1rem" }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "6px" }}></i>
                {error}
              </div>
            )}

            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textAlign: "center" }}>
              Lost your code? Log in and open the <Link href="/reviewer" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Reviewer Desk</Link> to view all manuscripts lodged under your account.
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
