"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function About() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="theme-dark">
      {/* Header */}
      <Header activePage="about" />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "800px" }}>
        <div className="section-header" style={{ textAlign: "left" }}>
          <h1 className="section-title">{t.nav.about}</h1>
          <p className="section-desc">{t.about_page.subtitle}</p>
        </div>

        <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
          <h3 style={{ color: "var(--color-primary)", marginBottom: "1rem" }}>{t.about_page.mission_title}</h3>
          <p style={{ color: "var(--color-text-light)", lineHeight: "1.7", marginBottom: "1.5rem" }}>
            {t.about_page.mission_text1}
          </p>
          <p style={{ color: "var(--color-text-light)", lineHeight: "1.7" }}>
            {t.about_page.mission_text2}
          </p>
        </div>

        <div className="glass-card" style={{ padding: "2.5rem" }}>
          <h3 style={{ color: "var(--color-secondary)", marginBottom: "1rem" }}>{t.about_page.partner_title}</h3>
          <p style={{ color: "var(--color-text-light)", lineHeight: "1.7" }}>
            {t.about_page.partner_text}
          </p>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
