"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

function LoginForm() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
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

    const cleanEmail = formData.email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: formData.password
        })
      });
      const result = await res.json();
      if (result.success && result.user) {
        setSuccessMsg(t.auth.auth_success);

        // Determine destination: redirect query param or role-based default
        let destination = `/researcher?id=${result.user.id}`;
        if (redirectParam && redirectParam.startsWith("/")) {
          destination = redirectParam;
        } else if (result.user.role === "PUBLISHER") {
          destination = "/submit";
        }

        setTimeout(() => {
          window.location.href = destination;
        }, 800);
      } else {
        setError(result.error || t.auth.auth_error);
      }
    } catch (err) {
      console.error("Login request error:", err);
      setError(t.auth.auth_error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: "2.2rem", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
      {redirectParam && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          fontSize: "0.85rem",
          marginBottom: "1.2rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <i className="fa-solid fa-lock" style={{ fontSize: "0.8rem" }}></i>
          <span>Please sign in to access your requested page.</span>
        </div>
      )}

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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <label htmlFor="password" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>
              <i className="fa-solid fa-lock" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.auth.password_label}
            </label>
            <a 
              href="/forgot-password" 
              style={{ fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
            >
              {(t.auth as any).forgot_password_link || "Forgot Password?"}
            </a>
          </div>
          <div style={{ position: "relative" }}>
            <input 
              type={showPassword ? "text" : "password"} 
              id="password" 
              required 
              className="form-control" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              style={{ paddingRight: "42px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: "4px",
                fontSize: "0.95rem"
              }}
            >
              <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem", minHeight: "44px", fontSize: "0.95rem", fontWeight: 600 }}
          disabled={loading || !!successMsg}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> {t.auth.logging_in}
            </>
          ) : (
            t.auth.btn_login
          )}
        </button>

        <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          {t.auth.no_account}{" "}
          <a href="/register" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            {t.auth.register_link}
          </a>
        </div>
      </form>
    </div>
  );
}

export default function Login() {
  const { t } = useLang();

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Navigation */}
      <Header />

      <main className="container" style={{ padding: "3.5rem 1rem 6rem", maxWidth: "480px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 className="page-title" style={{ fontSize: "2rem" }}>{t.auth.login_title}</h1>
          <p className="page-subtitle" style={{ fontSize: "0.95rem" }}>
            {t.auth.login_subtitle}
          </p>
        </div>

        <Suspense fallback={
          <div className="glass-card" style={{ padding: "2rem", textAlign: "center", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-border)" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px", color: "var(--color-primary)" }}></i>
            Loading login portal...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
