"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if session is already active
  useEffect(() => {
    let isMounted = true;
    async function verifyExistingSession() {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (isMounted && data.authenticated && data.isAdmin) {
          router.replace("/admin");
          return;
        }
      } catch {
        // Proceed with login
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }
    verifyExistingSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Authentication confirmed. Accessing Editorial Portal...");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 500);
      } else {
        setError(data.error || "Authentication failed. Please verify credentials.");
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="admin-login-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#090d16", color: "#94a3b8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "#10b981", fontSize: "1.2rem" }}></i>
          <span>Verifying Administrative Gateway...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 50% 20%, #131c31 0%, #080c14 100%)", padding: "2rem 1rem" }}>
      <div className="admin-login-card" style={{ width: "100%", maxWidth: "440px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "20px", padding: "2.5rem 2rem", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="admin-login-icon" style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #10b981 0%, #047857 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "#ffffff", fontSize: "1.5rem", boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)" }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.35rem" }}>
            Editorial Command Center
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
            AfriJournal Index • Administrative Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-circle-check"></i>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="admin-email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#cbd5e1", marginBottom: "0.4rem" }}>
              Administrator Email
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input"
                style={{ width: "100%", background: "#090e1a", border: "1px solid #334155", borderRadius: "10px", padding: "0.65rem 2.5rem 0.65rem 0.9rem", color: "#ffffff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
              />
              <div style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }}>
                <i className="fa-regular fa-envelope"></i>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#cbd5e1", marginBottom: "0.4rem" }}>
              Security Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="admin-input"
                style={{ width: "100%", background: "#090e1a", border: "1px solid #334155", borderRadius: "10px", padding: "0.65rem 2.5rem 0.65rem 0.9rem", color: "#ffffff", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.9rem" }}
              >
                <i className={showPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-btn admin-btn-primary"
            style={{ width: "100%", padding: "0.75rem", fontSize: "0.9rem", fontWeight: 700, borderRadius: "10px", background: "#10b981", color: "#ffffff", border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: "0.5rem" }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Authenticating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-right-to-bracket"></i> Sign In to Editorial Admin
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid #1e293b", textAlign: "center" }}>
          <Link
            href="/"
            style={{ color: "#94a3b8", fontSize: "0.82rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <i className="fa-solid fa-arrow-left"></i> Return to Public Directory
          </Link>
        </div>

        <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.72rem", color: "#475569", margin: "1.5rem 0 0" }}>
          Strict Editorial Access • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
