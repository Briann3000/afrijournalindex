"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const authT = t.auth as any;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to process request. Please try again.");
      }
    } catch {
      setError("Network error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      <main className="container" style={{ padding: "4rem 1rem 6rem", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#fef3c7", color: "#b45309", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "1rem" }}>
            <i className="fa-solid fa-key"></i>
          </div>
          <h1 className="page-title" style={{ fontSize: "1.85rem" }}>
            {authT.forgot_password_title || "Reset Your Password"}
          </h1>
          <p className="page-subtitle" style={{ fontSize: "0.92rem", color: "var(--color-text-muted)" }}>
            {authT.forgot_password_subtitle || "Enter your registered email address and we'll send you a secure link to reset your password."}
          </p>
        </div>

        <div className="glass-card" style={{ padding: "2.2rem", borderRadius: "16px", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1rem" }}>
                <i className="fa-solid fa-paper-plane"></i>
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.5rem" }}>
                Check Your Inbox
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: "1.5", margin: "0 0 1.5rem" }}>
                If an account exists for <strong>{email}</strong>, we have sent instructions and a secure 1-hour link to reset your password.
              </p>
              <a 
                href="/login" 
                className="btn btn-secondary" 
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>{authT.back_to_login || "Back to Sign In"}</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  <i className="fa-regular fa-envelope" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i>
                  {t.auth.email_label}
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="form-control"
                  placeholder={t.auth.email_placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.85rem", minHeight: "44px", fontSize: "0.95rem", fontWeight: 600, marginTop: "0.5rem" }}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i>
                    {authT.sending_reset || "Sending Reset Link..."}
                  </>
                ) : (
                  authT.btn_send_reset || "Send Password Reset Link"
                )}
              </button>

              <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
                <a 
                  href="/login" 
                  style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
                >
                  <i className="fa-solid fa-arrow-left"></i>
                  <span>{authT.back_to_login || "Back to Sign In"}</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
