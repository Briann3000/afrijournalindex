"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";

export default function Contact() {
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for reaching out! Our support team will respond to your query shortly.");
    window.location.href = "/";
  };

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
            <a href="/about" className="nav-link">{t.nav.about}</a>
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

      <main className="container" style={{ padding: "4rem 0", maxWidth: "600px" }}>
        <div className="section-header">
          <h1 className="section-title">{t.footer.contact}</h1>
          <p className="section-desc">{t.contact_page.desc}</p>
        </div>

        <div className="glass-card">
          <form className="submission-form" onSubmit={handleContactSubmit}>
            <div className="form-group">
              <label htmlFor="cName">{t.contact_page.name_label}</label>
              <input type="text" id="cName" required placeholder="e.g. Dr. Jane Doe" />
            </div>

            <div className="form-group">
              <label htmlFor="cEmail">{t.contact_page.email_label}</label>
              <input type="email" id="cEmail" required placeholder="jane.doe@university.edu" />
            </div>

            <div className="form-group">
              <label htmlFor="cSubject">{t.contact_page.subject_label}</label>
              <input type="text" id="cSubject" required placeholder="e.g. Indexing status update" />
            </div>

            <div className="form-group">
              <label htmlFor="cMessage">{t.contact_page.message_label}</label>
              <textarea id="cMessage" rows={5} required placeholder="Write your query details here..."></textarea>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                {t.contact_page.btn_send} <i className="fa-solid fa-paper-plane" style={{ marginLeft: "0.5rem" }}></i>
              </button>
            </div>
          </form>
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
