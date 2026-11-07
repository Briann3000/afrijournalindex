"use client";

import React from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function Methodology() {
  const { lang, setLang, t } = useLang();
  const m = t.methodology_page || {};

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Header */}
      <Header />

      <main className="container reading-container" style={{ padding: "clamp(2rem, 4vw, 3.5rem) 1rem clamp(3.5rem, 6vw, 6rem)", maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: "2.5rem", textAlign: "left" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
            <span className="badge-featured" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <i className="fa-solid fa-scale-balanced"></i>
              {m.badge || "Bibliometric Standards & Operational Protocol"}
            </span>
            <span style={{ fontSize: "0.78rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", padding: "0.25rem 0.65rem", borderRadius: "6px", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Version 1.0 • Operational Methodology
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, margin: "0 0 0.75rem", color: "var(--color-text-main)" }}>
            {t.footer?.methodology || "AJCI Methodology"}
          </h1>
          <p className="page-subtitle" style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "var(--color-text-muted)", lineHeight: "1.7", maxWidth: "880px", margin: 0 }}>
            {m.desc || "Transparent, reproducible, and verifiable calculation guidelines for African scholarly journal citation metrics."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Section 1: Guiding Principles */}
          <div className="card-surface" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "0.75rem", fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-shield-halved" style={{ color: "var(--color-primary)" }}></i>
              {m.principles_title || "Guiding Principles & Scientific Integrity"}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.75", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              AfriJournal Citation Index (AJCI) operates as an open, auditable indexing framework. Its administration adheres to six mandatory scientific and operational principles:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))", gap: "1rem" }}>
              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem", fontSize: "0.92rem" }}>
                  <i className="fa-solid fa-eye" style={{ color: "#d97706" }}></i>
                  Transparency
                </strong>
                <p style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", margin: 0, lineHeight: "1.6" }}>
                  {m.principle_transparency || "Open counting rules, fixed calendar-year windows, and fully disclosed evaluation sources."}
                </p>
              </div>

              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem", fontSize: "0.92rem" }}>
                  <i className="fa-solid fa-link" style={{ color: "#2563eb" }}></i>
                  1-to-1 Traceability
                </strong>
                <p style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", margin: 0, lineHeight: "1.6" }}>
                  {m.principle_traceability || "Every counted citation is mapped between verifiable citing works and target AJCI articles."}
                </p>
              </div>

              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem", fontSize: "0.92rem" }}>
                  <i className="fa-solid fa-ruler-combined" style={{ color: "#16a34a" }}></i>
                  Consistency
                </strong>
                <p style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", margin: 0, lineHeight: "1.6" }}>
                  {m.principle_consistency || "Universal eligibility, deduplication, and matching standards applied uniformly to every journal."}
                </p>
              </div>

              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem", fontSize: "0.92rem" }}>
                  <i className="fa-solid fa-arrows-rotate" style={{ color: "#8b5cf6" }}></i>
                  Reproducibility
                </strong>
                <p style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", margin: 0, lineHeight: "1.6" }}>
                  {m.principle_reproducibility || "Full audit retention allows independent third-party reviewers to reconstruct scores identically."}
                </p>
              </div>

              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem", fontSize: "0.92rem" }}>
                  <i className="fa-solid fa-scale-balanced" style={{ color: "#0284c7" }}></i>
                  Contextual Interpretation
                </strong>
                <p style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", margin: 0, lineHeight: "1.6" }}>
                  {m.principle_context || "Adheres to DORA; scores reflect journal-level activity, not direct quality of individual articles."}
                </p>
              </div>

              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.4rem", fontSize: "0.92rem" }}>
                  <i className="fa-solid fa-circle-check" style={{ color: "#dc2626" }}></i>
                  Scientific Integrity
                </strong>
                <p style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", margin: 0, lineHeight: "1.6" }}>
                  {m.principle_integrity || "Strict elimination of citation cartels, coerced citations, and fabricated references."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: 2-Year AJCI Citation Score Formula */}
          <div className="card-surface" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "0.75rem", fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-calculator"></i>
              {m.formula_title || "2-Year AJCI Citation Score"}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "1.25rem", fontSize: "0.95rem" }}>
              {m.formula_desc || "For an evaluation year Y, the 2-Year AJCI Citation Score is the total number of eligible, verified citations recorded in year Y to peer-reviewed articles published by the journal in calendar years Y−1 and Y−2, divided by total eligible citable articles published in those two years."}
            </p>

            {/* Responsive Formula Block 1: 2-Year AJCI */}
            <div style={{
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              padding: "clamp(1rem, 2.5vw, 1.75rem)",
              borderRadius: "12px",
              margin: "1.2rem 0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "clamp(0.75rem, 2vw, 1.5rem)",
              flexWrap: "wrap",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch"
            }}>
              <span style={{ fontSize: "clamp(1rem, 2.2vw, 1.25rem)", fontWeight: 800, color: "var(--color-primary)", whiteSpace: "nowrap" }}>
                {m.formula_equation || "2-Year AJCI Citation Score ="}
              </span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: "min(100%, 320px)" }}>
                <span style={{ borderBottom: "2px solid var(--color-text-main)", paddingBottom: "6px", fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)", fontWeight: 600, color: "var(--color-text-main)", width: "100%" }}>
                  {m.formula_num || "Verified Citations in Year Y to Articles Published in Y−1 & Y−2 (C)"}
                </span>
                <span style={{ paddingTop: "6px", fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)", fontWeight: 600, color: "var(--color-text-body)", width: "100%" }}>
                  {m.formula_den || "Total Peer-Reviewed Citable Articles Published in Y−1 & Y−2 (P)"}
                </span>
              </div>
            </div>

            {/* Responsive Formula Block 2: 3-Year Citation Average (3-YCA) */}
            <div style={{
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              padding: "clamp(1rem, 2.5vw, 1.75rem)",
              borderRadius: "12px",
              margin: "1.2rem 0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "clamp(0.75rem, 2vw, 1.5rem)",
              flexWrap: "wrap",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch"
            }}>
              <span style={{ fontSize: "clamp(1rem, 2.2vw, 1.25rem)", fontWeight: 800, color: "#2563eb", whiteSpace: "nowrap" }}>
                {m.formula_3yca_title || "3-Year Citation Average (3-YCA)"} =
              </span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", minWidth: "min(100%, 320px)" }}>
                <span style={{ borderBottom: "2px solid var(--color-text-main)", paddingBottom: "6px", fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)", fontWeight: 600, color: "var(--color-text-main)", width: "100%" }}>
                  {m.formula_3yca_num || "Citations in Evaluation Year Y to Articles Published in Y−1, Y−2 & Y−3"}
                </span>
                <span style={{ paddingTop: "6px", fontSize: "clamp(0.85rem, 1.8vw, 0.95rem)", fontWeight: 600, color: "var(--color-text-body)", width: "100%" }}>
                  {m.formula_3yca_den || "Total Citable Articles Published in Y−1, Y−2 & Y−3"}
                </span>
              </div>
            </div>

            <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1rem 1.25rem", marginTop: "1.25rem", fontSize: "0.88rem", color: "var(--color-text-body)", lineHeight: "1.7" }}>
              <i className="fa-solid fa-circle-info" style={{ color: "var(--color-primary)", marginRight: "8px" }}></i>
              {m.formula_notes || "Calculated as C ÷ P and rounded to three decimal places (0.000). If P = 0, the metric reports 'Not calculable — no eligible articles'. The official version-of-record publication year is strictly applied."}
            </div>
          </div>

          {/* Section 3: Denominator Construction & Exclusions */}
          <div className="card-surface" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "0.75rem", fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-layer-group"></i>
              {m.denominator_title || "Denominator Rules & Eligible Citable Items (P)"}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.75", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              {m.denominator_desc || "The denominator strictly comprises substantive scholarly contributions that have undergone the journal's declared editorial peer-review process and form part of the permanent scholarly record."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1.25rem" }}>
              
              {/* Eligible Items */}
              <div style={{ background: "rgba(22, 163, 74, 0.05)", border: "1px solid rgba(22, 163, 74, 0.25)", padding: "1.5rem", borderRadius: "10px" }}>
                <h4 style={{ color: "#16a34a", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-circle-check"></i>
                  {m.denominator_eligible_title || "Eligible Citable Publications"}
                </h4>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--color-text-body)", fontSize: "0.9rem", lineHeight: "1.8" }}>
                  <li><strong>Original Research Articles:</strong> Full-length empirical and theoretical contributions.</li>
                  <li><strong>Peer-Reviewed Review Articles:</strong> Systematic reviews, meta-analyses, and scoping reviews.</li>
                  <li><strong>Substantive Research Notes:</strong> Peer-reviewed short communications with formal scholarly analysis.</li>
                </ul>
              </div>

              {/* Excluded Items */}
              <div style={{ background: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.25)", padding: "1.5rem", borderRadius: "10px" }}>
                <h4 style={{ color: "#dc2626", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-circle-xmark"></i>
                  {m.denominator_excluded_title || "Strictly Excluded Document Types"}
                </h4>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--color-text-body)", fontSize: "0.9rem", lineHeight: "1.8" }}>
                  <li>Editorials, editor introductions, and publisher announcements.</li>
                  <li>Calls for papers, conference notices, and event announcements.</li>
                  <li>Book reviews that do not constitute original peer-reviewed research.</li>
                  <li>Errata, corrections, retractions, and expressions of concern.</li>
                  <li>Front/back matter, tables of contents, and duplicate records.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: Numerator Rules & Citing Sources */}
          <div className="card-surface" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "0.75rem", fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-quote-left"></i>
              {m.numerator_title || "Numerator Rules & Ingested Citing Sources (C)"}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.75", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              {m.numerator_desc || "A citation may be counted when it appears in a verifiable scholarly publication with identifiable bibliographic metadata and a traceable reference to an eligible target article. Geographic origin alone neither qualifies nor disqualifies a citation."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1.25rem" }}>
              <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "1.4rem", borderRadius: "10px" }}>
                <h4 style={{ color: "var(--color-primary)", fontSize: "1rem", fontWeight: 700, margin: "0 0 0.6rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-book-open"></i>
                  {m.numerator_core_title || "Core Verified Sources"}
                </h4>
                <p style={{ color: "var(--color-text-body)", fontSize: "0.88rem", lineHeight: "1.7", margin: 0 }}>
                  {m.numerator_core_desc || "Peer-reviewed journal articles, review articles, scholarly conference proceedings with identifiable reference lists, and academic books/monographs issued by recognized scholarly publishers."}
                </p>
              </div>

              <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "1.4rem", borderRadius: "10px" }}>
                <h4 style={{ color: "#d97706", fontSize: "1rem", fontWeight: 700, margin: "0 0 0.6rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-graduation-cap"></i>
                  {m.numerator_grey_title || "Supplementary Grey Literature"}
                </h4>
                <p style={{ color: "var(--color-text-body)", fontSize: "0.88rem", lineHeight: "1.7", margin: 0 }}>
                  {m.numerator_grey_desc || "Theses, dissertations, preprints, working papers, and institutional policy reports are tracked separately as supplementary citation evidence and are never conflated into the core AJCI score."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Journal Self-Citations & External Impact */}
          <div className="card-surface" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "0.75rem", fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-arrows-split-up-and-left"></i>
              {m.self_citation_title || "Journal Self-Citations & AJCI External Citation Score"}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.75", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              {m.self_citation_desc || "To safeguard against coercive editorial practices and artificial score inflation, AJCI isolates journal self-citations (citations originating in the same journal) and mandates full disclosure in every public evaluation."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
              {/* Formula: Self-Citation Rate */}
              <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                  {m.self_citation_rate_label || "Self-Citation Rate (%)"}
                </span>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#d97706" }}>
                  {m.self_citation_rate_formula || "(Journal Self-Citations ÷ Total Verified Citations) × 100"}
                </div>
              </div>

              {/* Formula: External Citation Score */}
              <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                  {m.external_score_label || "AJCI External Citation Score"}
                </span>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#16a34a" }}>
                  {m.external_score_formula || "Verified External Citations (Excluding Self-Citations) ÷ P"}
                </div>
              </div>
            </div>

            <p style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", margin: 0, lineHeight: "1.6" }}>
              A high self-citation percentage serves as a review signal rather than automatic disqualification. Disciplinary norms, niche specialization, and special issues are evaluated before final audit sign-off.
            </p>
          </div>

          {/* Section 6: Verification & 9-Stage Audit Lifecycle */}
          <div className="card-surface" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "0.75rem", fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-list-check"></i>
              {m.audit_title || "Citation Verification & 9-Stage Audit Lifecycle"}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.75", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              {m.audit_desc || "Every citation counted by AJCI is audited against an exacting matching standard: exact DOI resolution or complete title agreement plus at least two bibliographic fields (author, journal, volume, page range). Fuzzy title similarity alone is rejected."}
            </p>

            {/* Responsive Table / Workflow Container */}
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: "1.25rem" }}>
              <table style={{ width: "100%", minWidth: "620px", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--color-bg-card-subtle)", borderBottom: "2px solid var(--color-border)" }}>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-main)", fontWeight: 700, width: "25%" }}>Stage</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-main)", fontWeight: 700, width: "35%" }}>Audit Action</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-main)", fontWeight: 700, width: "40%" }}>Quality Output &amp; Control</th>
                  </tr>
                </thead>
                <tbody style={{ color: "var(--color-text-body)" }}>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>1. Register</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Confirm journal identity, title history, ISSN/eISSN status, and publisher.</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>Journal evaluation profile created.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>2. Build Denominator</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Compile and classify all published articles in Y−1 and Y−2.</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>Verified eligible article list and denominator P.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>3. Discover Citations</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Search approved open citation networks (Crossref, OpenAlex, OAI-PMH).</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>Candidate citation records compiled.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>4. Verify &amp; Match</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Validate citing publication year, source eligibility, and cited target match.</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>Verified citation audit records.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>5. Deduplicate</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Remove repeated database entries and multiple in-text mentions.</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>Unique verified citation count C.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>6. Classify</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Separate internal journal self-citations from external citations.</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>Self-citation rate and external count established.</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>7. Calculate</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Divide C by P without intermediate rounding.</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>2-Year AJCI Citation Score (3 decimal places).</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>8. Independent Review</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Perform second-reviewer quality check and resolve exceptions.</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>Quality assurance sign-off.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--color-primary)" }}>9. Publish &amp; Archive</td>
                    <td style={{ padding: "0.75rem 1rem" }}>Issue dated score report and store full reproducible audit trail.</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)" }}>Public metric record; 5-year retention active.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "0.9rem 1.2rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: "6px", color: "var(--color-primary)" }}></i>
              {m.audit_retention || "AJI retains audit logs, resolution notes, and calculation workbooks for a minimum of 5 years to guarantee full reproducibility."}
            </div>
          </div>

          {/* Section 7: National & International Standards Alignment */}
          <div className="card-surface" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            <h2 style={{ color: "var(--color-secondary)", marginBottom: "0.75rem", fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-landmark"></i>
              {m.standards_title || "Statutory & International Standards Alignment"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1.25rem", marginTop: "1rem" }}>
              
              {/* NACOSTI Guidelines */}
              <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "1.5rem", borderRadius: "10px" }}>
                <h4 style={{ color: "var(--color-text-main)", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.6rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-certificate" style={{ color: "var(--color-primary)" }}></i>
                  {m.standards_nacosti_title || "NACOSTI National Guidelines (Kenya)"}
                </h4>
                <p style={{ color: "var(--color-text-body)", fontSize: "0.9rem", lineHeight: "1.75", margin: 0 }}>
                  {m.standards_nacosti_desc || "Formulated to align with the National Commission for Science, Technology and Innovation (NACOSTI) 2021 guidelines for journal accreditation, fulfilling statutory criteria for university faculty evaluations, academic promotions, and university research benchmarking."}
                </p>
              </div>

              {/* DORA Declaration */}
              <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "1.5rem", borderRadius: "10px" }}>
                <h4 style={{ color: "var(--color-text-main)", fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.6rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-scale-balanced" style={{ color: "#2563eb" }}></i>
                  {m.standards_dora_title || "DORA & Responsible Research Assessment"}
                </h4>
                <p style={{ color: "var(--color-text-body)", fontSize: "0.9rem", lineHeight: "1.75", margin: 0 }}>
                  {m.standards_dora_desc || "In accordance with the San Francisco Declaration on Research Assessment (DORA), AJCI scores reflect journal-level citation activity and must not be used as a singular proxy for individual paper quality or author competence."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 8: The Continental Citation Dividend & Ingestion */}
          <div className="card-surface" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)" }}>
            <h2 style={{ color: "#0284c7", marginBottom: "0.75rem", fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <i className="fa-solid fa-earth-africa"></i>
              {m.dividend_title || "The Continental Citation Dividend & Data Provenance"}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              {m.dividend_desc || "Historically, legacy subscription-based indexing databases have underrepresented African research by restricting coverage primarily to closed, Northern-hemisphere periodicals. AfriJournal Index resolves this structural gap by ingesting open citation networks from verified international authorities:"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.3rem" }}>
                  <i className="fa-solid fa-fingerprint" style={{ color: "#d97706" }}></i> Crossref &amp; I4OC
                </strong>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Official Digital Object Identifier (DOI) reference graph tracking formal scholarly citations worldwide.
                </span>
              </div>
              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.3rem" }}>
                  <i className="fa-solid fa-check-circle" style={{ color: "#16a34a" }}></i> DOAJ Standards
                </strong>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Strict peer-review integrity and open-access licensing benchmarks, guarding against predatory practices.
                </span>
              </div>
              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <strong style={{ color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.3rem" }}>
                  <i className="fa-solid fa-network-wired" style={{ color: "#2563eb" }}></i> OpenAlex &amp; OAI-PMH
                </strong>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Continental repository harvesting across 1,900+ African scholarly venues, capturing authentic institutional citations.
                </span>
              </div>
            </div>

            <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: "10px" }}>
              <h4 style={{ color: "var(--color-secondary)", marginBottom: "0.75rem", fontSize: "1.05rem", fontWeight: 700 }}>
                {m.criteria_title || "Automated Evaluation Criteria"}
              </h4>
              <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.25rem", margin: 0, fontSize: "0.9rem" }}>
                <li>{m.criteria_1 || "Metadata Consistency: Verified active ISSN/eISSN status with official registries."}</li>
                <li>{m.criteria_2 || "Open Peer-Review: Verified adherence to transparent editorial peer-review workflows."}</li>
                <li>{m.criteria_3 || "Publishing Regularity: The journal must publish at least two issues annually without gap years."}</li>
                <li>{m.criteria_4 || "Domain Security: Verified HTTPS encryption and active journal homepage."}</li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
