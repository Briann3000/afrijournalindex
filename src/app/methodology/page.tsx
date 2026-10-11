"use client";

import React from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function Methodology() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Header */}
      <Header />

      <main className="container reading-container" style={{ padding: "3.5rem 0 6rem" }}>
        <div className="page-header" style={{ marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-square-root-variable"></i>
            Bibliometric Standards
          </span>
          <h1 className="page-title">{t.footer.methodology}</h1>
          <p className="page-subtitle">{t.methodology_page.desc}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card-surface" style={{ padding: "2.5rem" }}>
            <h3 style={{ color: "var(--color-primary)", marginBottom: "1rem", fontSize: "1.3rem", fontWeight: 700 }}>
              {t.methodology_page.formula_title}
            </h3>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "1.5rem", fontSize: "0.98rem" }}>
              {t.methodology_page.formula_desc}
            </p>
            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "1.75rem", borderRadius: "10px", margin: "1.2rem 0", display: "flex", justifyContent: "center", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-primary)" }}>AJCI (2-Year Standard) =</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <span style={{ borderBottom: "2px solid var(--color-text-main)", paddingBottom: "6px", fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main)" }}>
                  {t.methodology_page.formula_num}
                </span>
                <span style={{ paddingTop: "6px", fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-body)" }}>
                  {t.methodology_page.formula_den}
                </span>
              </div>
            </div>

            {/* 3-Year Citation Average (3-YCA) */}
            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "1.75rem", borderRadius: "10px", margin: "1.2rem 0", display: "flex", justifyContent: "center", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563eb" }}>3-Year Citation Average (3-YCA) =</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <span style={{ borderBottom: "2px solid var(--color-text-main)", paddingBottom: "6px", fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-main)" }}>
                  Citations in 2025 to articles published in 2022, 2023, and 2024
                </span>
                <span style={{ paddingTop: "6px", fontSize: "0.95rem", fontWeight: 600, color: "var(--color-text-body)" }}>
                  Total citable articles published in 2022, 2023, and 2024
                </span>
              </div>
            </div>

            <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", marginTop: "1rem", lineHeight: "1.6" }}>
              To prevent artificial underscoring of journals with bi-annual or quarterly cadences, AfriJournal Index computes both the internationally aligned <strong>2-Year AJCI</strong> (Mean Citation Rate) and the extended <strong>3-Year Citation Average (3-YCA)</strong>, alongside lifetime citation benchmarks.
            </p>
          </div>

          <div className="card-surface" style={{ padding: "2.5rem" }}>
            <h3 style={{ color: "#0284c7", marginBottom: "1rem", fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa-solid fa-earth-africa"></i>
              The Continental Citation Dividend &amp; Data Provenance
            </h3>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "1rem", fontSize: "0.98rem" }}>
              Historically, legacy commercial databases (such as Web of Science) have severely undervalued African research by limiting their citation universe to closed, paywalled journals predominantly published in the Global North. Under those restrictions, citations between African universities and journals are systematically omitted.
            </p>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "1.2rem", fontSize: "0.98rem" }}>
              AfriJournal Index resolves this structural gap by ingesting open citation networks from verified international authorities:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.3rem" }}>
                  <i className="fa-solid fa-fingerprint" style={{ color: "#d97706" }}></i> Crossref &amp; I4OC
                </strong>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Official Digital Object Identifier (DOI) reference graph tracking formal scholarly citations worldwide.
                </span>
              </div>
              <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.3rem" }}>
                  <i className="fa-solid fa-check-circle" style={{ color: "#16a34a" }}></i> DOAJ Standards
                </strong>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Strict peer-review integrity and open-access licensing benchmarks, guarding against predatory practices.
                </span>
              </div>
              <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <strong style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.3rem" }}>
                  <i className="fa-solid fa-network-wired" style={{ color: "#2563eb" }}></i> OpenAlex &amp; OAI-PMH
                </strong>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Continental repository harvesting across 1,600+ African universities, capturing authentic institutional citations.
                </span>
              </div>
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1rem 1.25rem", borderRadius: "8px", fontSize: "0.9rem", color: "#1e40af" }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: "6px" }}></i>
              <strong>Benchmark Validation:</strong> By capturing this continental citation dividend, AfriJournal metrics closely align with Scopus CiteScore and SCImago h-index benchmarks while capturing research impact addressing regional challenges.
            </div>
          </div>

          <div className="card-surface" style={{ padding: "2.5rem" }}>
            <h3 style={{ color: "var(--color-secondary)", marginBottom: "1rem", fontSize: "1.3rem", fontWeight: 700 }}>
              {t.methodology_page.criteria_title}
            </h3>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "2", paddingLeft: "1.5rem", fontSize: "0.95rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>{t.methodology_page.criteria_1}</li>
              <li style={{ marginBottom: "0.5rem" }}>{t.methodology_page.criteria_2}</li>
              <li>{t.methodology_page.criteria_3}</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
