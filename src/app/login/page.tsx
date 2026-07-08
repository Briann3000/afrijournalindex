"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";

export default function Login() {
  const { lang, setLang, t } = useLang();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        alert("Login successful!");
        window.location.href = `/researcher?id=${result.user.id}`;
      } else {
        setError(result.error || "Authentication failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Check server status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-dark">
      {/* Navigation */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo">
            <span className="logo-accent">Afri</span>Journal Index
          </a>
          <nav className={`nav-menu ${isMenuOpen ? "active" : ""}`} id="navMenu">
            <a href="/" className="nav-link">{t.nav.home}</a>
            <a href="/browse" className="nav-link">{t.nav.browse}</a>
            <a href="/submit" className="nav-link">{t.nav.submit}</a>
            <a href="/pricing" className="nav-link">{t.nav.pricing}</a>
            <a href="/about" className="nav-link">{t.nav.about}</a>
          </nav>
          <div className="header-actions">
            <a href="/register" className="btn btn-primary btn-sm" style={{ marginRight: "0.5rem" }}>Register</a>
            <button className="menu-toggle" id="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "4rem 0", maxWidth: "480px" }}>
        <div className="section-header" style={{ textAlign: "center" }}>
          <h1 className="section-title">Account Login</h1>
          <p className="section-desc">Log in to view researcher profiles and indexing metrics dashboards.</p>
        </div>

        <div className="glass-card" style={{ padding: "2.5rem 3rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {error && (
              <div style={{ background: "rgba(255,74,74,0.1)", border: "1px solid rgba(255,74,74,0.3)", padding: "0.8rem 1rem", borderRadius: "4px", color: "#ff4a4a", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
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
              <label htmlFor="password" className="form-label">Password</label>
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
              style={{ width: "100%", marginTop: "1rem", padding: "0.9rem" }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Login"}
            </button>

            <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Don't have an account? <a href="/register" style={{ color: "var(--color-primary)" }}>Register here</a>.
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
