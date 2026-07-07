"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";

export default function Submit() {
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);

  // Controlled form state to preserve input values across step changes
  const [formData, setFormData] = useState({
    name: "",
    scope: "",
    issn: "",
    eissn: "",
    publisher: "",
    country: "",
    frequency: "Quarterly",
    website: ""
  });

  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/evaluate/lookup?query=${encodeURIComponent(lookupQuery)}`);
      const data = await res.json();
      if (data.success) {
        window.location.href = `/submit/status?id=${data.submissionId}`;
      } else {
        alert(data.error || "No matching submission found.");
      }
    } catch (err) {
      console.error(err);
      alert("Error looking up submission status.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    // Map IDs to state keys
    const key = id.replace("j", "").toLowerCase();
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNextStep = () => {
    if (!formData.name) {
      alert("Please fill in the Journal Full Name.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.website) {
      alert("Journal Name and Homepage Website are required.");
      return;
    }

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.scope,
          issn: formData.issn,
          eissn: formData.eissn,
          publisher: formData.publisher,
          country: formData.country,
          frequency: formData.frequency,
          website: formData.website
        })
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = `/submit/status?id=${data.submissionId}`; // Using the returned submission ID to redirect
      } else {
        alert(`Evaluation Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during automated evaluation submission.");
    }
  };

  return (
    <div className="theme-dark">
      {/* Navigation Bar */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo">
            <span className="logo-accent">Afri</span>Journal Index
          </a>
          
          <nav className={`nav-menu ${isMenuOpen ? "active" : ""}`} id="navMenu" style={isMenuOpen ? {
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: "80px",
            left: "0",
            width: "100%",
            background: "var(--color-bg-card)",
            padding: "2rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            zIndex: 99
          } : undefined}>
            <a href="/" className="nav-link">{t.nav.home}</a>
            <a href="/browse" className="nav-link">{t.nav.browse}</a>
            <a href="/submit" className="nav-link active">{t.nav.submit}</a>
            <a href="/pricing" className="nav-link">{t.nav.pricing}</a>
            <a href="/about" className="nav-link">{t.nav.about}</a>
          </nav>
          
          <div className="header-actions">
            <div className="lang-selector-wrapper">
              <select 
                id="langSelector" 
                className="lang-selector"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="pt">Português</option>
                <option value="ar">العربية</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
            <a href="/submit" className="btn btn-primary btn-sm">{t.nav.get_started}</a>
            <button className="menu-toggle" id="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "4rem 0" }}>
        <div className="section-header">
          <h1 className="section-title">{t.submit_page.title}</h1>
          <p className="section-desc">{t.submit_page.desc}</p>
        </div>

        {/* Status Lookup Search Block */}
        <div className="glass-card" style={{ maxWidth: "650px", margin: "0 auto 2rem", padding: "1.5rem 2rem" }}>
          <form onSubmit={handleLookup} style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <label htmlFor="lookupInput" style={{ display: "block", fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>
                Already submitted a journal? Track evaluation status & metrics
              </label>
              <input 
                type="text" 
                id="lookupInput" 
                required
                placeholder="Enter Journal Name or ISSN (e.g. 2312-0134)" 
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.7rem 1rem",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "0.9rem"
                }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ padding: "0.7rem 1.5rem" }}
              disabled={lookupLoading}
            >
              {lookupLoading ? "Searching..." : "Track Status"}
            </button>
          </form>
        </div>

        <div className="glass-card" style={{ maxWidth: "650px", margin: "0 auto" }}>
          <form id="submitForm" className="submission-form" onSubmit={handleSubmit}>
            {/* Step 1: Basic Metadata */}
            {step === 1 && (
              <div className="form-step active" id="step1">
                <h3 style={{ marginBottom: "1.5rem", color: "var(--color-primary)" }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: "0.5rem" }}></i> {t.submit_page.step1_title}
                </h3>
                
                <div className="form-group">
                  <label htmlFor="jName">{t.submit_page.name_label}</label>
                  <input 
                    type="text" 
                    id="jName" 
                    required 
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. African Research Journal of Education and Social Sciences" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="jScope">{t.submit_page.scope_label}</label>
                  <textarea 
                    id="jScope" 
                    rows={4} 
                    required 
                    value={formData.scope}
                    onChange={handleChange}
                    placeholder={t.submit_page.scope_placeholder}
                  ></textarea>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="jIssn">{t.submit_page.issn_label}</label>
                    <input 
                      type="text" 
                      id="jIssn" 
                      value={formData.issn}
                      onChange={handleChange}
                      placeholder="e.g. 2312-0134" 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jEissn">{t.submit_page.eissn_label}</label>
                    <input 
                      type="text" 
                      id="jEissn" 
                      value={formData.eissn}
                      onChange={handleChange}
                      placeholder="xxxx-xxxx" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="jPublisher">{t.submit_page.publisher_label}</label>
                  <input 
                    type="text" 
                    id="jPublisher" 
                    required 
                    value={formData.publisher}
                    onChange={handleChange}
                    placeholder="e.g. Kenya Projects Organization (KENPRO)" 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="jCountry">{t.submit_page.country_label}</label>
                    <input 
                      type="text" 
                      id="jCountry" 
                      required 
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="e.g. Kenya" 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jFrequency">{t.submit_page.frequency_label}</label>
                    <select 
                      id="jFrequency"
                      value={formData.frequency}
                      onChange={handleChange}
                    >
                      <option>Quarterly</option>
                      <option>Semi-Annually</option>
                      <option>Annually</option>
                      <option>Continuous</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-primary" onClick={handleNextStep}>
                    {t.submit_page.btn_next} <i className="fa-solid fa-arrow-right" style={{ marginLeft: "0.5rem" }}></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verification & Review */}
            {step === 2 && (
              <div className="form-step" id="step2">
                <h3 style={{ marginBottom: "1.5rem", color: "var(--color-primary)" }}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: "0.5rem" }}></i> {t.submit_page.step2_title}
                </h3>

                <div className="form-group">
                  <label htmlFor="jWebsite">{t.submit_page.website_label}</label>
                  <input 
                    type="url" 
                    id="jWebsite" 
                    required 
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://arjess.org" 
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="jUpload">{t.submit_page.upload_label}</label>
                  <div className="file-upload-wrapper">
                    <input type="file" id="jUpload" accept=".pdf" />
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>{t.submit_page.upload_sub}</p>
                  </div>
                </div>

                <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.8rem", margin: "1.5rem 0" }}>
                  <input type="checkbox" id="jTerms" required style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                  <label htmlFor="jTerms" style={{ cursor: "pointer", userSelect: "none" }}>
                    {t.submit_page.terms_label}
                  </label>
                </div>

                <div className="form-actions" style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: "0.5rem" }}></i> {t.submit_page.btn_prev}
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {t.submit_page.btn_submit} <i className="fa-solid fa-paper-plane" style={{ marginLeft: "0.5rem" }}></i>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <a href="/" className="logo"><span className="logo-accent">Afri</span>Journal Index</a>
            <p className="footer-desc">{t.footer.desc}</p>
          </div>
          <div className="footer-links">
            <h4 className="footer-heading">{t.footer.links_head}</h4>
            <a href="/browse">{t.nav.browse}</a>
            <a href="/submit">{t.nav.submit}</a>
            <a href="/pricing">{t.nav.pricing}</a>
          </div>
          <div className="footer-links">
            <h4 className="footer-heading">{t.footer.resources_head}</h4>
            <a href="/about">{t.nav.about}</a>
            <a href="/methodology">{t.footer.methodology}</a>
            <a href="/contact">{t.footer.contact}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container footer-bottom-flex">
            <p className="copyright">&copy; 2026 AfriJournal Index. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
