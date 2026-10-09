"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";
import { ALL_AFRICAN_COUNTRIES } from "../data/african-countries";

export default function Submit() {
  const { t } = useLang();
  const [step, setStep] = useState<number>(1);

  // Controlled form state to preserve input values across step changes
  const [formData, setFormData] = useState({
    name: "",
    scope: "",
    issn: "",
    eissn: "",
    publisher: "",
    country: "Kenya",
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
        setLookupError(data.error || t.submit_status_page.status_badge_failed);
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
      setFormError("Please provide the Publisher Organization.");
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
          msg: `Synced "${data.repository?.repositoryName || "Journal"}" (${data.totalHarvested || 0} published records).`
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

      <main className="container" style={{ padding: "3.5rem 1rem 6rem", maxWidth: "800px" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-paper-plane"></i>
            {t.nav.indexing_portal}
          </span>
          <h1 className="page-title">{t.submit_page.title}</h1>
          <p className="page-subtitle" style={{ maxWidth: "600px", margin: "0.5rem auto 0" }}>
            {t.submit_page.desc}
          </p>
        </div>

        {/* Status Lookup Search Block */}
        <div className="card-surface" style={{ marginBottom: "2rem", padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
          <form onSubmit={handleLookup}>
            <label htmlFor="lookupInput" className="form-label" style={{ marginBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 700 }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i>
              {t.submit_status_page.lookup_label}
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input 
                type="text" 
                id="lookupInput" 
                required
                placeholder={t.submit_status_page.lookup_placeholder} 
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                className="form-control"
                style={{ flex: "1 1 240px" }}
              />
              <button 
                type="submit" 
                className="btn btn-secondary" 
                disabled={lookupLoading}
                style={{ whiteSpace: "nowrap", minHeight: "44px" }}
              >
                {lookupLoading ? t.common.loading : t.submit_status_page.lookup_btn}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
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
              {t.submit_page.step1_title}
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
              {t.submit_page.step2_title}
            </span>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
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
                    If your journal runs on Open Journal Systems (PKP OJS), enter your OAI endpoint to auto-sync volumes and metadata.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <input 
                      type="url" 
                      placeholder="e.g. https://arjess.org/index.php/oai" 
                      id="ojsInput"
                      value={ojsInput}
                      onChange={e => setOjsInput(e.target.value)}
                      className="form-control"
                      style={{ fontSize: "0.88rem", flex: "1 1 200px" }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      onClick={handleOjsSync}
                      disabled={ojsLoading}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {ojsLoading ? t.common.loading : "Auto-Fill"}
                    </button>
                  </div>
                  {ojsFeedback && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: ojsFeedback.type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      <i className={`fa-solid ${ojsFeedback.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`} style={{ marginRight: "4px" }}></i>
                      {ojsFeedback.msg}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label htmlFor="jName" className="form-label">
                      {t.submit_page.name_label} *
                    </label>
                    <input 
                      type="text" 
                      id="jName" 
                      required 
                      className="form-control"
                      placeholder={t.submit_page.name_placeholder}
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="jScope" className="form-label">
                      {t.submit_page.scope_label}
                    </label>
                    <textarea 
                      id="jScope" 
                      rows={3} 
                      className="form-control"
                      placeholder={t.submit_page.scope_placeholder}
                      value={formData.scope}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <div className="form-group">
                      <label htmlFor="jIssn" className="form-label">
                        {t.submit_page.issn_label}
                      </label>
                      <input 
                        type="text" 
                        id="jIssn" 
                        className="form-control"
                        placeholder="2312-0134"
                        value={formData.issn}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="jEissn" className="form-label">
                        {t.submit_page.eissn_label}
                      </label>
                      <input 
                        type="text" 
                        id="jEissn" 
                        className="form-control"
                        placeholder="2520-4106"
                        value={formData.eissn}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="jPublisher" className="form-label">
                      {t.submit_page.publisher_label} *
                    </label>
                    <input 
                      type="text" 
                      id="jPublisher" 
                      required 
                      className="form-control"
                      placeholder={t.submit_page.publisher_placeholder}
                      value={formData.publisher}
                      onChange={handleChange}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <div className="form-group">
                      <label htmlFor="jCountry" className="form-label">
                        {t.submit_page.country_label} *
                      </label>
                      <select 
                        id="jCountry" 
                        required 
                        className="form-control"
                        value={formData.country}
                        onChange={handleChange}
                      >
                        {ALL_AFRICAN_COUNTRIES.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="jFrequency" className="form-label">
                        {t.submit_page.frequency_label}
                      </label>
                      <select 
                        id="jFrequency" 
                        className="form-control"
                        value={formData.frequency}
                        onChange={handleChange}
                      >
                        <option value="Quarterly">Quarterly (4 issues/yr)</option>
                        <option value="Biannual">Biannual (2 issues/yr)</option>
                        <option value="Monthly">Monthly (12 issues/yr)</option>
                        <option value="Continuous">Continuous Open Access</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: "100%", marginTop: "1rem", minHeight: "44px" }}
                    onClick={handleNextStep}
                  >
                    {t.submit_page.btn_next} <i className="fa-solid fa-arrow-right" style={{ marginLeft: "6px" }}></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verification Details */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label htmlFor="jWebsite" className="form-label">
                    {t.submit_page.website_label} *
                  </label>
                  <input 
                    type="url" 
                    id="jWebsite" 
                    required 
                    className="form-control"
                    placeholder={t.submit_page.website_placeholder}
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t.submit_page.upload_label}
                  </label>
                  <div className="file-upload-wrapper" style={{ width: "100%" }}>
                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "0.5rem" }}></i>
                    <p style={{ fontWeight: 600, color: "var(--color-text-main)", margin: "0 0 0.2rem" }}>
                      {t.submit_page.upload_sub}
                    </p>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>PDF sample issue up to 10MB</span>
                  </div>
                </div>

                {/* Terms agreement */}
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginTop: "0.5rem" }}>
                  <input type="checkbox" id="termsCheck" required style={{ marginTop: "4px", width: "18px", height: "18px" }} />
                  <label htmlFor="termsCheck" style={{ fontSize: "0.85rem", color: "var(--color-text-body)", cursor: "pointer", lineHeight: "1.5" }}>
                    {t.submit_page.terms_label}
                  </label>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1, minHeight: "44px" }}
                    onClick={() => setStep(1)}
                  >
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: "6px" }}></i> {t.submit_page.btn_prev}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 2, minHeight: "44px" }}
                    disabled={submitting}
                  >
                    {submitting ? t.submit_page.submitting : t.submit_page.btn_submit}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
