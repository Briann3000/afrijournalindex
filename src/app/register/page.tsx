"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";

export default function Register() {
  const { lang, setLang, t } = useLang();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    orcid: "",
    institution: "",
    role: "RESEARCHER"
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(result.error || "Registration failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to register. Please check database connection status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-dark">
      {/* Navigation */}
      <Header />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "550px" }}>
        <div className="section-header" style={{ textAlign: "center" }}>
          <h1 className="section-title">Create Account</h1>
          <p className="section-desc">Join AfriJournal Index as a researcher or publisher to manage indexing profiles.</p>
        </div>

        <div className="glass-card" style={{ padding: "2.5rem 3rem" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(62,142,98,0.15)",
                color: "var(--color-accent-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                margin: "0 auto 1.5rem"
              }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <h3>Success!</h3>
              <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>Account registered. Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {error && (
                <div style={{ background: "rgba(255,74,74,0.1)", border: "1px solid rgba(255,74,74,0.3)", padding: "0.8rem 1rem", borderRadius: "4px", color: "#ff4a4a", fontSize: "0.85rem" }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input 
                  type="text" 
                  id="name" 
                  required 
                  className="form-control" 
                  placeholder="e.g. Dr. Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

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

              <div className="form-group">
                <label htmlFor="role" className="form-label">Account Role</label>
                <select 
                  id="role" 
                  className="form-control"
                  style={{ background: "#121217", color: "#fff" }}
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="RESEARCHER">Researcher / Author</option>
                  <option value="PUBLISHER">Journal Editor / Publisher</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="orcid" className="form-label">ORCID iD (Optional)</label>
                <input 
                  type="text" 
                  id="orcid" 
                  className="form-control" 
                  placeholder="e.g. 0000-0002-1825-0097"
                  value={formData.orcid}
                  onChange={handleChange}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem", display: "block" }}>
                  Connecting your ORCID helps verify authorship automatically.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="institution" className="form-label">Institution Affiliation (Optional)</label>
                <input 
                  type="text" 
                  id="institution" 
                  className="form-control" 
                  placeholder="e.g. University of Nairobi"
                  value={formData.institution}
                  onChange={handleChange}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", marginTop: "1rem", padding: "0.9rem" }}
                disabled={loading}
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
