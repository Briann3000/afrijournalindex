"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "../LangContext";

function InstitutionContent() {
  const { lang, setLang, t } = useLang();
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "University of Nairobi";

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    async function fetchInstitutionMetrics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/institutions/metrics?name=${encodeURIComponent(name)}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load institutional metrics.");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to metrics services.");
      } finally {
        setLoading(false);
      }
    }
    fetchInstitutionMetrics();
  }, [name]);

  if (loading) {
    return (
      <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
          <p>Compiling institutional research rankings...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div className="glass-card" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "3rem", color: "var(--color-secondary)", marginBottom: "1.5rem" }}></i>
          <h3>Institution Not Found</h3>
          <p style={{ margin: "1rem 0", color: "var(--color-text-muted)" }}>{error || "Institution record not found."}</p>
          <a href="/browse" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>Back to Catalog</a>
        </div>
      </div>
    );
  }

  const { institution, metrics, journals } = data;

  return (
    <div className="theme-dark">
      {/* Navigation */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo">
            <span className="logo-accent">Afri</span>Journal Index
          </a>
          <nav className={`nav-menu ${isMenuOpen ? "active" : ""}`} id="navMenu">
            <a href="/" className="nav-link">{t.nav.home}</a>
            <a href="/browse" className="nav-link">{t.nav.browse}</a>
            <a href="/submit" className="nav-link">{t.nav.submit}</a>
            <a href="/pricing" className="nav-link">{t.nav.pricing}</a>
            <a href="/about" className="nav-link">{t.nav.about}</a>
          </nav>
          <div className="header-actions">
            <button className="menu-toggle" id="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: "4rem 0", maxWidth: "950px" }}>
        {/* Banner header card */}
        <div className="glass-card" style={{ padding: "3rem", marginBottom: "2.5rem", borderLeft: "5px solid var(--color-primary)" }}>
          <span className="journal-tag" style={{ background: "rgba(212,160,74,0.15)", color: "var(--color-primary)", marginBottom: "0.5rem", display: "inline-block" }}>
            Institutional Research Console
          </span>
          <h1 style={{ fontSize: "2.4rem", margin: "0.5rem 0" }}>{institution}</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1.05rem" }}>
            Aggregated real-time metrics across all affiliated research articles and journals indexed in AfriJournal Index.
          </p>
        </div>

        {/* Aggregated totals metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3.5rem" }}>
          <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Total Publications</span>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#fff", marginTop: "0.5rem" }}>
              {metrics.totalPublications}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem", display: "block" }}>Affiliated Authored Papers</span>
          </div>

          <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Aggregated Citations</span>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--color-primary)", marginTop: "0.5rem" }}>
              {metrics.totalCitations}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem", display: "block" }}>Citations received in index</span>
          </div>

          <div className="glass-card" style={{ padding: "2rem", textAlign: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Average Citations Rate</span>
            <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--color-secondary)", marginTop: "0.5rem" }}>
              {metrics.averageCitations}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem", display: "block" }}>Citations per publication</span>
          </div>
        </div>

        {/* Affiliated Journals List */}
        <h3 style={{ marginBottom: "1.5rem" }}>Affiliated Journals Share List</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {journals.length === 0 ? (
            <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              No indexed journals have recorded publications matching this institution.
            </div>
          ) : (
            journals.map((journal: any, idx: number) => (
              <div className="glass-card" key={idx} style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "1.2rem", margin: "0 0 0.5rem" }}>{journal.name}</h4>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <span>Quality Grade: <strong>{journal.qualityGrade}</strong></span>
                    <span>|</span>
                    <span>AJIF Score: <strong style={{ color: "var(--color-primary)" }}>{journal.ajifScore.toFixed(3)}</strong></span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", textAlign: "center" }}>
                  <div style={{ padding: "0.8rem 1.2rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Papers</span>
                    <span style={{ fontSize: "1.3rem", fontWeight: "bold" }}>{journal.articlesCount}</span>
                  </div>
                  <div style={{ padding: "0.8rem 1.2rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Citations</span>
                    <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--color-primary)" }}>{journal.citationsCount}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default function Institution() {
  return (
    <Suspense fallback={<div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading institutional metrics...</div>}>
      <InstitutionContent />
    </Suspense>
  );
}
