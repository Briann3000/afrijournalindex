"use client";

import React from "react";
import { useLang } from "./LangContext";
import Header from "./Header";
import Footer from "./Footer";
import AfricaMap from "./AfricaMap";

export default function Home() {
  const { t } = useLang();

  const disciplinesMarquee = [
    { name: t.disciplines.health, icon: "fa-stethoscope", count: "380+ " + t.disciplines.journals_count },
    { name: t.disciplines.social, icon: "fa-book-open-reader", count: "420+ " + t.disciplines.journals_count },
    { name: t.disciplines.stem, icon: "fa-microchip", count: "290+ " + t.disciplines.journals_count },
    { name: t.disciplines.agri, icon: "fa-leaf", count: "240+ " + t.disciplines.journals_count },
    { name: t.disciplines.business, icon: "fa-chart-pie", count: "195+ " + t.disciplines.journals_count },
    { name: t.disciplines.education, icon: "fa-graduation-cap", count: "210+ " + t.disciplines.journals_count },
    { name: t.disciplines.law, icon: "fa-scale-balanced", count: "125+ " + t.disciplines.journals_count }
  ];

  const top5Universities = [
    { rank: 1, name: "University of Cape Town", country: "South Africa", publications: 1420, citations: 24800, hIndex: 58 },
    { rank: 2, name: "University of the Witwatersrand", country: "South Africa", publications: 1210, citations: 19650, hIndex: 52 },
    { rank: 3, name: "Cairo University", country: "Egypt", publications: 1180, citations: 17200, hIndex: 48 },
    { rank: 4, name: "University of Nairobi", country: "Kenya", publications: 960, citations: 13450, hIndex: 42 },
    { rank: 5, name: "Makerere University", country: "Uganda", publications: 890, citations: 12800, hIndex: 40 }
  ];

  return (
    <div className="page-wrapper">
      {/* 1. Solid High-Contrast Sticky Header */}
      <Header activePage="home" />

      <main>
        {/* 2. Authority Hero Section */}
        <section className="hero-section">
          <div className="container hero-container">
            <div className="hero-content">
              <div className="badge-featured">
                <i className="fa-solid fa-certificate"></i>
                {t.hero.pre_badge}
              </div>

              <h1 className="hero-title">
                {t.hero.title}
              </h1>

              <p className="hero-subtitle">
                {t.hero.subtitle}
              </p>

              {/* Hero Action CTA Group */}
              <div className="hero-cta-group" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <a href="/browse" className="btn btn-primary btn-lg">
                  <i className="fa-solid fa-compass"></i>
                  {t.hero.cta_explore || "Explore Directory"}
                </a>
                <a href="/submit" className="btn btn-secondary btn-lg">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  {t.hero.cta_submit}
                </a>
                <a href="/institution" className="btn btn-secondary btn-lg">
                  <i className="fa-solid fa-building-columns"></i>
                  {t.hero.cta_institution}
                </a>
              </div>
            </div>
            
            {/* Hero Visual: Prestige Academic Indexation & Bibliometric Card */}
            <div className="hero-visual">
              <div className="glass-card visual-card" style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "20px", padding: "1.75rem", boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.12)" }}>
                {/* Visual Header / Live Verification Pill */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.25)" }}></span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Verified Continental Index
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                    AJIF 2025/2026
                  </span>
                </div>

                {/* Journal Showcase Profile */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                    <span className="journal-tag" style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                      <i className="fa-solid fa-award" style={{ marginRight: "4px" }}></i> Q1 Quartile
                    </span>
                    <span className="journal-tag" style={{ fontSize: "0.72rem", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: "4px" }}></i> Open Access
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-navy)", margin: "0.3rem 0", lineHeight: "1.4" }}>
                    African Research Journal of Education and Social Sciences
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
                    ISSN: 2312-0134 • Kenya Projects Organization (KENPRO)
                  </p>
                </div>

                {/* Primary Metric Highlights in 3 Columns */}
                <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1rem", marginBottom: "1.2rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--color-primary)", lineHeight: 1.1 }}>0.842</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginTop: "4px" }}>AJIF Factor</div>
                    </div>
                    <div style={{ borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#16a34a", lineHeight: 1.1 }}>Grade A</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginTop: "4px" }}>Quality Tier</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0284c7", lineHeight: 1.1 }}>100%</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginTop: "4px" }}>CrossRef DOI</div>
                    </div>
                  </div>
                </div>

                {/* Bibliometric Verification List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem", color: "#334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Annual Citation Velocity:</span>
                    <strong style={{ color: "#16a34a" }}><i className="fa-solid fa-arrow-trend-up"></i> +38.4% YoY</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Peer-Reviewed Articles:</span>
                    <strong style={{ color: "var(--color-navy)" }}>420+ Papers</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#64748b" }}>Indexing Status:</span>
                    <strong style={{ color: "var(--color-primary)" }}>Active & Accredited</strong>
                  </div>
                </div>

                {/* Card Action Link */}
                <div style={{ marginTop: "1.2rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  <a 
                    href="/browse?q=ARJESS" 
                    className="hover-primary" 
                    style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <span>View Complete Bibliometric Report</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Continental Bibliometric Stats Counter Bar */}
        <section className="stats-section">
          <div className="container stats-grid">
            <div className="stat-card">
              <div className="stat-num">1,600+</div>
              <div className="stat-label">{t.stats.journals}</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">45,000+</div>
              <div className="stat-label">Citable Peer Articles</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">54</div>
              <div className="stat-label">{t.stats.countries_covered}</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">100%</div>
              <div className="stat-label">{t.stats.free_indexing}</div>
            </div>
          </div>
        </section>

        {/* 4. Infinite Horizontal Discipline Marquee Ticker */}
        <section style={{ background: "#ffffff", borderBottom: "1px solid var(--color-border)", padding: "10px 0" }}>
          <div className="feature-marquee-container">
            <div className="feature-marquee-track">
              {[...disciplinesMarquee, ...disciplinesMarquee].map((disc, idx) => (
                <div key={idx} className="feature-marquee-card">
                  <div className="feature-marquee-icon">
                    <i className={`fa-solid ${disc.icon}`}></i>
                  </div>
                  <div>
                    <h5 style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--color-navy)", margin: 0 }}>
                      {disc.name}
                    </h5>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700 }}>
                      {disc.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Interactive African Research Map Section */}
        <section style={{ padding: "4rem 0 2rem", background: "var(--color-bg-alt)" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-navy)" }}>
                {t.map_section.title}
              </h2>
              <p style={{ color: "var(--color-text-muted)", maxWidth: "680px", margin: "0.5rem auto 0" }}>
                {t.map_section.subtitle}
              </p>
            </div>

            <AfricaMap />
          </div>
        </section>

        {/* 6. Institutional Research Leaderboard Preview */}
        <section style={{ padding: "4.5rem 0", background: "#ffffff", borderTop: "1px solid var(--color-border)" }}>
          <div className="container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span className="journal-tag" style={{ marginBottom: "0.5rem" }}>{t.nav.institution}</span>
                <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--color-navy)", margin: "0.3rem 0" }}>
                  {t.top_institutions.title}
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                  {t.top_institutions.subtitle}
                </p>
              </div>
              <a href="/institution" className="btn btn-secondary btn-sm" style={{ padding: "0.65rem 1.25rem", borderRadius: "10px", flexShrink: 0 }}>
                {t.top_institutions.view_all} <i className="fa-solid fa-arrow-right" style={{ marginLeft: "5px" }}></i>
              </a>
            </div>

            <div className="table-responsive" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid var(--color-border)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-bg-alt)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--color-navy)", width: "80px" }}>{t.top_institutions.rank}</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--color-navy)" }}>{t.top_institutions.institution}</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--color-navy)" }}>{t.top_institutions.country}</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--color-navy)", textAlign: "center" }}>{t.top_institutions.publications}</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--color-navy)", textAlign: "center" }}>{t.top_institutions.citations}</th>
                    <th style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--color-navy)", textAlign: "center" }}>{t.top_institutions.h_index}</th>
                  </tr>
                </thead>
                <tbody>
                  {top5Universities.map((univ) => (
                    <tr key={univ.rank} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }} className="hover-row">
                      <td style={{ padding: "1rem 1.25rem", fontWeight: 800, color: univ.rank <= 3 ? "var(--color-primary)" : "var(--color-navy)" }}>
                        #{univ.rank}
                      </td>
                      <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--color-navy)" }}>
                        <a href={`/institution?name=${encodeURIComponent(univ.name)}`} style={{ color: "var(--color-navy)" }} className="hover-primary">
                          {univ.name}
                        </a>
                      </td>
                      <td style={{ padding: "1rem 1.25rem", color: "var(--color-text-muted)" }}>
                        <i className="fa-solid fa-location-dot" style={{ marginRight: "6px", color: "var(--color-primary)" }}></i>
                        {univ.country}
                      </td>
                      <td style={{ padding: "1rem 1.25rem", textAlign: "center", fontWeight: 600 }}>
                        {univ.publications.toLocaleString()}
                      </td>
                      <td style={{ padding: "1rem 1.25rem", textAlign: "center", fontWeight: 700, color: "var(--color-primary)" }}>
                        {univ.citations.toLocaleString()}
                      </td>
                      <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                        <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "0.25rem 0.65rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem" }}>
                          h-{univ.hIndex}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 7. Verified KENPRO Seed Showcase */}
        <section style={{ padding: "4.5rem 0", background: "var(--color-bg-alt)" }}>
          <div className="container">
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span className="journal-tag">{t.showcase.badge_verified}</span>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-navy)", marginTop: "0.5rem" }}>
                {t.showcase.title}
              </h2>
              <p style={{ color: "var(--color-text-muted)", maxWidth: "620px", margin: "0.5rem auto 0" }}>
                {t.showcase.desc}
              </p>
            </div>

            <div className="journals-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {/* Journal Card 1: ARJESS */}
              <div className="glass-card" style={{ padding: "1.75rem", background: "#ffffff", borderRadius: "16px", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <span className="journal-tag">Q1 Quartile</span>
                  <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>
                    {t.showcase.badge_verified}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  African Research Journal of Education and Social Sciences (ARJESS)
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.2rem", lineHeight: "1.5" }}>
                  Peer-reviewed scholarly forum publishing original empirical research across pedagogy, sociology, humanities, and African social development.
                </p>
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>ISSN: 2312-0134</span>
                  <a href="/browse" className="btn btn-primary btn-sm">{t.showcase.view_journal}</a>
                </div>
              </div>

              {/* Journal Card 2: JMBA */}
              <div className="glass-card" style={{ padding: "1.75rem", background: "#ffffff", borderRadius: "16px", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <span className="journal-tag">Q2 Quartile</span>
                  <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>
                    {t.showcase.badge_verified}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  Journal of Management and Business Administration (JMBA)
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.2rem", lineHeight: "1.5" }}>
                  Dedicated to African business innovations, microfinance systems, public sector leadership, and commercial economics.
                </p>
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>ISSN: 2520-4106</span>
                  <a href="/browse" className="btn btn-primary btn-sm">{t.showcase.view_journal}</a>
                </div>
              </div>

              {/* Journal Card 3: IJEHS */}
              <div className="glass-card" style={{ padding: "1.75rem", background: "#ffffff", borderRadius: "16px", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <span className="journal-tag">Q1 Quartile</span>
                  <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>
                    {t.showcase.badge_verified}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  International Journal of Environmental and Health Sciences (IJEHS)
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.2rem", lineHeight: "1.5" }}>
                  Focusing on tropical epidemiology, climate resilience in sub-Saharan Africa, sanitation policy, and community health.
                </p>
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>ISSN: 2617-6432</span>
                  <a href="/browse" className="btn btn-primary btn-sm">{t.showcase.view_journal}</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Final High-Conversion CTA Banner */}
        <section className="cta-section">
          <div className="container cta-container">
            <h2 className="cta-title">
              {t.cta.title}
            </h2>
            <p className="cta-text">
              {t.cta.desc}
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/submit" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-circle-check"></i> {t.cta.btn}
              </a>
              <a href="/submit/status" className="btn btn-secondary btn-lg" style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.35)" }}>
                <i className="fa-solid fa-magnifying-glass"></i> {t.cta.btn_status}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
