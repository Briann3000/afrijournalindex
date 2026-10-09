"use client";

import React from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function About() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Header */}
      <Header activePage="about" />

      <main className="container reading-container" style={{ padding: "3.5rem 0 6rem" }}>
        <div className="page-header" style={{ marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-circle-info"></i>
            About the Initiative
          </span>
          <h1 className="page-title">{t.nav.about}</h1>
          <p className="page-subtitle">{t.about_page.subtitle}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card-surface" style={{ padding: "2.5rem" }}>
            <h3 style={{ color: "var(--color-primary)", marginBottom: "1rem", fontSize: "1.3rem", fontWeight: 700 }}>
              {t.about_page.mission_title}
            </h3>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "1.25rem", fontSize: "0.98rem" }}>
              {t.about_page.mission_text1}
            </p>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.98rem" }}>
              {t.about_page.mission_text2}
            </p>
          </div>

          <div className="card-surface" style={{ padding: "2.5rem" }}>
            <h3 style={{ color: "var(--color-secondary)", marginBottom: "1rem", fontSize: "1.3rem", fontWeight: 700 }}>
              {t.about_page.partner_title}
            </h3>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.98rem" }}>
              {t.about_page.partner_text}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
