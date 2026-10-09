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
            <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border)", padding: "2rem", borderRadius: "10px", margin: "1.5rem 0", display: "flex", justifyContent: "center", alignItems: "center", gap: "1.2rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary)" }}>AJIF (2026) =</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <span style={{ borderBottom: "2px solid var(--color-text-main)", paddingBottom: "6px", fontSize: "0.98rem", fontWeight: 600, color: "var(--color-text-main)" }}>
                  {t.methodology_page.formula_num}
                </span>
                <span style={{ paddingTop: "6px", fontSize: "0.98rem", fontWeight: 600, color: "var(--color-text-body)" }}>
                  {t.methodology_page.formula_den}
                </span>
              </div>
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
