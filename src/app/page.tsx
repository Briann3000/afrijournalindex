"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./LangContext";
import Header from "./Header";
import Footer from "./Footer";
import AfricaMap from "./AfricaMap";

export default function Home() {
  const { lang, t } = useLang();
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/browse?q=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      router.push("/browse");
    }
  };

  const disciplinesMarquee = [
    { name: "Health Sciences & Medicine", icon: "fa-stethoscope", journals: "95+ Journals" },
    { name: "Social Sciences & Humanities", icon: "fa-book-open-reader", journals: "110+ Journals" },
    { name: "STEM & Engineering", icon: "fa-microchip", journals: "65+ Journals" },
    { name: "Agricultural & Environmental", icon: "fa-leaf", journals: "58+ Journals" },
    { name: "Business, Economics & Finance", icon: "fa-chart-pie", journals: "42+ Journals" },
    { name: "Education & Pedagogy", icon: "fa-graduation-cap", journals: "70+ Journals" },
    { name: "Law, Governance & Public Policy", icon: "fa-scale-balanced", journals: "35+ Journals" }
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
                Pan-African Scholarly Index & Bibliometric Authority
              </div>

              <h1 className="hero-title">
                Elevating African Academic <span style={{ color: "var(--color-primary)" }}>Excellence</span> Through Verified Indexation
              </h1>

              <p className="hero-subtitle">
                An open, transparent indexing directory and citation metrics engine designed to value African scientific research, eliminate predatory barriers, and calculate verified regional impact factors.
              </p>

              {/* Instant Hero Search Bar */}
              <form onSubmit={handleSearchSubmit} style={{ width: "100%", maxWidth: "540px", marginBottom: "1.8rem" }}>
                <div style={{ position: "relative", display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search 300+ indexed journals, universities or DOIs..."
                    style={{
                      width: "100%",
                      padding: "0.85rem 1rem 0.85rem 2.6rem",
                      background: "#ffffff",
                      border: "2px solid #cbd5e1",
                      borderRadius: "12px",
                      fontSize: "0.95rem",
                      color: "var(--color-navy)",
                      outline: "none",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)"
                    }}
                  />
                  <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "1rem", top: "1.1rem", color: "#64748b" }}></i>
                  <button type="submit" className="btn btn-primary" style={{ padding: "0 1.5rem", borderRadius: "12px", flexShrink: 0 }}>
                    Search Index
                  </button>
                </div>
              </form>

              {/* Hero CTA Group */}
              <div className="hero-cta-group">
                <a href="/submit" className="btn btn-primary btn-lg">
                  <i className="fa-solid fa-plus-circle"></i>
                  Index Your Journal (Free)
                </a>
                <a href="/institution" className="btn btn-secondary btn-lg">
                  <i className="fa-solid fa-ranking-star"></i>
                  University League Table
                </a>
              </div>
            </div>
            
            {/* Hero Visual: Realistic Live Journal Impact Card */}
            <div className="hero-visual">
              <div className="glass-card visual-card">
                <div className="visual-header">
                  <span className="dot" style={{ background: "#ef4444" }}></span>
                  <span className="dot" style={{ background: "#f59e0b" }}></span>
                  <span className="dot" style={{ background: "#10b981" }}></span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "auto", fontWeight: 600 }}>
                    Official Journal Benchmark
                  </span>
                </div>

                <div className="visual-body">
                  <div style={{ marginBottom: "1rem" }}>
                    <span className="journal-tag" style={{ marginBottom: "0.4rem" }}>
                      Q1 Category Quartile
                    </span>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-navy)", margin: "0.2rem 0" }}>
                      African Research Journal of Education and Social Sciences
                    </h3>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      ISSN: 2312-0134 • Kenya Projects Organization
                    </span>
                  </div>

                  <div className="metric-highlight">
                    <span className="metric-label">Verified Bibliometric Metrics</span>
                    <div className="metric-row">
                      <div className="metric-item">
                        <div className="metric-value">0.842</div>
                        <div className="metric-name">Standard AJIF IF</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value" style={{ color: "#16a34a" }}>Grade A</div>
                        <div className="metric-name">Quality Audit Seal</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value" style={{ color: "#0284c7" }}>#1</div>
                        <div className="metric-name">Education Rank</div>
                      </div>
                    </div>
                  </div>

                  {/* 2-Year Citation Velocity Trend */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                      2-Year Citation Window Velocity
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700 }}>
                      +38.4% YoY
                    </span>
                  </div>

                  <div className="chart-mock">
                    <div className="bar-chart">
                      <div className="bar" style={{ height: "35%" }} title="2023: 140 Citations"></div>
                      <div className="bar" style={{ height: "55%" }} title="2024: 220 Citations"></div>
                      <div className="bar" style={{ height: "78%" }} title="2025: 310 Citations"></div>
                      <div className="bar active" style={{ height: "95%" }} title="2026: 420 Citations"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Connected 3-Step Process Track (KDAnalytiks Inspired) */}
          <div className="container">
            <div className="step-track-light">
              <div className="step-node-light">
                <div className="node-icon">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.4rem" }}>
                  1. Auto-Harvest from OJS
                </h4>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: 0 }}>
                  Editors paste their OAI-PMH endpoint to auto-sync volumes, DOIs, and author records with zero manual entry.
                </p>
              </div>

              <div className="step-node-light">
                <div className="node-icon">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.4rem" }}>
                  2. 6-Point Integrity Audit
                </h4>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: 0 }}>
                  Automated checks verify ISSN registry, CC-BY open-access policy, and enforce a &lt;20% self-citation firewall.
                </p>
              </div>

              <div className="step-node-light">
                <div className="node-icon">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.4rem" }}>
                  3. Calibrated AJIF & Quartiles
                </h4>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: 0 }}>
                  Receive formal impact score reports, Q1–Q4 ranking quartiles, and single-page official academic certificates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Continental Bibliometric Stats Counter Bar */}
        <section className="stats-section">
          <div className="container stats-grid">
            <div className="stat-card">
              <div className="stat-num">300+</div>
              <div className="stat-label">Cataloged African Journals</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">100%</div>
              <div className="stat-label">Free Open-Access Indexing</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">20+</div>
              <div className="stat-label">African Nations Represented</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">Q1–Q4</div>
              <div className="stat-label">Calibrated Quartiles</div>
            </div>
          </div>
        </section>

        {/* 5. Infinite Horizontal Discipline Marquee Ticker */}
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
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {disc.journals}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Interactive African Continental Journal Distribution Map */}
        <section style={{ padding: "5rem 0" }}>
          <div className="container">
            <AfricaMap />
          </div>
        </section>

        {/* 7. Four Strategic Core Pillars Grid */}
        <section className="valprop-section" style={{ background: "var(--color-bg-card-subtle)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
          <div className="container">
            <div className="section-header">
              <span className="badge-featured">Strategic Innovation</span>
              <h2 className="section-title">Built for the African Academic Enterprise</h2>
              <p className="section-desc">
                AfriJournal Index overcomes the visibility and structural barriers African scholarly journals face, establishing a trusted continental citation standard.
              </p>
            </div>

            <div className="valprop-grid">
              <div className="glass-card valprop-card">
                <div className="card-icon"><i className="fa-solid fa-cloud-arrow-down"></i></div>
                <h3 className="card-title">1-Click OJS Auto-Harvester</h3>
                <p className="card-text">
                  Direct OAI-PMH interoperability pulls past volumes, article DOIs, abstracts, and author affiliations automatically without tedious manual data entry.
                </p>
              </div>

              <div className="glass-card valprop-card">
                <div className="card-icon"><i className="fa-solid fa-scale-balanced"></i></div>
                <h3 className="card-title">Calibrated Q1–Q4 Quartiles</h3>
                <p className="card-text">
                  Strict thresholding eliminates the &quot;Sea of Zeros&quot; distortion, ensuring subject quartiles reflect genuine citation velocity and academic impact.
                </p>
              </div>

              <div className="glass-card valprop-card">
                <div className="card-icon"><i className="fa-solid fa-shield-halved"></i></div>
                <h3 className="card-title">Anti-Predatory Audit Seal</h3>
                <p className="card-text">
                  Automated 6-point verification protocols screen ISSN authenticity, editorial faculty credibility, and cap self-citations strictly below 20%.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Top 5 African Universities League Table Teaser */}
        <section style={{ padding: "5rem 0" }}>
          <div className="container">
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "1.8rem" }}>
                <div>
                  <span className="badge-featured" style={{ marginBottom: "0.5rem" }}>
                    <i className="fa-solid fa-building-columns"></i> Institutional Benchmarking
                  </span>
                  <h2 style={{ fontSize: "1.85rem", fontWeight: 900, color: "var(--color-navy)", margin: 0 }}>
                    Top African Universities League Table
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", margin: "0.2rem 0 0" }}>
                    Continental rankings aggregated by cataloged research output, CrossRef citation volume, and institutional $h$-index.
                  </p>
                </div>

                <a href="/institution" className="btn btn-primary btn-sm">
                  View Full 30+ Leaderboard <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.75rem", marginLeft: "0.3rem" }}></i>
                </a>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-card-subtle)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                      <th style={{ padding: "1rem 1.2rem", width: "70px", textAlign: "center" }}>Rank</th>
                      <th style={{ padding: "1rem 1.2rem" }}>Institution & Country</th>
                      <th style={{ padding: "1rem 1rem", textAlign: "right" }}>Publications</th>
                      <th style={{ padding: "1rem 1rem", textAlign: "right" }}>Citations</th>
                      <th style={{ padding: "1rem 1.2rem", textAlign: "center" }}>Inst. h-Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5Universities.map((univ) => (
                      <tr key={univ.name} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "1rem 1.2rem", textAlign: "center" }}>
                          <span style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            width: "30px", 
                            height: "30px", 
                            borderRadius: "50%", 
                            background: univ.rank === 1 ? "#eff6ff" : "var(--color-bg-card-subtle)", 
                            color: univ.rank === 1 ? "var(--color-primary)" : "var(--color-navy)", 
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            border: univ.rank === 1 ? "1px solid var(--color-primary)" : "none"
                          }}>
                            {univ.rank}
                          </span>
                        </td>
                        <td style={{ padding: "1rem 1.2rem" }}>
                          <a href={`/institution?name=${encodeURIComponent(univ.name)}`} style={{ fontWeight: 700, color: "var(--color-navy)", textDecoration: "none" }}>
                            {univ.name}
                          </a>
                          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                            <i className="fa-solid fa-location-dot" style={{ color: "var(--color-primary)", marginRight: "0.3rem" }}></i>
                            {univ.country}
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1rem", textAlign: "right", fontWeight: 600, color: "var(--color-navy)" }}>
                          {univ.publications.toLocaleString()}
                        </td>
                        <td style={{ padding: "1rem 1rem", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                          {univ.citations.toLocaleString()}
                        </td>
                        <td style={{ padding: "1rem 1.2rem", textAlign: "center" }}>
                          <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", background: "rgba(2, 132, 199, 0.1)", color: "#0284c7", fontWeight: 800, fontSize: "0.82rem" }}>
                            {univ.hIndex}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Featured African Research Journals Showcase */}
        <section className="journals-showcase-section">
          <div className="container">
            <div className="section-header">
              <span className="badge-featured">Peer-Reviewed Directory</span>
              <h2 className="section-title">Featured Indexed Journals</h2>
              <p className="section-desc">
                Explore actively cataloged academic journals with verified DOI records, impact factors, and single-page academic certificates.
              </p>
            </div>

            <div className="journals-grid">
              {/* Journal 1 */}
              <div className="journal-card">
                <div className="journal-meta">
                  <span className="journal-tag">Education</span>
                  <span className="journal-tag">Social Sciences</span>
                </div>
                <h3 className="journal-name">
                  <a href="/journal/arjess" style={{ color: "inherit", textDecoration: "none" }}>
                    African Research Journal of Education and Social Sciences (ARJESS)
                  </a>
                </h3>
                <div className="journal-details">
                  <p><strong>ISSN:</strong> 2312-0134</p>
                  <p><strong>Publisher:</strong> Kenya Projects Organization</p>
                  <p><strong>Frequency:</strong> Quarterly</p>
                </div>
                <div className="journal-footer">
                  <a href="/journal/arjess" className="journal-link">
                    View Impact Profile <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.75rem" }}></i>
                  </a>
                  <span className="journal-badge badge-indexed"><i className="fa-solid fa-check-double"></i> Verified Q1</span>
                </div>
              </div>

              {/* Journal 2 */}
              <div className="journal-card">
                <div className="journal-meta">
                  <span className="journal-tag">Management</span>
                  <span className="journal-tag">Business</span>
                </div>
                <h3 className="journal-name">
                  <a href="/journal/jmba" style={{ color: "inherit", textDecoration: "none" }}>
                    Journal of Management and Business Administration (JMBA)
                  </a>
                </h3>
                <div className="journal-details">
                  <p><strong>ISSN:</strong> 2519-0016</p>
                  <p><strong>Publisher:</strong> Kenya Projects Organization</p>
                  <p><strong>Frequency:</strong> Quarterly</p>
                </div>
                <div className="journal-footer">
                  <a href="/journal/jmba" className="journal-link">
                    View Impact Profile <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.75rem" }}></i>
                  </a>
                  <span className="journal-badge badge-indexed"><i className="fa-solid fa-check-double"></i> Verified Q2</span>
                </div>
              </div>

              {/* Journal 3 */}
              <div className="journal-card">
                <div className="journal-meta">
                  <span className="journal-tag">Environment</span>
                  <span className="journal-tag">Health Sciences</span>
                </div>
                <h3 className="journal-name">
                  <a href="/journal/ijehs" style={{ color: "inherit", textDecoration: "none" }}>
                    International Journal of Environmental and Health Sciences (IJEHS)
                  </a>
                </h3>
                <div className="journal-details">
                  <p><strong>ISSN:</strong> Pending</p>
                  <p><strong>Publisher:</strong> Kenya Projects Organization</p>
                  <p><strong>Frequency:</strong> Semi-Annually</p>
                </div>
                <div className="journal-footer">
                  <a href="/journal/ijehs" className="journal-link">
                    View Impact Profile <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.75rem" }}></i>
                  </a>
                  <span className="journal-badge badge-indexed"><i className="fa-solid fa-check-double"></i> Verified Q2</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <a href="/browse" className="btn btn-secondary btn-lg">
                Explore Full 300+ Journal Directory <i className="fa-solid fa-arrow-right" style={{ marginLeft: "0.4rem" }}></i>
              </a>
            </div>
          </div>
        </section>

        {/* 10. Call to Action Banner */}
        <section className="cta-section">
          <div className="container cta-container">
            <h2 className="cta-title">Ready to Elevate Your Academic Journal?</h2>
            <p className="cta-text">
              Submit your peer-reviewed publication to our automated review harvester. Establish international visibility, verify compliance, and receive calculated impact factor reports.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/submit" className="btn btn-primary btn-lg">
                <i className="fa-solid fa-bolt"></i> Start Free OJS Auto-Import
              </a>
              <a href="/about" className="btn btn-secondary btn-lg" style={{ background: "#ffffff", color: "var(--color-navy)", borderColor: "var(--color-border)" }}>
                Learn About AJIF Methodology
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* 11. Midnight Navy Footer */}
      <Footer />
    </div>
  );
}
