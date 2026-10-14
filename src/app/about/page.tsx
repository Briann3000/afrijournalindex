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
          <h1 className="page-title">{t.nav.about || "About AfriJournal Index"}</h1>
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
