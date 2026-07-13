"use client";

import React from "react";
import { useLang } from "./LangContext";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="/" className="logo">
            <span className="logo-accent">Afri</span>Journal Index
          </a>
          <p className="footer-desc">{t.footer.desc}</p>
        </div>
        
        <div className="footer-links">
          <h4 className="footer-heading">{t.footer.links_head}</h4>
          <a href="/browse">{t.nav.browse}</a>
          <a href="/submit">{t.nav.submit}</a>
          <a href="/pricing">{t.nav.pricing}</a>
          <a href="/rankings">{t.nav.rankings || "Rankings"}</a>
          <a href="/institution">{t.nav.institution || "Institutional Console"}</a>
        </div>
        
        <div className="footer-links">
          <h4 className="footer-heading">{t.footer.resources_head}</h4>
          <a href="/about">{t.nav.about}</a>
          <a href="/methodology">{t.footer.methodology}</a>
          <a href="/faq">{t.nav.faq || "FAQ"}</a>
          <a href="/contact">{t.footer.contact}</a>
        </div>
        
        <div className="footer-links">
          <h4 className="footer-heading">{t.footer.legal_head || "Legal"}</h4>
          <a href="/terms">{t.footer.terms || "Terms & Conditions"}</a>
          <a href="/privacy">{t.footer.privacy || "Privacy Policy"}</a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container footer-bottom-flex">
          <p className="copyright">
            &copy; 2026 AfriJournal Index.{" "}
            
          </p>
          {/*<div className="footer-socials">
            <a href="#"><i className="fa-brands fa-twitter"></i></a>
            <a href="#"><i className="fa-brands fa-linkedin"></i></a>
            <a href="#"><i className="fa-brands fa-orcid"></i></a>
          </div>*/}
        </div>
      </div>
    </footer>
  );
}
