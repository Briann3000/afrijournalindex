"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function Methodology() {
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  return (
    <div className="theme-dark">
      {/* Header */}
      <Header />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "800px" }}>
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">{t.footer.methodology}</h1>
          <p className="section-desc">{t.methodology_page.desc}</p>
        </div>

        <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
          <h3 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>{t.methodology_page.formula_title}</h3>
          <p style={{ color: "var(--color-text-light)", lineHeight: "1.7", marginBottom: "1.5rem" }}>
            {t.methodology_page.formula_desc}
          </p>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "2rem", borderRadius: "8px", margin: "1.5rem 0", display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>AJIF (2026) =</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "4px", fontSize: "0.95rem" }}>{t.methodology_page.formula_num}</span>
              <span style={{ paddingTop: "4px", fontSize: "0.95rem" }}>{t.methodology_page.formula_den}</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "2.5rem" }}>
          <h3 style={{ color: "var(--color-secondary)", marginBottom: "1rem" }}>{t.methodology_page.criteria_title}</h3>
          <ul style={{ color: "var(--color-text-light)", lineHeight: "1.8", paddingLeft: "1.2rem" }}>
            <li>{t.methodology_page.criteria_1}</li>
            <li>{t.methodology_page.criteria_2}</li>
            <li>{t.methodology_page.criteria_3}</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
