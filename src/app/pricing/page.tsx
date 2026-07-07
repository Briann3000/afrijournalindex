"use client";

import React, { useState, useEffect } from "react";

export default function Pricing() {
  const [lang, setLang] = useState<string>("en");
  const [translations, setTranslations] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Load translations
  useEffect(() => {
    async function loadTranslations() {
      try {
        const res = await fetch(`/locales/${lang}.json`);
        if (!res.ok) throw new Error("Translation file not found");
        const data = await res.json();
        setTranslations(data);
      } catch (err) {
        console.error("Failed to load translation file", err);
      }
    }
    loadTranslations();

    if (lang === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
      document.documentElement.setAttribute("lang", lang);
    }
  }, [lang]);

  if (!translations) {
    return <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading AfriJournal Index...</div>;
  }

  const t = translations;

  const handlePurchase = (tier: string) => {
    alert(`Thank you for choosing the ${tier} evaluation. Payment integrations will be completed in Phase 5!`);
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
            <a href="/pricing" className="nav-link active">{t.nav.pricing}</a>
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

      <main className="container" style={{ padding: "4rem 0" }}>
        <div className="section-header">
          <h1 className="section-title">{t.pricing_page.title}</h1>
          <p className="section-desc">{t.pricing_page.desc}</p>
        </div>

        <div className="valprop-grid" style={{ alignItems: "stretch", marginBottom: "4rem" }}>
          {/* Free Indexing Tier */}
          <div className="glass-card valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderColor: "rgba(255,255,255,0.05)" }}>
            <div>
              <h3 className="card-title" style={{ color: "var(--color-accent-green)" }}>{t.pricing_page.free_title}</h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, margin: "1rem 0", fontFamily: "var(--font-heading)" }}>
                {t.pricing_page.free_price} <span style={{ fontSize: "1rem", fontFamily: "var(--font-ui)", color: "var(--color-text-muted)" }}>{t.pricing_page.free_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.free_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-accent-green)", marginRight: "0.5rem" }}></i> {t.pricing_page.free_feature1}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-accent-green)", marginRight: "0.5rem" }}></i> {t.pricing_page.free_feature2}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-accent-green)", marginRight: "0.5rem" }}></i> {t.pricing_page.free_feature3}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-accent-green)", marginRight: "0.5rem" }}></i> {t.pricing_page.free_feature4}</li>
              </ul>
            </div>
            <a href="/submit" className="btn btn-secondary" style={{ width: "100%" }}>{t.nav.get_started}</a>
          </div>

          {/* Basic Impact Report */}
          <div className="glass-card valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderColor: "var(--color-primary)", position: "relative" }}>
            <div style={{ position: "absolute", top: "-12px", right: "20px", backgroundColor: "var(--color-primary)", color: "var(--color-bg-dark)", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.8rem", borderRadius: "50px" }}>{t.pricing_page.badge_popular}</div>
            <div>
              <h3 className="card-title" style={{ color: "var(--color-primary)" }}>{t.pricing_page.basic_title}</h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, margin: "1rem 0", fontFamily: "var(--font-heading)" }}>
                {t.pricing_page.basic_price} <span style={{ fontSize: "1rem", fontFamily: "var(--font-ui)", color: "var(--color-text-muted)" }}>{t.pricing_page.basic_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.basic_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> {t.pricing_page.basic_feature1}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> {t.pricing_page.basic_feature2}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> {t.pricing_page.basic_feature3}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> {t.pricing_page.basic_feature4}</li>
              </ul>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handlePurchase("Basic Impact")}>{t.pricing_page.btn_order}</button>
          </div>

          {/* Premium Institutional Report */}
          <div className="glass-card valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderColor: "rgba(255,255,255,0.05)" }}>
            <div>
              <h3 className="card-title" style={{ color: "var(--color-secondary)" }}>{t.pricing_page.premium_title}</h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, margin: "1rem 0", fontFamily: "var(--font-heading)" }}>
                {t.pricing_page.premium_price} <span style={{ fontSize: "1rem", fontFamily: "var(--font-ui)", color: "var(--color-text-muted)" }}>{t.pricing_page.premium_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.premium_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-secondary)", marginRight: "0.5rem" }}></i> {t.pricing_page.premium_feature1}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-secondary)", marginRight: "0.5rem" }}></i> {t.pricing_page.premium_feature2}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-secondary)", marginRight: "0.5rem" }}></i> {t.pricing_page.premium_feature3}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-secondary)", marginRight: "0.5rem" }}></i> {t.pricing_page.premium_feature4}</li>
              </ul>
            </div>
            <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => handlePurchase("Premium Institutional")}>{t.pricing_page.btn_order}</button>
          </div>
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
