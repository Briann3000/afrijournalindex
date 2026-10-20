"use client";

import React from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function About() {
  const { t } = useLang();

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Header */}
      <Header activePage="about" />

      <main className="container reading-container" style={{ padding: "3.5rem 0 6rem" }}>
        <div className="page-header" style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-circle-info"></i>
            Continental Scholarly Infrastructure
          </span>
          <h1 className="page-title">{t.nav.about || "About AfriJournal Indexing"}</h1>
          <p className="page-subtitle" style={{ maxWidth: "680px", margin: "0.5rem auto 0" }}>
            {t.about_page.subtitle}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Mission Card */}
          <div className="card-surface" style={{ padding: "2.5rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(13, 148, 136, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                <i className="fa-solid fa-earth-africa" style={{ fontSize: "1.1rem" }}></i>
              </div>
              <h2 style={{ color: "var(--color-navy)", fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>
                {t.about_page.mission_title}
              </h2>
            </div>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "1.25rem", fontSize: "0.98rem" }}>
              {t.about_page.mission_text1}
            </p>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.98rem", margin: 0 }}>
              {t.about_page.mission_text2}
            </p>
          </div>

          {/* Pillars Grid */}
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-navy)", marginBottom: "1.2rem", textAlign: "center" }}>
              {t.about_page.pillars_title || "Our Core Academic Pillars"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
              <div className="card-surface" style={{ padding: "1.75rem", borderRadius: "14px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", marginBottom: "1rem" }}>
                  <i className="fa-solid fa-lock-open" style={{ fontSize: "1.1rem" }}></i>
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  {t.about_page.pillar_open || "Open & Free Infrastructure"}
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-body)", lineHeight: "1.6", margin: 0 }}>
                  {t.about_page.pillar_open_text || "Zero submission fees, zero subscription paywalls, and zero barriers for African journals and researchers."}
                </p>
              </div>

              <div className="card-surface" style={{ padding: "1.75rem", borderRadius: "14px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669", marginBottom: "1rem" }}>
                  <i className="fa-solid fa-chart-line" style={{ fontSize: "1.1rem" }}></i>
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  {t.about_page.pillar_metrics || "Transparent African Bibliometrics"}
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-body)", lineHeight: "1.6", margin: 0 }}>
                  {t.about_page.pillar_metrics_text || "Objective citation calculation models (AJCI) and citation tracking designed to reflect African scientific advancement."}
                </p>
              </div>

              <div className="card-surface" style={{ padding: "1.75rem", borderRadius: "14px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", marginBottom: "1rem" }}>
                  <i className="fa-solid fa-microchip" style={{ fontSize: "1.1rem" }}></i>
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  {t.about_page.pillar_capacity || "Automated Publisher Diagnostics"}
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-body)", lineHeight: "1.6", margin: 0 }}>
                  {t.about_page.pillar_capacity_text || "Instant crawler compliance diagnostics helping editorial teams identify and fix metadata deficiencies."}
                </p>
              </div>
            </div>
          </div>

          {/* Governance & COPE Alignment Card */}
          <div className="card-surface" style={{ padding: "2.5rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(2, 132, 199, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: "1.1rem" }}></i>
              </div>
              <h2 style={{ color: "var(--color-navy)", fontSize: "1.35rem", fontWeight: 800, margin: 0 }}>
                {t.about_page.partner_title}
              </h2>
            </div>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.98rem", margin: 0 }}>
              {t.about_page.partner_text}
            </p>
          </div>

          {/* Key Pillars of the Paradigm Shift Section */}
          <div className="card-surface" style={{ padding: "2.5rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(180, 83, 9, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309" }}>
                <i className="fa-solid fa-scale-balanced" style={{ fontSize: "1.15rem" }}></i>
              </div>
              <div>
                <h2 style={{ color: "var(--color-navy)", fontSize: "1.45rem", fontWeight: 800, margin: 0 }}>
                  Strategic Paradigm Shift in African Scholarly Indexing
                </h2>
                <span style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}>
                  afrijournalindexing.org
                </span>
              </div>
            </div>

            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.98rem", marginBottom: "1.5rem" }}>
              AfriJournal Indexing (afrijournalindexing.org) represents a strategic shift in how academic research, journal impact, and citation metrics are evaluated within the African scientific ecosystem. Traditional global citation engines have historically relied on Western-centric indexing criteria, high subscription barriers, and citation algorithms that often overlook localized research contexts.
            </p>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.98rem", marginBottom: "2rem" }}>
              AfriJournal Indexing addresses these gaps by introducing an open, transparent indexing directory and a regionalized citation metrics engine.
            </p>

            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-navy)", marginBottom: "1.25rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
              Key Pillars of the Paradigm Shift
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {/* Pillar 1 */}
              <div style={{ background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#0284c7", color: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" }}>1</span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-navy)", margin: 0 }}>
                    Context-Aware Citation Formulation (AJCI &amp; 3-YCA)
                  </h4>
                </div>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-body)", lineHeight: "1.7", marginBottom: "1rem" }}>
                  Traditional metrics like the standard 2-year Journal Impact Factor can inadvertently penalize journals with bi-annual, quarterly, or localized publishing cadences common in developing research infrastructures. AfriJournal utilizes:
                </p>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.88rem", color: "var(--color-text-body)", lineHeight: "1.75", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <li>
                    <strong>AfriJournal Citation Index (AJCI):</strong> Measures the standard 2-year citation window (citations in a given year to articles published in the previous two years).
                  </li>
                  <li>
                    <strong>3-Year Citation Average (3-YCA):</strong> Extends the window to buffer against publication irregularities and capture the true maturation cycle of regional scholarship.
                  </li>
                  <li>
                    <strong>Regional Context Weighting:</strong> Designed to capture the &ldquo;continental citation dividend,&rdquo; aligning metrics with global standards (like SCImago/OpenAlex models) while properly valuing research that addresses localized socioeconomic, health, and agricultural challenges.
                  </li>
                </ul>
              </div>

              {/* Pillar 2 */}
              <div style={{ background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" }}>2</span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-navy)", margin: 0 }}>
                    Dismantling Predatory and Financial Barriers
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.88rem", color: "var(--color-text-body)", lineHeight: "1.75", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <li>
                    <strong>100% Free Open Indexing:</strong> The platform offers baseline indexing at zero cost to democratize visibility for grassroots or emerging African journals that cannot afford heavy international processing fees.
                  </li>
                  <li>
                    <strong>Cartel Defense &amp; Rigorous Validation:</strong> Utilizing metadata consistency checks (active ISSN/eISSN verification), open peer-review validation, and strict adherence to DOAJ (Directory of Open Access Journals) standards, the system works to weed out predatory publishing practices while protecting legitimate regional journals.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div style={{
            background: "linear-gradient(135deg, #042f2e 0%, #134e4a 100%)",
            color: "#ffffff",
            padding: "2.5rem",
            borderRadius: "16px",
            textAlign: "center"
          }}>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.75rem", color: "#ffffff" }}>
              Submit Your Publication for Indexing
            </h3>
            <p style={{ fontSize: "0.92rem", color: "#ccfbf1", maxWidth: "560px", margin: "0 auto 1.5rem", lineHeight: "1.6" }}>
              Join hundreds of verified African scholarly journals. Real-time automated compliance screening with transparent bibliometric indicators.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <a 
                href="/submit" 
                style={{ 
                  background: "#0d9488", 
                  color: "#ffffff", 
                  fontWeight: 700, 
                  fontSize: "0.95rem",
                  padding: "0.75rem 1.75rem", 
                  borderRadius: "10px", 
                  textDecoration: "none", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }}
              >
                <span>Submit Journal Now</span>
                <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.85rem" }}></i>
              </a>
              <a 
                href="/faq" 
                style={{ 
                  background: "rgba(255, 255, 255, 0.12)", 
                  color: "#ffffff", 
                  fontWeight: 700, 
                  fontSize: "0.95rem",
                  padding: "0.75rem 1.75rem", 
                  borderRadius: "10px", 
                  border: "1px solid rgba(255, 255, 255, 0.35)", 
                  textDecoration: "none", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "8px"
                }}
              >
                <span>Read Evaluation FAQ</span>
                <i className="fa-solid fa-circle-question" style={{ fontSize: "0.85rem" }}></i>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
