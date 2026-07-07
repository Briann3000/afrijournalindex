"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";

export default function About() {
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  return (
    <div className="theme-dark">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <a href="/" className="logo">
            <span className="logo-accent">Afri</span>Journal Index
          </a>
          
          <nav className={`nav-menu ${isMenuOpen ? "active" : ""}`} id="navMenu" style={isMenuOpen ? {
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: "80px",
            left: "0",
            width: "100%",
            background: "var(--color-bg-card)",
            padding: "2rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            zIndex: 99
          } : undefined}>
            <a href="/" className="nav-link">{t.nav.home}</a>
            <a href="/browse" className="nav-link">{t.nav.browse}</a>
            <a href="/submit" className="nav-link">{t.nav.submit}</a>
            <a href="/pricing" className="nav-link">{t.nav.pricing}</a>
            <a href="/about" className="nav-link active">{t.nav.about}</a>
          </nav>
          
          <div className="header-actions">
            <div className="lang-selector-wrapper">
              <select 
                id="langSelector" 
                className="lang-selector"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="pt">Português</option>
                <option value="ar">العربية</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
            <a href="/submit" className="btn btn-primary btn-sm">{t.nav.get_started}</a>
            <button className="menu-toggle" id="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

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
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <a href="/" className="logo"><span className="logo-accent">Afri</span>Journal Index</a>
            <p className="footer-desc">{t.footer.desc}</p>
          </div>
          <div className="footer-links">
            <h4 className="footer-heading">{t.footer.links_head}</h4>
            <a href="/browse">{t.nav.browse}</a>
            <a href="/submit">{t.nav.submit}</a>
            <a href="/pricing">{t.nav.pricing}</a>
          </div>
          <div className="footer-links">
            <h4 className="footer-heading">{t.footer.resources_head}</h4>
            <a href="/about">{t.nav.about}</a>
            <a href="/methodology">{t.footer.methodology}</a>
            <a href="/contact">{t.footer.contact}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
