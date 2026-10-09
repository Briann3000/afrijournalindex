"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function Register() {
  const { t } = useLang();
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
        setError(result.error || t.auth.auth_error);
      }
    } catch (err) {
      console.error(err);
      setError(t.auth.auth_error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Navigation */}
      <Header />

      <main className="container" style={{ padding: "3.5rem 1rem 6rem", maxWidth: "560px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 className="page-title" style={{ fontSize: "2rem" }}>{t.auth.register_title}</h1>
          <p className="page-subtitle" style={{ fontSize: "0.95rem" }}>
            {t.auth.register_subtitle}
          </p>
        </div>

        <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
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
              <h3 style={{ fontSize: "1.4rem", color: "var(--color-text-main)" }}>{t.auth.reg_success}</h3>
              <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
                {t.auth.reg_success_sub}
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
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  <i className="fa-regular fa-user" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.auth.name_label}
                </label>
                <input 
                  type="text" 
                  id="name" 
                  required 
                  className="form-control" 
                  placeholder={t.auth.name_placeholder}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  <i className="fa-regular fa-envelope" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.auth.email_label}
                </label>
                <input 
                  type="email" 
                  id="email" 
                  required 
                  className="form-control" 
                  placeholder={t.auth.email_placeholder}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  <i className="fa-solid fa-lock" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.auth.password_label}
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

              <div className="form-group">
                <label htmlFor="role" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  <i className="fa-solid fa-briefcase" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.auth.role_label}
                </label>
                <select 
                  id="role" 
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="RESEARCHER">{t.auth.role_researcher}</option>
                  <option value="PUBLISHER">{t.auth.role_publisher}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="institution" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  <i className="fa-solid fa-building-columns" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.auth.institution_label}
                </label>
                <input 
                  type="text" 
                  id="institution" 
                  className="form-control" 
                  placeholder={t.auth.institution_placeholder}
                  value={formData.institution}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="orcid" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  <i className="fa-brands fa-orcid" style={{ color: "#a6ce39", marginRight: "6px" }}></i> {t.auth.orcid_label}
                </label>
                <input 
                  type="text" 
                  id="orcid" 
                  className="form-control" 
                  placeholder={t.auth.orcid_placeholder}
                  value={formData.orcid}
                  onChange={handleChange}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", marginTop: "0.75rem", padding: "0.85rem", minHeight: "44px" }}
                disabled={loading || success}
              >
                {loading ? t.auth.registering : t.auth.btn_register}
              </button>

              <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                {t.auth.have_account}{" "}
                <a href="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                  {t.auth.login_link}
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
