"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./LangContext";
import Header from "./Header";
import Footer from "./Footer";
import AfricaMap from "./AfricaMap";

interface ShowcaseJournal {
  id: string;
  name: string;
  issn: string;
  country: string;
  description: string;
  qualityGrade: string;
  score: number;
  ycaScore: number;
  regionalScore: number;
  citationCount: number;
  articleCount: number;
  quartile: string;
  primaryDiscipline: string;
  disciplineRank: number;
  totalInDiscipline: number;
}

export default function Home() {
  const { t } = useLang();
  const router = useRouter();
  const [heroJournal, setHeroJournal] = useState<ShowcaseJournal | null>(null);
  const [showcaseJournals, setShowcaseJournals] = useState<ShowcaseJournal[]>([]);
  const [heroSearchQuery, setHeroSearchQuery] = useState<string>("");
  const [heroSearchType, setHeroSearchType] = useState<"all" | "articles" | "journals" | "scholars">("all");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      const typePart = heroSearchType !== "all" ? `&type=${heroSearchType}` : "";
      router.push(`/search?q=${encodeURIComponent(heroSearchQuery.trim())}${typePart}`);
    } else {
      if (heroSearchType === "journals") router.push("/browse");
      else if (heroSearchType === "scholars") router.push("/scholars");
      else router.push("/search");
    }
  };

  useEffect(() => {
    async function loadShowcase() {
      try {
        const res = await fetch("/api/journals/showcase", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          if (data.heroJournal) setHeroJournal(data.heroJournal);
          if (data.showcaseJournals) setShowcaseJournals(data.showcaseJournals);
        }
      } catch (err) {
        console.error("Failed to load showcase journals:", err);
      }
    }
    loadShowcase();
  }, []);

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
                Elevating African Academic Excellence Through Unbiased Indexation
              </h1>

              <p className="hero-subtitle">
                {t.hero.subtitle}
              </p>

              {/* Direct Prominent Hero Quick Search with Entity Filter Tabs */}
              <div style={{ maxWidth: "640px", width: "100%", marginBottom: "1.5rem" }}>
                {/* Search Entity Filter Tabs */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setHeroSearchType("all")}
                    style={{
                      background: heroSearchType === "all" ? "var(--color-primary)" : "rgba(15, 23, 42, 0.05)",
                      color: heroSearchType === "all" ? "#ffffff" : "var(--color-text-main)",
                      border: heroSearchType === "all" ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      padding: "0.3rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "0.78rem" }}></i>
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroSearchType("articles")}
                    style={{
                      background: heroSearchType === "articles" ? "var(--color-primary)" : "rgba(15, 23, 42, 0.05)",
                      color: heroSearchType === "articles" ? "#ffffff" : "var(--color-text-main)",
                      border: heroSearchType === "articles" ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      padding: "0.3rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <i className="fa-solid fa-file-lines" style={{ fontSize: "0.78rem" }}></i>
                    Articles (33,600+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroSearchType("journals")}
                    style={{
                      background: heroSearchType === "journals" ? "var(--color-primary)" : "rgba(15, 23, 42, 0.05)",
                      color: heroSearchType === "journals" ? "#ffffff" : "var(--color-text-main)",
                      border: heroSearchType === "journals" ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      padding: "0.3rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <i className="fa-solid fa-book-journal-whills" style={{ fontSize: "0.78rem" }}></i>
                    Journals (1,740+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroSearchType("scholars")}
                    style={{
                      background: heroSearchType === "scholars" ? "var(--color-primary)" : "rgba(15, 23, 42, 0.05)",
                      color: heroSearchType === "scholars" ? "#ffffff" : "var(--color-text-main)",
                      border: heroSearchType === "scholars" ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      padding: "0.3rem 0.85rem",
                      borderRadius: "20px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <i className="fa-solid fa-user-graduate" style={{ fontSize: "0.78rem" }}></i>
                    Scholars (2,300+)
                  </button>
                </div>

                <form 
                  onSubmit={handleHeroSearch}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "var(--color-bg-card)",
                    border: "2px solid rgba(212, 160, 74, 0.4)",
                    borderRadius: "14px",
                    padding: "5px 6px 5px 14px",
                    boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
                    width: "100%",
                    transition: "border-color 0.2s ease"
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--color-primary)", marginRight: "10px", fontSize: "0.95rem" }}></i>
                  <input
                    type="text"
                    placeholder={
                      heroSearchType === "articles" 
                        ? "Search 33,600+ peer-reviewed articles (e.g. generation diversity management, climate, public health)..."
                        : heroSearchType === "journals"
                        ? "Search 1,740+ African journals by title, publisher, or ISSN..."
                        : heroSearchType === "scholars"
                        ? "Search 2,300+ verified African researchers by name, institution, or ORCID..."
                        : "Search 33,600+ articles, 1,740+ journals, and verified African scholars..."
                    }
                    value={heroSearchQuery}
                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "var(--color-text-body)",
                      width: "100%",
                      fontSize: "0.92rem"
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      padding: "0.45rem 1rem",
                      borderRadius: "10px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      whiteSpace: "nowrap"
                    }}
                  >
                    Search
                  </button>
                </form>
              </div>

              {/* Hero Action CTA Group: 2 High-Priority Action Buttons */}
              <div className="hero-cta-group" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <a href="/browse" className="btn btn-primary btn-lg">
                  <i className="fa-solid fa-compass"></i>
                  {t.hero.cta_explore || "Explore Directory"}
                </a>
                <a href="/submit" className="btn btn-secondary btn-lg">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  {t.hero.cta_submit}
                </a>
              </div>
            </div>
            
            {/* Hero Visual: Prestige Academic Indexation & Bibliometric Card with Ambient Backdrop */}
            <div className="hero-visual" style={{ position: "relative" }}>
              {/* Subtle ambient scholarly glow backdrop to prevent the 'naked' card look */}
              <div 
                style={{
                  position: "absolute",
                  inset: "-15px",
                  background: "radial-gradient(circle at 50% 50%, rgba(212, 160, 74, 0.15), rgba(15, 23, 42, 0.02) 70%)",
                  borderRadius: "28px",
                  filter: "blur(18px)",
                  zIndex: 0,
                  pointerEvents: "none"
                }}
              />
              <div className="glass-card visual-card" style={{ position: "relative", zIndex: 1, background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "20px", padding: "1.75rem", boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(212, 160, 74, 0.15)" }}>
                {/* Visual Header / Live Verification Pill */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.25)" }}></span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Verified Continental Index
                    </span>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    AJCI 2025/2026
                  </span>
                </div>

                {/* Journal Showcase Profile */}
                {heroJournal ? (
                  <>
                    <div style={{ marginBottom: "1.25rem" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                        <span className="journal-tag" style={{ fontSize: "0.72rem", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                          <i className="fa-solid fa-award" style={{ marginRight: "4px" }}></i> {heroJournal.quartile} Quartile
                        </span>
                        <span className="journal-tag" style={{ fontSize: "0.72rem", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                          <i className="fa-solid fa-circle-check" style={{ marginRight: "4px" }}></i> Open Access
                        </span>
                      </div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-navy)", margin: "0.3rem 0", lineHeight: "1.4" }}>
                        {heroJournal.name}
                      </h3>
                      <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
                        ISSN: {heroJournal.issn} • {heroJournal.country} • Verified Open Access
                      </p>
                    </div>

                    {/* Primary Metric Highlights in 3 Columns */}
                    <div style={{ background: "var(--color-bg-card-subtle)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1rem", marginBottom: "1.2rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", textAlign: "center" }}>
                        <div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--color-primary)", lineHeight: 1.1 }}>{heroJournal.score.toFixed(3)}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 700, marginTop: "4px" }}>2-Yr AJCI</div>
                        </div>
                        <div style={{ borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#0284c7", lineHeight: 1.1 }}>{heroJournal.ycaScore.toFixed(3)}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 700, marginTop: "4px" }}>3-Yr Citation Avg</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#16a34a", lineHeight: 1.1 }}>Grade {heroJournal.qualityGrade}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 700, marginTop: "4px" }}>{heroJournal.quartile} Quartile</div>
                        </div>
                      </div>
                    </div>

                    {/* Bibliometric Verification List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem", color: "var(--color-text-body)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>Lifetime Impact (Indexed):</span>
                        <strong style={{ color: "var(--color-navy)" }}><i className="fa-solid fa-chart-line" style={{ color: "#2563eb", marginRight: "4px" }}></i> {heroJournal.citationCount.toLocaleString()} Citations</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>Evaluated Citable Articles:</span>
                        <strong style={{ color: "var(--color-navy)" }}>{heroJournal.articleCount} Catalog Papers</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>Data Provenance:</span>
                        <strong style={{ color: "#16a34a" }}><i className="fa-solid fa-circle-check" style={{ marginRight: "4px" }}></i> Crossref & DOAJ Verified</strong>
                      </div>
                    </div>

                    {/* Card Action Link */}
                    <div style={{ marginTop: "1.2rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                      <a 
                        href={`/journal/${heroJournal.id}`} 
                        className="hover-primary" 
                        style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      >
                        <span>View Complete Bibliometric Report & Certificate</span>
                        <i className="fa-solid fa-arrow-right"></i>
                      </a>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.5rem" }}></i> Loading verified journal showcase...
                  </div>
                )}
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
        <section style={{ background: "var(--color-bg-card)", borderBottom: "1px solid var(--color-border)", padding: "10px 0" }}>
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
        <section style={{ padding: "4.5rem 0", background: "var(--color-bg-card)", borderTop: "1px solid var(--color-border)" }}>
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

            <div className="table-responsive" style={{ background: "var(--color-bg-card)", borderRadius: "14px", border: "1px solid var(--color-border)", overflowX: "auto" }}>
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

        {/* 7. Verified Seed Directory Showcase */}
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
              {showcaseJournals.length > 0 ? (
                showcaseJournals.map((journal) => (
                  <div key={journal.id} className="glass-card" style={{ padding: "1.75rem", background: "var(--color-bg-card)", borderRadius: "16px", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <span className="journal-tag" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                          {journal.quartile} Quartile
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700, background: "#dcfce7", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>
                          AJCI {journal.score.toFixed(3)}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", marginBottom: "0.5rem", lineHeight: "1.4" }}>
                        {journal.name}
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.2rem", lineHeight: "1.5" }}>
                        {journal.description}
                      </p>
                    </div>
                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        ISSN: {journal.issn} • {journal.country}
                      </span>
                      <a href={`/journal/${journal.id}`} className="btn btn-primary btn-sm">
                        {t.showcase.view_journal}
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: "3rem", textAlign: "center", gridColumn: "1 / -1", color: "var(--color-text-muted)" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.5rem" }}></i> Loading verified continental journals...
                </div>
              )}
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
              <a href="/contact" className="btn btn-secondary btn-lg" style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.35)" }}>
                <i className="fa-solid fa-headset" style={{ marginRight: "0.3rem" }}></i> {t.footer?.contact || "Contact Editorial Team"}
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Floating WhatsApp Contact Button (Bottom Right) */}
      <a
        href="https://wa.me/254725788400?text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20AfriJournal%20Indexing%20services."
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with AfriJournal Editorial Team on WhatsApp (0725788400)"
        aria-label="Contact us on WhatsApp"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          backgroundColor: "#25D366",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(37, 211, 102, 0.4)",
          zIndex: 9999,
          cursor: "pointer",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          fontSize: "1.9rem"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 12px 30px rgba(37, 211, 102, 0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 211, 102, 0.4)";
        }}
      >
        <i className="fa-brands fa-whatsapp"></i>
      </a>

      <Footer />
    </div>
  );
}
