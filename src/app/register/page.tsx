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
        setError(result.error || "Registration failed. Please review your details.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to register. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Navigation */}
      <Header />

      <main className="container" style={{ padding: "4rem 0 6rem", maxWidth: "560px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 className="page-title" style={{ fontSize: "2rem" }}>Create Account</h1>
          <p className="page-subtitle" style={{ fontSize: "0.95rem" }}>
            Join AfriJournal Index as a researcher or publisher to manage indexing profiles.
          </p>
        </div>

        <div className="glass-card" style={{ padding: "2.5rem" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#059669",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                margin: "0 auto 1.5rem"
              }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 style={{ fontSize: "1.4rem", color: "var(--color-text-main)" }}>Registration Successful</h3>
              <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
                Your account has been created. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {error && (
                <div style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
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
                  className="form-select"
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
                <span className="form-hint">
                  Connecting your ORCID helps verify African research authorship automatically.
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
                style={{ width: "100%", marginTop: "0.75rem", padding: "0.85rem" }}
                disabled={loading}
              >
                {loading ? "Registering..." : "Create Free Account"}
              </button>
              
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textAlign: "center", lineHeight: "1.6" }}>
                By creating an account, you agree to our{" "}
                <a href="/terms" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Terms &amp; Conditions</a>
                {" "}and acknowledge our{" "}
                <a href="/privacy" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Privacy Policy</a>.
              </p>

              <div style={{ textAlign: "center", marginTop: "0.25rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                Already registered?{" "}
                <a href="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                  Log in here
                </a>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
