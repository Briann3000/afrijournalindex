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
    confirmPassword: "",
    orcid: "",
    institution: "",
    role: "RESEARCHER"
  });

  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ORCID inline verification state
  const [orcidStatus, setOrcidStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [orcidFeedback, setOrcidFeedback] = useState<string | null>(null);
  const [orcidVerifiedName, setOrcidVerifiedName] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successRedirectUrl, setSuccessRedirectUrl] = useState<string>("/login");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));

    // Reset ORCID live check if user changes ORCID input
    if (id === "orcid") {
      setOrcidStatus("idle");
      setOrcidFeedback(null);
      setOrcidVerifiedName(null);
    }
  };

  const handleVerifyOrcid = async () => {
    const cleanOrcid = formData.orcid.trim();
    if (!cleanOrcid) {
      setOrcidStatus("error");
      setOrcidFeedback("Please enter an ORCID identifier first (e.g., 0000-0002-1825-0097).");
      return;
    }

    setOrcidStatus("verifying");
    setOrcidFeedback(null);

    try {
      const res = await fetch(`/api/researcher/profile?action=verify-orcid&orcid=${encodeURIComponent(cleanOrcid)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setOrcidStatus("verified");
        setOrcidVerifiedName(data.registeredName);
        setOrcidFeedback(`Verified in ORCID Registry: ${data.registeredName}`);
      } else {
        setOrcidStatus("error");
        setOrcidFeedback(data.error || "ORCID identifier not found in the official registry.");
      }
    } catch {
      setOrcidStatus("error");
      setOrcidFeedback("Network error connecting to ORCID public registry. Please retry.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long for account security.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify your confirmation password.");
      return;
    }

    if (!agreedTerms) {
      setError("Please agree to the Terms & Conditions and Academic Integrity Policy to continue.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        orcid: formData.orcid.trim(),
        institution: formData.institution.trim(),
        role: formData.role
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success && result.user) {
        setSuccess(true);
        const targetUrl = result.user.role === "PUBLISHER" ? "/submit" : `/researcher?id=${result.user.id}`;
        setSuccessRedirectUrl(targetUrl);

        // Immediate seamless auto-login transition
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 1500);
      } else {
        setError(result.error || t.auth.auth_error);
      }
    } catch (err) {
      console.error("Registration error:", err);
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

        <div className="glass-card" style={{ padding: "2.2rem", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#059669",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 1.5rem"
              }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 style={{ fontSize: "1.4rem", color: "var(--color-text-main)", fontWeight: 700 }}>{t.auth.reg_success}</h3>
              <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", fontSize: "0.95rem" }}>
                Your account is ready and verified. Redirecting directly to your dashboard...
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <a href={successRedirectUrl} className="btn btn-primary" style={{ padding: "0.6rem 1.4rem", fontSize: "0.9rem" }}>
                  Go to Dashboard Now
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && (
                <div style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: "0.85rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  lineHeight: 1.45
                }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginTop: "2px" }}></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
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

              {/* Email Address */}
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

              {/* Password */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="password" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    <i className="fa-solid fa-lock" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.auth.password_label}
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Min. 8 characters</span>
                </div>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    required 
                    minLength={8}
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

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword" 
                    required 
                    minLength={8}
                    className="form-control" 
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={{ paddingRight: "42px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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
                    <i className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#dc2626" }}>
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Primary Role */}
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

              {/* Institution */}
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

              {/* ORCID iD with Live Registry Verification */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor="orcid" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    <i className="fa-brands fa-orcid" style={{ color: "#a6ce39", marginRight: "6px" }}></i> {t.auth.orcid_label}
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Public Registry Check</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                  <input 
                    type="text" 
                    id="orcid" 
                    className="form-control" 
                    placeholder="0000-0002-1825-0097"
                    value={formData.orcid}
                    onChange={handleChange}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOrcid}
                    disabled={!formData.orcid.trim() || orcidStatus === "verifying"}
                    className="btn"
                    style={{
                      fontSize: "0.82rem",
                      padding: "0 12px",
                      background: orcidStatus === "verified" ? "#ecfdf5" : "#f1f5f9",
                      color: orcidStatus === "verified" ? "#065f46" : "#334155",
                      border: orcidStatus === "verified" ? "1px solid #a7f3d0" : "1px solid var(--color-border)",
                      whiteSpace: "nowrap",
                      cursor: !formData.orcid.trim() ? "not-allowed" : "pointer"
                    }}
                  >
                    {orcidStatus === "verifying" ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "4px" }}></i> Checking...
                      </>
                    ) : orcidStatus === "verified" ? (
                      <>
                        <i className="fa-solid fa-check" style={{ marginRight: "4px", color: "#059669" }}></i> Verified
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-magnifying-glass" style={{ marginRight: "4px" }}></i> Check
                      </>
                    )}
                  </button>
                </div>

                {/* ORCID feedback badge */}
                {orcidFeedback && (
                  <div style={{
                    marginTop: "6px",
                    fontSize: "0.8rem",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: orcidStatus === "verified" ? "#ecfdf5" : "#fef2f2",
                    color: orcidStatus === "verified" ? "#065f46" : "#b91c1c",
                    border: orcidStatus === "verified" ? "1px solid #a7f3d0" : "1px solid #fecaca"
                  }}>
                    <i className={orcidStatus === "verified" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}></i>
                    <span>{orcidFeedback}</span>
                  </div>
                )}
              </div>

              {/* Terms and Academic Integrity Agreement */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid var(--color-border)",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginTop: "0.25rem"
              }}>
                <input
                  type="checkbox"
                  id="agreedTerms"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  style={{ marginTop: "3px", cursor: "pointer", accentColor: "var(--color-primary)" }}
                  required
                />
                <label htmlFor="agreedTerms" style={{ fontSize: "0.82rem", color: "var(--color-text-main)", cursor: "pointer", lineHeight: 1.45 }}>
                  I confirm that all provided details and identity credentials are true, and I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "underline", fontWeight: 600 }}>
                    Terms & Conditions
                  </a>{" "}
                  and Academic Integrity Policy.
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem", minHeight: "44px", fontSize: "0.95rem", fontWeight: 600 }}
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> {t.auth.registering}
                  </>
                ) : (
                  t.auth.btn_register
                )}
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
