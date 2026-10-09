"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";

export default function Login() {
  const { lang, setLang, t } = useLang();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg("Authentication successful. Redirecting to your dashboard...");
        setTimeout(() => {
          window.location.href = `/researcher?id=${result.user.id}`;
        }, 1000);
      } else {
        setError(result.error || "Authentication failed. Please verify your credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Check server status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Navigation */}
      <Header />

      <main className="container" style={{ padding: "4rem 0 6rem", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 className="page-title" style={{ fontSize: "2rem" }}>Account Login</h1>
          <p className="page-subtitle" style={{ fontSize: "0.95rem" }}>
            Log in to manage journal submissions, researcher profiles, and indexing metrics.
          </p>
        </div>

        <div className="glass-card" style={{ padding: "2.5rem" }}>
          {successMsg && (
            <div style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              marginBottom: "1.2rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <i className="fa-solid fa-circle-check"></i>
              {successMsg}
            </div>
          )}

          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              marginBottom: "1.2rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <i className="fa-regular fa-envelope" style={{ color: "var(--color-primary)" }}></i> Email Address
              </label>
              <input 
                type="email" 
                id="email" 
                required 
                className="form-control" 
                placeholder="e.g. jane.doe@uonbi.ac.ke"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="fa-solid fa-lock" style={{ color: "var(--color-primary)" }}></i> Password
              </label>
              <input 
                type="password" 
                id="password" 
                required 
                className="form-control" 
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: "100%", marginTop: "0.75rem", padding: "0.85rem" }}
              disabled={loading || !!successMsg}
            >
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </button>

            <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
              Don't have an account?{" "}
              <a href="/register" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                Register here
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
