"use client";

import React from "react";
import { useLang } from "./LangContext";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              borderRadius: "10px",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              padding: "3px",
              overflow: "hidden"
            }}>
              <img 
                src="/logo.png" 
                alt="AfriJournal Indexing Logo" 
                style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "7px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.35rem" }}>Afri</span>
              <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: "1.35rem" }}>Journal Indexing</span>
            </div>
          </a>
          <p className="footer-desc">{t.footer.desc}</p>
          <div style={{ marginTop: "0.8rem" }}>
            <a href="mailto:afrijournalindex@gmail.com" style={{ color: "#38bdf8", fontSize: "0.86rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <i className="fa-regular fa-envelope"></i> afrijournalindex@gmail.com
            </a>
          </div>
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
          <p className="copyright" style={{ color: "#e2e8f0", fontSize: "0.88rem", fontWeight: 500, margin: 0 }}>
            &copy; 2026 AfriJournal Index. {t.footer.rights}
          </p>
          <p style={{ fontSize: "0.88rem", color: "#93c5fd", fontWeight: 500, margin: 0 }}>
            {t.footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
