"use client";

import React from "react";
import { useLang } from "./LangContext";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.25rem" }}>Afri</span>
            <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: "1.25rem" }}>Journal Index</span>
          </a>
          <p className="footer-desc">{t.footer.desc}</p>
        </div>
        
        <div className="footer-links">
          <h4 className="footer-heading">{t.footer.links_head}</h4>
          <a href="/browse">{t.nav.browse}</a>
          <a href="/submit">{t.nav.submit}</a>
          <a href="/pricing">{t.nav.pricing}</a>
          <a href="/rankings">{t.nav.rankings}</a>
          <a href="/institution">{t.nav.institution}</a>
        </div>
        
        <div className="footer-links">
          <h4 className="footer-heading">{t.footer.resources_head}</h4>
          <a href="/about">{t.nav.about}</a>
          <a href="/methodology">{t.footer.methodology}</a>
          <a href="/faq">{t.nav.faq}</a>
          <a href="/contact">{t.footer.contact}</a>
        </div>
        
        <div className="footer-links">
          <h4 className="footer-heading">{t.footer.legal_head}</h4>
          <a href="/terms">{t.footer.terms}</a>
          <a href="/privacy">{t.footer.privacy}</a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container footer-bottom-flex" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <p className="copyright">
            &copy; 2026 AfriJournal Index. {t.footer.rights}
          </p>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            {t.footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
