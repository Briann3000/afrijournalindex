"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    institution: "",
    serviceType: "Article Writing & Polishing",
    manuscriptTitle: "",
    details: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const services = [
    {
      id: "writing",
      title: "Manuscript Writing & Language Polishing",
      icon: "fa-solid fa-pen-nib",
      badge: "Author Support",
      color: "#f59e0b",
      description: "Comprehensive assistance for scholars preparing draft manuscripts for peer-reviewed journal submission.",
      features: [
        "IMRAD Structuring: Organizing Introduction, Methodology, Results, and Discussion into standard academic conventions.",
        "Language & Tone Polishing: Ensuring clarity, precision, and rigorous scholarly English.",
        "Citation & Reference Harmonization: Formatting references strictly according to journal requirements (APA 7th, Harvard, Chicago, Vancouver, IEEE).",
        "Abstract & Title Optimization: Formulating high-impact abstracts with relevant keywords to maximize post-publication discovery."
      ],
      idealFor: "Postgraduate scholars, early-career researchers, and faculty preparing working papers for publication."
    },
    {
      id: "matchmaking",
      title: "Journal Selection & Matchmaking",
      icon: "fa-solid fa-compass-drafting",
      badge: "Targeted Placement",
      color: "#3b82f6",
      description: "Expert guidance in finding the right peer-reviewed journal that aligns with your research scope, methodology, and career goals.",
      features: [
        "Aims & Scope Diagnostic: Matching draft abstracts against the editorial focus of indexed African and global journals to prevent desk rejections.",
        "Indexation Verification: Vetting potential targets in AJCI, Scopus, Web of Science (WoS), and DOAJ.",
        "Predatory Publishing Safeguard: Rigorous checks to safeguard researchers from deceptive vanity publishers and unverified fee mills.",
        "Submission Package Preparation: Guidance on cover letters, author declarations, and data availability statements."
      ],
      idealFor: "Authors unsure of the most suitable journal venue or looking to maximize citation velocity."
    },
    {
      id: "review",
      title: "Peer Review Simulation & Critique",
      icon: "fa-solid fa-user-graduate",
      badge: "Quality Assurance",
      color: "#8b5cf6",
      description: "Blind pre-submission critique conducted by discipline experts to uncover flaws before formal journal editorial submission.",
      features: [
        "Methodology & Statistical Scrutiny: Evaluating study designs, sample representativeness, instrumentation, and analytical models.",
        "Originality & Plagiarism Screening: Pre-submission originality analysis to safeguard academic integrity and prevent copyright conflicts.",
        "Reviewer Rebuttal Simulation: Anticipating tough reviewer questions and strengthening theoretical justifications in advance.",
        "Detailed Feedback Dossier: Actionable, itemized recommendations with specific text revision pointers."
      ],
      idealFor: "Scholars targeting Q1/Q2 journals who want rigorous feedback before submitting."
    },
    {
      id: "indexing",
      title: "Journal Indexing & Editorial Advisory",
      icon: "fa-solid fa-shield-halved",
      badge: "For Journal Editors",
      color: "#f59e0b",
      description: "End-to-end consulting for African academic journals seeking formal inclusion in DOAJ, AJCI, Scopus, and Web of Science.",
      features: [
        "Scopus & Web of Science Readiness Audits: Assessing diversity of editorial boards, international authorship ratios, and citation velocity.",
        "Open Journal Systems (OJS) Technical Setup: Implementing modern OJS workflows, OAI-PMH metadata endpoints, and Crossref DOI pipelines.",
        "Publication Ethics Compliance: Developing transparent peer review policies, COPE compliance guidelines, and copyright frameworks.",
        "Application Dossier Assembly: Direct support compiling and submitting the formal journal dossier to Scopus CSAB and Clarivate WoS."
      ],
      idealFor: "University presses, research institutes, scientific associations, and journal chief editors across Africa."
    }
  ];

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header activePage="services" />

      <main className="container services-main-container" style={{ padding: "3rem 1rem 6rem", maxWidth: "1100px", boxSizing: "border-box" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/about" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>About</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>Services</span>
        </div>

        {/* Hero Section */}
        <div className="card-surface" style={{ padding: "3rem", borderRadius: "18px", border: "1px solid var(--color-border)", marginBottom: "2.5rem", background: "linear-gradient(180deg, var(--color-bg-card) 0%, var(--color-bg-card-subtle) 100%)" }}>
          <div style={{ maxWidth: "780px" }}>
            <span className="badge-featured" style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
              <i className="fa-solid fa-hand-holding-hand" style={{ color: "var(--color-primary)" }}></i>
              AfriJournal Scholarly &amp; Editorial Advisory
            </span>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0 0 1rem", color: "var(--color-navy)", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
              Academic Publishing, Writing &amp; Indexation Advisory
            </h1>
            <p style={{ fontSize: "1.05rem", color: "var(--color-text-muted)", lineHeight: 1.6, margin: "0 0 1.75rem" }}>
              AfriJournal Index (AJI) provides expert editorial support to African scholars, researchers, and scientific journal editors. From polishing draft manuscripts and selecting the right indexed journal, to preparing publications for Scopus and Web of Science accreditation.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <a href="#consultation-form" className="btn btn-primary" style={{ padding: "0.75rem 1.6rem", fontWeight: 700 }}>
                Request Consultation <i className="fa-solid fa-arrow-down" style={{ marginLeft: "6px", fontSize: "0.8rem" }}></i>
              </a>
              <Link href="/browse" className="btn btn-secondary" style={{ padding: "0.75rem 1.4rem", fontWeight: 700 }}>
                Explore Indexed Journals
              </Link>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div style={{ marginBottom: "3rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.5rem" }}>
              Four Core Editorial Pillars
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", margin: 0 }}>
              Tailored services for individual scholars and institutional journal editors.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: "1.5rem" }}>
            {services.map(svc => (
              <div 
                key={svc.id} 
                className="card-surface" 
                style={{ 
                  padding: "2rem", 
                  borderRadius: "16px", 
                  border: "1px solid var(--color-border)", 
                  display: "flex", 
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, border-color 0.2s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: `${svc.color}15`, border: `1px solid ${svc.color}35`, display: "flex", alignItems: "center", justifyContent: "center", color: svc.color, fontSize: "1.2rem" }}>
                      <i className={svc.icon}></i>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "20px", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                      {svc.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.6rem" }}>
                    {svc.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.55, margin: "0 0 1.25rem" }}>
                    {svc.description}
                  </p>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
                      What We Deliver:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem", color: "var(--color-text-body)", lineHeight: 1.6 }}>
                      {svc.features.map((feat, idx) => (
                        <li key={idx} style={{ marginBottom: "0.35rem" }}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    <strong style={{ color: "var(--color-text-main)" }}>Ideal for:</strong> {svc.idealFor}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, serviceType: svc.title }));
                      const el = document.getElementById("consultation-form");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", fontWeight: 700 }}
                  >
                    Select Service <i className="fa-solid fa-check" style={{ marginLeft: "4px" }}></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advisory / Institutional Callout */}
        <div style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "16px", padding: "2rem", marginBottom: "3rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.4rem" }}>
              <i className="fa-solid fa-graduation-cap" style={{ marginRight: "8px", color: "var(--color-primary)" }}></i>
              Are You an African Journal Editor or University Press?
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
              AfriJournal Index partners with universities, faculty, and scientific societies to upgrade editorial standards, establish digital DOIs via Crossref, and prepare applications for Scopus and Web of Science indexation.
            </p>
          </div>
          <a 
            href="mailto:afrijournalindex@gmail.com?subject=Journal%20Editorial%20%26%20Indexation%20Consultation"
            className="btn btn-primary"
            style={{ whiteSpace: "nowrap", padding: "0.65rem 1.4rem", fontWeight: 700 }}
          >
            <i className="fa-solid fa-envelope" style={{ marginRight: "6px" }}></i> Contact Editorial Board
          </a>
        </div>

        {/* Consultation Request Form */}
        <div id="consultation-form" className="card-surface" style={{ padding: "2.5rem", borderRadius: "18px", border: "1px solid var(--color-border)", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <span className="badge-featured" style={{ marginBottom: "0.5rem" }}>
              <i className="fa-solid fa-file-signature"></i> Consultation Request
            </span>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.3rem" }}>
              Submit Your Article or Journal for Expert Review
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: 0 }}>
              Our editorial specialists will review your requirements and respond within 24–48 hours.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 1.25rem" }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                Consultation Request Received
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", maxWidth: "480px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                Thank you, <strong>{formData.name}</strong>. An AfriJournal editorial advisor has received your request regarding <strong>{formData.serviceType}</strong> and will reach out to <strong>{formData.email}</strong> shortly.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); }}
                  className="btn btn-secondary btn-sm"
                >
                  Submit Another Request
                </button>
                <Link href="/posts" className="btn btn-primary btn-sm">
                  Go to Posts &amp; Drafts
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Prof. / Dr. / Researcher Name"
                    className="form-input"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. author@university.edu"
                    className="form-input"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                    Academic Institution / Organization
                  </label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="e.g. University of Nairobi, Makerere University"
                    className="form-input"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                    Service Requested *
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="form-select"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px" }}
                  >
                    <option value="Manuscript Writing & Language Polishing">Manuscript Writing &amp; Language Polishing</option>
                    <option value="Journal Selection & Matchmaking">Journal Selection &amp; Matchmaking</option>
                    <option value="Peer Review Simulation & Critique">Peer Review Simulation &amp; Critique</option>
                    <option value="Journal Indexing & Editorial Advisory">Journal Indexing &amp; Editorial Advisory (DOAJ, Scopus, WoS)</option>
                    <option value="General Editorial Consulting">General Editorial Consulting</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                  Manuscript or Journal Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.manuscriptTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, manuscriptTitle: e.target.value }))}
                  placeholder="Title of your working paper, thesis article, or journal entity"
                  className="form-input"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>
                  Project Description &amp; Specific Requirements *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.details}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Outline your research topic, current status (draft manuscript, rejected paper, new journal), target timeline, and specific assistance needed..."
                  className="form-input"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", fontSize: "0.9rem", borderRadius: "8px", resize: "vertical" }}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginTop: "0.5rem" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: "4px", color: "var(--color-primary)" }}></i>
                  All manuscript drafts are protected under strict AfriJournal Index confidentiality &amp; academic privacy.
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: "0.75rem 1.8rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-paper-plane" style={{ marginRight: "6px" }}></i> Submit Request
                </button>
              </div>
            </form>
          )}

          {/* Contact Direct Box */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            <div>
              <i className="fa-regular fa-envelope" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i>
              <strong>Email:</strong> <a href="mailto:afrijournalindex@gmail.com" style={{ color: "var(--color-primary)", textDecoration: "none" }}>afrijournalindex@gmail.com</a>
            </div>
            <div>
              <i className="fa-solid fa-shield-halved" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i>
              <strong>Service:</strong> AfriJournal Index Editorial &amp; Academic Advisory Desk
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
