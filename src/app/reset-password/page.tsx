"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

function ResetPasswordForm() {
  const { t } = useLang();
  const authT = t.auth as any;
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(authT.password_mismatch || "Passwords do not match. Please re-enter.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password. Link may be expired.");
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="glass-card" style={{ padding: "2.2rem", borderRadius: "16px", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", textAlign: "center" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1rem" }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.5rem" }}>
          Invalid or Missing Reset Link
        </h3>
        <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: "0 0 1.5rem" }}>
          This password reset link is invalid or incomplete. Please request a new link from the login page.
        </p>
        <a href="/forgot-password" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          Request New Link
        </a>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "2.2rem", borderRadius: "16px", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
      {success ? (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1rem" }}>
            <i className="fa-solid fa-circle-check"></i>
          </div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.5rem" }}>
            Password Reset Successful!
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: "1.5", margin: "0 0 1.5rem" }}>
            {authT.reset_success || "Your password has been successfully updated! Redirecting to login..."}
          </p>
          <a href="/login" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            Sign In Now
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

          <div style={{ background: "var(--color-bg-card-subtle)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
            Resetting password for: <strong style={{ color: "var(--color-navy)" }}>{email}</strong>
          </div>

          <div className="form-group">
            <label htmlFor="new-password" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
              <i className="fa-solid fa-lock" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i>
              {authT.new_password_label || "New Password"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="new-password"
                required
                minLength={6}
                className="form-control"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "42px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
              <i className="fa-solid fa-lock" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i>
              {authT.confirm_password_label || "Confirm New Password"}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirm-password"
              required
              minLength={6}
              className="form-control"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                {authT.updating_password || "Updating Password..."}
              </>
            ) : (
              authT.btn_update_password || "Update Password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLang();
  const authT = t.auth as any;

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      <main className="container" style={{ padding: "4rem 1rem 6rem", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "1rem" }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h1 className="page-title" style={{ fontSize: "1.85rem" }}>
            {authT.reset_password_title || "Choose New Password"}
          </h1>
          <p className="page-subtitle" style={{ fontSize: "0.92rem", color: "var(--color-text-muted)" }}>
            {authT.reset_password_subtitle || "Please enter and confirm your new secure password below."}
          </p>
        </div>

        <Suspense fallback={
          <div className="glass-card" style={{ padding: "2rem", textAlign: "center", borderRadius: "16px", background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px", color: "var(--color-primary)" }}></i>
            Loading security verification...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
