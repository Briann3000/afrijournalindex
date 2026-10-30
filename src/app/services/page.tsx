"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

export default function ServicesPage() {
  const { t } = useLang();
  const sp = t?.services_page || {};

  const [activePillar, setActivePillar] = useState<"all" | "institutional" | "researcher">("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    serviceType: "University Journal Setup & Online OJS Incubation",
    journalName: "",
    details: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate quick feedback, keeping state clean
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const services = [
    {
      id: "ojs_setup",
      key: "ojs_setup",
      pillar: "institutional",
      icon: "fa-solid fa-server",
      color: "#0284c7",
      defaultTitle: "University Journal Setup & Online OJS Incubation",
      defaultBadge: "For Universities"
    },
    {
      id: "indexing_ajci",
      key: "indexing_ajci",
      pillar: "institutional",
      icon: "fa-solid fa-chart-line",
      color: "#16a34a",
      defaultTitle: "Journal Indexing & AJCI Citation Matrix",
      defaultBadge: "Official Indexation"
    },
    {
      id: "scopus_prep",
      key: "scopus_prep",
      pillar: "institutional",
      icon: "fa-solid fa-award",
      color: "#f59e0b",
      defaultTitle: "Journal Preparation for Scopus, Web of Science & DOAJ",
      defaultBadge: "Accreditation Advisory"
    },
    {
      id: "rankings_advisory",
      key: "rankings_advisory",
      pillar: "institutional",
      icon: "fa-solid fa-ranking-star",
      color: "#6366f1",
      defaultTitle: "Institutional & University Research Rankings",
      defaultBadge: "Institutional Benchmarking"
    },
    {
      id: "afrischolar_id",
      key: "afrischolar_id",
      pillar: "researcher",
      icon: "fa-solid fa-id-card-clip",
      color: "#8b5cf6",
      defaultTitle: "AfriScholar Indexing & Verified Scholar ID (ASID)",
      defaultBadge: "For Researchers"
    },
    {
      id: "manuscript_review",
      key: "manuscript_review",
      pillar: "researcher",
      icon: "fa-solid fa-user-check",
      color: "#ec4899",
      defaultTitle: "Reviewing Manuscripts Through Our Reviewer Portal",
      defaultBadge: "Peer Review Portal"
    },
    {
      id: "manuscript_prep",
      key: "manuscript_prep",
      pillar: "researcher",
      icon: "fa-solid fa-pen-nib",
      color: "#ea580c",
      defaultTitle: "Manuscript Preparation & Technical Assistance",
      defaultBadge: "Author Support"
    }
  ];

  const filteredServices = services.filter(s => {
    if (activePillar === "all") return true;
    return s.pillar === activePillar;
  });

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header activePage="services" />

      <main 
        className="container services-main-container" 
        style={{ 
          padding: "clamp(1.5rem, 3vw, 3rem) clamp(0.75rem, 2vw, 1.25rem) 6rem", 
          maxWidth: "1140px", 
          boxSizing: "border-box" 
        }}
      >
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>{t?.nav?.home || "Home"}</Link>
          <span>/</span>
          <Link href="/about" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>{t?.nav?.about || "About"}</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>{sp?.hero_badge || "Services"}</span>
        </div>

        {/* Hero Banner with Responsive Typography & Layout */}
        <div 
          className="card-surface" 
          style={{ 
            padding: "clamp(1.5rem, 4vw, 3rem)", 
            borderRadius: "18px", 
            border: "1px solid var(--color-border)", 
            marginBottom: "2.5rem", 
            background: "linear-gradient(180deg, var(--color-bg-card) 0%, var(--color-bg-card-subtle) 100%)" 
          }}
        >
          <div style={{ maxWidth: "840px" }}>
            <span className="badge-featured" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
              <i className="fa-solid fa-hand-holding-hand" style={{ color: "var(--color-primary)" }}></i>
              {sp?.hero_badge || "AfriJournal Scholarly & Editorial Advisory"}
            </span>
            <h1 
              style={{ 
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)", 
                fontWeight: 800, 
                margin: "0 0 1rem", 
                color: "var(--color-navy)", 
                lineHeight: 1.25, 
                letterSpacing: "-0.02em" 
              }}
            >
              {sp?.hero_title || "Academic Publishing, Writing & Indexation Advisory"}
            </h1>
            <p style={{ fontSize: "clamp(0.92rem, 2vw, 1.05rem)", color: "var(--color-text-muted)", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
              {sp?.hero_subtitle || "AfriJournal Index provides comprehensive institutional and author-level editorial advisory. From turnkey OJS setup for universities and Scopus/WoS indexation prep, to pre-submission peer review critique and manuscript polishing."}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem" }}>
              <a href="#consultation-form" className="btn btn-primary" style={{ padding: "0.75rem 1.6rem", fontWeight: 700 }}>
                {sp?.cta_consultation || "Request Consultation"} <i className="fa-solid fa-arrow-down" style={{ marginLeft: "6px", fontSize: "0.8rem" }}></i>
              </a>
              <Link href="/browse" className="btn btn-secondary" style={{ padding: "0.75rem 1.4rem", fontWeight: 700 }}>
                {sp?.cta_explore || "Explore Directory"}
              </Link>
            </div>
          </div>
        </div>

        {/* Section Header & Filter Pills */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: "clamp(1.4rem, 3vw, 1.85rem)", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.5rem" }}>
              {sp?.heading_title || "Seven Core Publishing & Indexing Pillars"}
            </h2>
            <p style={{ fontSize: "0.92rem", color: "var(--color-text-muted)", maxWidth: "680px", margin: "0 auto", lineHeight: 1.5 }}>
              {sp?.heading_subtitle || "Specialized services tailored for African universities, academic journal editors, and individual scholars."}
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: "0.6rem", 
              flexWrap: "wrap", 
              marginBottom: "1.5rem" 
            }}
          >
            <button
              type="button"
              onClick={() => setActivePillar("all")}
              className={`btn btn-sm ${activePillar === "all" ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "20px", padding: "0.45rem 1.15rem", fontWeight: 700, fontSize: "0.85rem" }}
            >
              <i className="fa-solid fa-shapes" style={{ marginRight: "6px" }}></i>
              {sp?.tab_all || "All Services"} ({services.length})
            </button>
            <button
              type="button"
              onClick={() => setActivePillar("institutional")}
              className={`btn btn-sm ${activePillar === "institutional" ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "20px", padding: "0.45rem 1.15rem", fontWeight: 700, fontSize: "0.85rem" }}
            >
              <i className="fa-solid fa-building-columns" style={{ marginRight: "6px" }}></i>
              {sp?.tab_institutions || "Institutions & Publishers"} (4)
            </button>
            <button
              type="button"
              onClick={() => setActivePillar("researcher")}
              className={`btn btn-sm ${activePillar === "researcher" ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "20px", padding: "0.45rem 1.15rem", fontWeight: 700, fontSize: "0.85rem" }}
            >
              <i className="fa-solid fa-user-graduate" style={{ marginRight: "6px" }}></i>
              {sp?.tab_researchers || "Researchers & Scholars"} (3)
            </button>
          </div>

          {/* Responsive Services Grid */}
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", 
              gap: "1.5rem" 
            }}
          >
            {filteredServices.map(svc => {
              const svcData = sp?.services?.[svc.key] || {};
              const title = svcData.title || svc.defaultTitle;
              const badge = svcData.badge || svc.defaultBadge;
              const description = svcData.description || "";
              const features: string[] = Array.isArray(svcData.features) ? svcData.features : [];
              const idealFor = svcData.idealFor || "";

              return (
                <div 
                  key={svc.id} 
                  className="card-surface" 
                  style={{ 
                    padding: "clamp(1.2rem, 3vw, 1.85rem)", 
                    borderRadius: "16px", 
                    border: "1px solid var(--color-border)", 
                    display: "flex", 
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)"
                  }}
                >
                  <div>
                    {/* Header Row: Icon & Pillar Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "0.5rem" }}>
                      <div 
                        style={{ 
                          width: "48px", 
                          height: "48px", 
                          borderRadius: "12px", 
                          background: `${svc.color}15`, 
                          border: `1px solid ${svc.color}35`, 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "center", 
                          color: svc.color, 
                          fontSize: "1.25rem",
                          flexShrink: 0
                        }}
                      >
                        <i className={svc.icon}></i>
                      </div>
                      <span 
                        style={{ 
                          fontSize: "0.72rem", 
                          fontWeight: 700, 
                          padding: "0.25rem 0.65rem", 
                          borderRadius: "20px", 
                          background: "var(--color-bg-card-subtle)", 
                          border: "1px solid var(--color-border)", 
                          color: "var(--color-text-muted)",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.5rem", lineHeight: 1.35 }}>
                      {title}
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: 1.55, margin: "0 0 1.2rem" }}>
                      {description}
                    </p>

                    {/* Deliverables Bullet List */}
                    {features.length > 0 && (
                      <div style={{ marginBottom: "1.25rem" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                          {sp?.deliver_heading || "What We Deliver:"}
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", color: "var(--color-text-body)", lineHeight: 1.55 }}>
                          {features.map((feat, idx) => (
                            <li key={idx} style={{ marginBottom: "0.35rem" }}>{feat}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Row: Target Audience & Selection Button */}
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", marginTop: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.6rem" }}>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", flex: 1, minWidth: "160px" }}>
                      <strong style={{ color: "var(--color-text-main)" }}>{sp?.ideal_for || "Ideal for:"}</strong> {idealFor}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, serviceType: title }));
                        const el = document.getElementById("consultation-form");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      {sp?.select_service || "Select Service"} <i className="fa-solid fa-arrow-down" style={{ marginLeft: "4px", fontSize: "0.7rem" }}></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Institutional Partnership Callout Banner */}
        <div 
          style={{ 
            background: "rgba(245, 158, 11, 0.06)", 
            border: "1px solid rgba(245, 158, 11, 0.25)", 
            borderRadius: "16px", 
            padding: "clamp(1.2rem, 3vw, 2rem)", 
            marginBottom: "3rem", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            gap: "1.5rem", 
            flexWrap: "wrap" 
          }}
        >
          <div style={{ flex: 1, minWidth: "260px" }}>
            <h3 style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.25rem)", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.4rem" }}>
              <i className="fa-solid fa-graduation-cap" style={{ marginRight: "8px", color: "var(--color-primary)" }}></i>
              {sp?.callout_title || "Are You an African University Directorate or Journal Editor?"}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.55 }}>
              {sp?.callout_desc || "AfriJournal Index partners with university presses, research directorates, and scientific societies to launch online peer-reviewed journals, deploy standard OJS systems, and assemble formal Scopus & Web of Science application dossiers."}
            </p>
          </div>
          <a 
            href="mailto:admin@afrijournalindexing.org?subject=University%20Journal%20Setup%20%26%20Indexing%20Consultation"
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap", padding: "0.7rem 1.5rem", fontWeight: 700, fontSize: "0.88rem" }}
          >
            <i className="fa-solid fa-envelope" style={{ marginRight: "6px" }}></i> 
            {sp?.callout_btn || "Contact Advisory Board"}
          </a>
        </div>

        {/* Comprehensive Consultation Request Form */}
        <div 
          id="consultation-form" 
          className="card-surface" 
          style={{ 
            padding: "clamp(1.5rem, 4vw, 2.5rem)", 
            borderRadius: "18px", 
            border: "1px solid var(--color-border)", 
            maxWidth: "840px", 
            margin: "0 auto" 
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <span className="badge-featured" style={{ marginBottom: "0.5rem" }}>
              <i className="fa-solid fa-file-signature"></i> {sp?.form_badge || "Consultation Request"}
            </span>
            <h2 style={{ fontSize: "clamp(1.35rem, 3vw, 1.65rem)", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.3rem" }}>
              {sp?.form_title || "Request Institutional or Author Consultation"}
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: 0 }}>
              {sp?.form_subtitle || "Our academic and technical specialists will review your requirements and respond within 24–48 hours."}
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div 
                style={{ 
                  width: "64px", 
                  height: "64px", 
                  borderRadius: "50%", 
                  background: "rgba(22, 163, 74, 0.15)", 
                  color: "#16a34a", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "1.8rem", 
                  margin: "0 auto 1.25rem" 
                }}
              >
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                {sp?.form_success_title || "Consultation Request Received"}
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", maxWidth: "520px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                {sp?.form_success_desc 
                  ? sp.form_success_desc.replace("{name}", formData.name).replace("{serviceType}", formData.serviceType).replace("{email}", formData.email)
                  : `Thank you, ${formData.name}. An AfriJournal editorial advisor has received your request regarding ${formData.serviceType} and will reach out to ${formData.email} shortly.`}
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.6rem 1.2rem", fontWeight: 700 }}
                >
                  {sp?.form_submit_another || "Submit Another Request"}
                </button>
                <Link href="/posts" className="btn btn-primary btn-sm" style={{ padding: "0.6rem 1.2rem", fontWeight: 700 }}>
                  {sp?.form_view_drafts || "Go to Posts & Drafts"}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {/* Row 1: Full Name & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                    {sp?.label_name || "Your Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={sp?.placeholder_name || "Prof. / Dr. / Researcher Name"}
                    className="form-input"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                    {sp?.label_email || "Academic Email Address *"}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={sp?.placeholder_email || "e.g. author@university.ac"}
                    className="form-input"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Row 2: Institution & Service Track */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                    {sp?.label_institution || "University / Academic Institution *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.institution}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder={sp?.placeholder_institution || "e.g. University of Nairobi / Makerere University"}
                    className="form-input"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                    {sp?.label_service || "Service Track Requested *"}
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="form-input"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.88rem", borderRadius: "8px", boxSizing: "border-box" }}
                  >
                    <optgroup label={sp?.pillar_institutional || "Institutional & Publisher Track"}>
                      <option value="University Journal Setup & Online OJS Incubation">
                        {sp?.services?.ojs_setup?.title || "University Journal Setup & Online OJS Incubation"}
                      </option>
                      <option value="Journal Indexing & AJCI Citation Matrix">
                        {sp?.services?.indexing_ajci?.title || "Journal Indexing & AJCI Citation Matrix"}
                      </option>
                      <option value="Journal Preparation for Scopus, Web of Science & DOAJ">
                        {sp?.services?.scopus_prep?.title || "Journal Preparation for Scopus, Web of Science & DOAJ"}
                      </option>
                      <option value="Institutional & University Research Rankings">
                        {sp?.services?.rankings_advisory?.title || "Institutional & University Research Rankings"}
                      </option>
                    </optgroup>
                    <optgroup label={sp?.pillar_researcher || "Researcher & Author Track"}>
                      <option value="AfriScholar Indexing & Verified Scholar ID (ASID)">
                        {sp?.services?.afrischolar_id?.title || "AfriScholar Indexing & Verified Scholar ID (ASID)"}
                      </option>
                      <option value="Reviewing Manuscripts Through Our Reviewer Portal">
                        {sp?.services?.manuscript_review?.title || "Reviewing Manuscripts Through Our Reviewer Portal"}
                      </option>
                      <option value="Manuscript Preparation & Technical Assistance">
                        {sp?.services?.manuscript_prep?.title || "Manuscript Preparation & Technical Assistance"}
                      </option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Row 3: Journal Title (Optional) */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                  {sp?.label_journal_name || "Journal Title or Proposed Subject (If Applicable)"}
                </label>
                <input
                  type="text"
                  value={formData.journalName}
                  onChange={(e) => setFormData(prev => ({ ...prev, journalName: e.target.value }))}
                  placeholder={sp?.placeholder_journal || "e.g. African Journal of Sustainable Development"}
                  className="form-input"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px", boxSizing: "border-box" }}
                />
              </div>

              {/* Row 4: Requirements & Details */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                  {sp?.label_details || "Project Requirements & Specific Objectives *"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.details}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  placeholder={sp?.placeholder_details || "Describe your journal, manuscript, or institutional project needs..."}
                  className="form-input"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>

              {/* Submit Button */}
              <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 2rem", fontSize: "0.92rem", fontWeight: 700 }}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "6px" }}></i>
                      {sp?.btn_submitting || "Submitting Request..."}
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane" style={{ marginRight: "6px" }}></i>
                      {sp?.btn_submit || "Submit Consultation Request"}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
