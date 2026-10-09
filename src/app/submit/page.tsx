"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function Submit() {
  const { lang, setLang, t } = useLang();
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
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [ojsInput, setOjsInput] = useState("");
  const [ojsLoading, setOjsLoading] = useState(false);
  const [ojsFeedback, setOjsFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/evaluate/lookup?query=${encodeURIComponent(lookupQuery)}`);
      const data = await res.json();
      if (data.success) {
        window.location.href = `/submit/status?id=${data.submissionId}`;
      } else {
        setLookupError(data.error || "No matching journal evaluation record found.");
      }
    } catch (err) {
      console.error(err);
      setLookupError("Network error occurred while checking status.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const key = id.replace("j", "").toLowerCase();
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNextStep = () => {
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError("Please provide the Journal Full Name before proceeding.");
      return;
    }
    if (!formData.publisher.trim()) {
      setFormError("Please provide the Publisher or Institutional Affiliation.");
      return;
    }
    setStep(2);
  };

  const handleOjsSync = async () => {
    if (!ojsInput.trim()) {
      setOjsFeedback({ type: "error", msg: "Please enter a valid OAI-PMH endpoint URL." });
      return;
    }
    setOjsLoading(true);
    setOjsFeedback(null);
    try {
      const res = await fetch("/api/harvester/oai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oaiUrl: ojsInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          name: data.repository?.repositoryName || prev.name,
          publisher: data.articles?.[0]?.publisher || prev.publisher,
          scope: data.articles?.[0]?.description || prev.scope,
          website: data.repository?.baseURL ? new URL(data.repository.baseURL).origin : prev.website
        }));
        setOjsFeedback({
          type: "success",
          msg: `Identified "${data.repository?.repositoryName || "Journal"}" and synced ${data.totalHarvested || 0} published records.`
        });
      } else {
        setOjsFeedback({ type: "error", msg: data.error || "Failed to harvest OAI endpoint." });
      }
    } catch {
      setOjsFeedback({ type: "error", msg: "Error contacting the remote OJS server." });
    } finally {
      setOjsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.name || !formData.website) {
      setFormError("Journal Name and Official Website URL are mandatory.");
      return;
    }

    setSubmitting(true);
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
        window.location.href = `/submit/status?id=${data.submissionId}`;
      } else {
        setFormError(`Evaluation Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setFormError("An unexpected error occurred during submission. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Navigation Bar */}
      <Header activePage="submit" />

      <main className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "800px" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-paper-plane"></i>
            Journal Evaluation Portal
          </span>
          <h1 className="page-title">{t.submit_page.title}</h1>
          <p className="page-subtitle" style={{ maxWidth: "600px", margin: "0.5rem auto 0" }}>
            {t.submit_page.desc}
          </p>
        </div>

        {/* Status Lookup Search Block */}
        <div className="card-surface" style={{ marginBottom: "2rem", padding: "1.75rem" }}>
          <form onSubmit={handleLookup}>
            <label htmlFor="lookupInput" className="form-label" style={{ marginBottom: "0.5rem" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--color-primary)" }}></i>
              Track Existing Submission Status &amp; Metrics
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input 
                type="text" 
                id="lookupInput" 
                required
                placeholder="Enter Journal Full Name or ISSN (e.g. 2312-0134)" 
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                className="form-control"
                style={{ flex: 1, minWidth: "240px" }}
              />
              <button 
                type="submit" 
                className="btn btn-secondary" 
                disabled={lookupLoading}
                style={{ whiteSpace: "nowrap" }}
              >
                {lookupLoading ? "Searching..." : "Track Status"}
              </button>
            </div>
            {lookupError && (
              <div style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "0.5rem", fontWeight: 500 }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "0.3rem" }}></i>
                {lookupError}
              </div>
            )}
          </form>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: step === 1 ? "var(--color-primary)" : "#ecfdf5",
              color: step === 1 ? "#ffffff" : "#047857",
              border: step === 1 ? "none" : "1px solid #a7f3d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem"
            }}>
              {step > 1 ? <i className="fa-solid fa-check"></i> : "1"}
            </span>
            <span style={{ fontWeight: step === 1 ? 700 : 500, color: step === 1 ? "var(--color-text-main)" : "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Metadata &amp; Scope
            </span>
          </div>

          <div style={{ width: "40px", height: "2px", background: "var(--color-border)" }}></div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: step === 2 ? "var(--color-primary)" : "var(--color-bg-alt)",
              color: step === 2 ? "#ffffff" : "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem"
            }}>
              2
            </span>
            <span style={{ fontWeight: step === 2 ? 700 : 500, color: step === 2 ? "var(--color-text-main)" : "var(--color-text-muted)", fontSize: "0.9rem" }}>
              Audit Verification
            </span>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="card-surface" style={{ padding: "2.5rem" }}>
          {formError && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              {formError}
            </div>
          )}

          <form id="submitForm" onSubmit={handleSubmit}>
            {/* Step 1: Basic Metadata */}
            {step === 1 && (
              <div>
                {/* OJS Auto-Import Card */}
                <div style={{ background: "#eff6ff", border: "1px dashed #93c5fd", borderRadius: "var(--border-radius-sm)", padding: "1.25rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                    <i className="fa-solid fa-bolt" style={{ color: "var(--color-primary)" }}></i>
                    <strong style={{ fontSize: "0.92rem", color: "var(--color-primary)" }}>1-Click OJS / OAI-PMH Auto-Import</strong>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "0 0 0.8rem", lineHeight: "1.5" }}>
                    If your university journal runs on Open Journal Systems (PKP OJS), enter your OAI endpoint to auto-fill metadata and pull all published issues.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input 
                      type="url" 
                      placeholder="e.g. https://arjess.org/index.php/oai" 
                      id="ojsInput"
                      value={ojsInput}
                      onChange={e => setOjsInput(e.target.value)}
                      className="form-control"
                      style={{ fontSize: "0.88rem" }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={handleOjsSync}
                      disabled={ojsLoading}
                      style={{ padding: "0 1.2rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                    >
                      {ojsLoading ? "Syncing..." : "Sync OJS"}
                    </button>
                  </div>
                  {ojsFeedback && (
                    <div style={{
                      marginTop: "0.75rem",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: ojsFeedback.type === "success" ? "#047857" : "#b91c1c"
                    }}>
                      <i className={`fa-solid ${ojsFeedback.type === "success" ? "fa-circle-check" : "fa-circle-xmark"}`} style={{ marginRight: "0.35rem" }}></i>
                      {ojsFeedback.msg}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="jName" className="form-label">{t.submit_page.name_label}</label>
                  <input 
                    type="text" 
                    id="jName" 
                    required 
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g. African Research Journal of Education and Social Sciences" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="jScope" className="form-label">{t.submit_page.scope_label}</label>
                  <textarea 
                    id="jScope" 
                    rows={4} 
                    required 
                    value={formData.scope}
                    onChange={handleChange}
                    className="form-control"
                    placeholder={t.submit_page.scope_placeholder}
                  ></textarea>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <div className="form-group">
                    <label htmlFor="jIssn" className="form-label">{t.submit_page.issn_label}</label>
                    <input 
                      type="text" 
                      id="jIssn" 
                      value={formData.issn}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="e.g. 2312-0134" 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jEissn" className="form-label">{t.submit_page.eissn_label}</label>
                    <input 
                      type="text" 
                      id="jEissn" 
                      value={formData.eissn}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="xxxx-xxxx" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="jPublisher" className="form-label">{t.submit_page.publisher_label}</label>
                  <input 
                    type="text" 
                    id="jPublisher" 
                    required 
                    value={formData.publisher}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g. Kenya Projects Organization (KENPRO)" 
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <div className="form-group">
                    <label htmlFor="jCountry" className="form-label">{t.submit_page.country_label}</label>
                    <input 
                      type="text" 
                      id="jCountry" 
                      required 
                      value={formData.country}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="e.g. Kenya" 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jFrequency" className="form-label">{t.submit_page.frequency_label}</label>
                    <select 
                      id="jFrequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option>Quarterly</option>
                      <option>Semi-Annually</option>
                      <option>Annually</option>
                      <option>Continuous</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-primary" onClick={handleNextStep}>
                    {t.submit_page.btn_next} <i className="fa-solid fa-arrow-right" style={{ marginLeft: "0.5rem" }}></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verification & Review */}
            {step === 2 && (
              <div>
                <h3 style={{ marginBottom: "1.5rem", color: "var(--color-primary)", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <i className="fa-solid fa-shield-halved"></i> {t.submit_page.step2_title}
                </h3>

                <div className="form-group">
                  <label htmlFor="jWebsite" className="form-label">{t.submit_page.website_label}</label>
                  <input 
                    type="url" 
                    id="jWebsite" 
                    required 
                    value={formData.website}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="https://arjess.org" 
                  />
                  <span className="form-hint">Must be the canonical homepage showing published articles, editorial board, and author guidelines.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="jUpload" className="form-label">{t.submit_page.upload_label}</label>
                  <div style={{ border: "1px dashed var(--color-border)", borderRadius: "var(--border-radius-sm)", padding: "1.5rem", textAlign: "center", background: "var(--color-bg-base)" }}>
                    <input type="file" id="jUpload" accept=".pdf" style={{ margin: "0 auto", display: "block" }} />
                    <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>{t.submit_page.upload_sub}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", margin: "1.75rem 0" }}>
                  <input type="checkbox" id="jTerms" required style={{ width: "18px", height: "18px", marginTop: "2px", cursor: "pointer" }} />
                  <label htmlFor="jTerms" style={{ cursor: "pointer", fontSize: "0.88rem", color: "var(--color-text-body)", lineHeight: "1.5" }}>
                    {t.submit_page.terms_label}
                  </label>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: "0.5rem" }}></i> {t.submit_page.btn_prev}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Initiating Automated Audit..." : (
                      <>
                        {t.submit_page.btn_submit} <i className="fa-solid fa-paper-plane" style={{ marginLeft: "0.5rem" }}></i>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
