"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLang } from "./LangContext";

interface HeaderProps {
  activePage?: "home" | "browse" | "rankings" | "submit" | "pricing" | "about";
}

export default function Header({ activePage }: HeaderProps) {
  const { lang, setLang, t } = useLang();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    }
    checkUser();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand Logo */}
        <a href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.25rem" }}>Afri</span>
          <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: "1.25rem" }}>Journal Index</span>
        </a>
        
        {/* Clustered Desktop Navigation Menu */}
        <nav 
          ref={navRef}
          className="nav-menu" 
          id="navMenu"
        >
          {/* Direct Home Link */}
          <a href="/" className={`nav-link ${activePage === "home" ? "active" : ""}`}>
            {t.nav.home}
          </a>

          {/* Group 1: Journals & Submissions */}
          <div className="nav-dropdown-wrapper" style={{ position: "relative" }}>
            <button 
              type="button"
              className={`nav-link nav-dropdown-btn ${activePage === "browse" || activePage === "submit" || activePage === "pricing" ? "active" : ""}`}
              onClick={() => toggleDropdown("journals")}
              onMouseEnter={() => setOpenDropdown("journals")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>{t.nav.journals}</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: "0.68rem", opacity: 0.8, transition: "transform 0.2s", transform: openDropdown === "journals" ? "rotate(180deg)" : "rotate(0deg)" }}></i>
            </button>

            {openDropdown === "journals" && (
              <div 
                className="nav-dropdown-menu"
                onMouseLeave={() => setOpenDropdown(null)}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  minWidth: "230px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "10px",
                  padding: "0.6rem 0",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.6)",
                  zIndex: 110
                }}
              >
                <a href="/browse" className="nav-dropdown-item">
                  <i className="fa-solid fa-book-open" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.nav.browse}</span>
                </a>
                <a href="/submit" className="nav-dropdown-item">
                  <i className="fa-solid fa-cloud-arrow-up" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.nav.submit}</span>
                </a>
                <a href="/pricing" className="nav-dropdown-item">
                  <i className="fa-solid fa-tags" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.nav.pricing}</span>
                </a>
              </div>
            )}
          </div>

          {/* Group 2: Rankings & Metrics */}
          <div className="nav-dropdown-wrapper" style={{ position: "relative" }}>
            <button 
              type="button"
              className={`nav-link nav-dropdown-btn ${activePage === "rankings" ? "active" : ""}`}
              onClick={() => toggleDropdown("rankings")}
              onMouseEnter={() => setOpenDropdown("rankings")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>{t.nav.rankings}</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: "0.68rem", opacity: 0.8, transition: "transform 0.2s", transform: openDropdown === "rankings" ? "rotate(180deg)" : "rotate(0deg)" }}></i>
            </button>

            {openDropdown === "rankings" && (
              <div 
                className="nav-dropdown-menu"
                onMouseLeave={() => setOpenDropdown(null)}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  minWidth: "240px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "10px",
                  padding: "0.6rem 0",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.6)",
                  zIndex: 110
                }}
              >
                <a href="/rankings" className="nav-dropdown-item">
                  <i className="fa-solid fa-chart-line" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.nav.rankings}</span>
                </a>
                <a href="/institution" className="nav-dropdown-item">
                  <i className="fa-solid fa-building-columns" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.nav.institution}</span>
                </a>
              </div>
            )}
          </div>

          {/* Group 3: Resources & About */}
          <div className="nav-dropdown-wrapper" style={{ position: "relative" }}>
            <button 
              type="button"
              className={`nav-link nav-dropdown-btn ${activePage === "about" ? "active" : ""}`}
              onClick={() => toggleDropdown("resources")}
              onMouseEnter={() => setOpenDropdown("resources")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>{t.nav.about}</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: "0.68rem", opacity: 0.8, transition: "transform 0.2s", transform: openDropdown === "resources" ? "rotate(180deg)" : "rotate(0deg)" }}></i>
            </button>

            {openDropdown === "resources" && (
              <div 
                className="nav-dropdown-menu"
                onMouseLeave={() => setOpenDropdown(null)}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "0",
                  minWidth: "220px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "10px",
                  padding: "0.6rem 0",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.6)",
                  zIndex: 110
                }}
              >
                <a href="/about" className="nav-dropdown-item">
                  <i className="fa-solid fa-circle-info" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.nav.about}</span>
                </a>
                <a href="/methodology" className="nav-dropdown-item">
                  <i className="fa-solid fa-scale-balanced" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.footer.methodology}</span>
                </a>
                <a href="/faq" className="nav-dropdown-item">
                  <i className="fa-solid fa-circle-question" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.nav.faq}</span>
                </a>
                <a href="/contact" className="nav-dropdown-item">
                  <i className="fa-solid fa-envelope" style={{ color: "#38bdf8", width: "20px" }}></i>
                  <span>{t.nav.contact}</span>
                </a>
              </div>
            )}
          </div>
        </nav>
        
        {/* Right Header Actions */}
        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Language Switcher */}
          <div className="lang-selector-wrapper">
            <select 
              id="langSelector" 
              className="lang-selector"
              value={lang}
              aria-label="Select Language"
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">English (EN)</option>
              <option value="fr">Français (FR)</option>
              <option value="sw">Kiswahili (SW)</option>
              <option value="pt">Português (PT)</option>
              <option value="ar">العربية (AR)</option>
            </select>
          </div>

          {/* Desktop User Action Buttons */}
          <div className="desktop-actions" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {user ? (
              <>
                <a href={`/researcher?id=${user.id}`} className="btn btn-secondary btn-sm" style={{ background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}>
                  <i className="fa-solid fa-user-graduate" style={{ marginRight: "5px" }}></i>
                  {t.nav.profile}
                </a>
                <button 
                  onClick={async () => {
                    await fetch("/api/auth/login", { method: "DELETE" });
                    window.location.reload();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", background: "#1e293b" }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: "5px" }}></i>
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="btn btn-secondary btn-sm" style={{ background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}>
                  {t.nav.login}
                </a>
                <a href="/submit" className="btn btn-primary btn-sm">
                  {t.nav.get_started}
                </a>
              </>
            )}
          </div>
          
          {/* Mobile Hamburger Button */}
          <button 
            className="menu-toggle" 
            id="menuToggle" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            aria-label="Toggle Menu"
            style={{ fontSize: "1.25rem", color: "#ffffff", background: "none", border: "none", cursor: "pointer", padding: "8px" }}
          >
            <i className={`fa-solid ${isMobileMenuOpen ? "fa-xmark" : "fa-bars"}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Full Height Slide-Over) */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-nav-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 998
          }}
        >
          <div 
            className="mobile-nav-drawer"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: lang === "ar" ? "auto" : 0,
              left: lang === "ar" ? 0 : "auto",
              width: "85%",
              maxWidth: "340px",
              height: "100%",
              background: "#0f172a",
              borderLeft: lang === "ar" ? "none" : "1px solid #1e293b",
              borderRight: lang === "ar" ? "1px solid #1e293b" : "none",
              padding: "1.5rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
            }}
          >
            {/* Direct Links */}
            <a 
              href="/" 
              className={`nav-link ${activePage === "home" ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: "1.05rem", fontWeight: 600, color: "#ffffff", padding: "0.5rem 0" }}
            >
              <i className="fa-solid fa-house" style={{ width: "24px", color: "#38bdf8" }}></i> {t.nav.home}
            </a>

            {/* Mobile Accordion 1: Journals */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem" }}>
              <button 
                type="button"
                onClick={() => toggleDropdown("m-journals")}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "0.4rem 0"
                }}
              >
                <span><i className="fa-solid fa-book" style={{ width: "24px", color: "#38bdf8" }}></i> {t.nav.journals}</span>
                <i className={`fa-solid fa-chevron-${openDropdown === "m-journals" ? "up" : "down"}`} style={{ fontSize: "0.8rem", color: "#94a3b8" }}></i>
              </button>
              {openDropdown === "m-journals" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0.6rem 0 0.4rem 1.5rem" }}>
                  <a href="/browse" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.nav.browse}</a>
                  <a href="/submit" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.nav.submit}</a>
                  <a href="/pricing" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.nav.pricing}</a>
                </div>
              )}
            </div>

            {/* Mobile Accordion 2: Rankings & Metrics */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem" }}>
              <button 
                type="button"
                onClick={() => toggleDropdown("m-rankings")}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "0.4rem 0"
                }}
              >
                <span><i className="fa-solid fa-chart-line" style={{ width: "24px", color: "#38bdf8" }}></i> {t.nav.rankings}</span>
                <i className={`fa-solid fa-chevron-${openDropdown === "m-rankings" ? "up" : "down"}`} style={{ fontSize: "0.8rem", color: "#94a3b8" }}></i>
              </button>
              {openDropdown === "m-rankings" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0.6rem 0 0.4rem 1.5rem" }}>
                  <a href="/rankings" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.nav.rankings}</a>
                  <a href="/institution" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.nav.institution}</a>
                </div>
              )}
            </div>

            {/* Mobile Accordion 3: Resources & About */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem" }}>
              <button 
                type="button"
                onClick={() => toggleDropdown("m-about")}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "0.4rem 0"
                }}
              >
                <span><i className="fa-solid fa-circle-info" style={{ width: "24px", color: "#38bdf8" }}></i> {t.nav.about}</span>
                <i className={`fa-solid fa-chevron-${openDropdown === "m-about" ? "up" : "down"}`} style={{ fontSize: "0.8rem", color: "#94a3b8" }}></i>
              </button>
              {openDropdown === "m-about" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0.6rem 0 0.4rem 1.5rem" }}>
                  <a href="/about" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.nav.about}</a>
                  <a href="/methodology" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.footer.methodology}</a>
                  <a href="/faq" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.nav.faq}</a>
                  <a href="/contact" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>{t.nav.contact}</a>
                </div>
              )}
            </div>

            {/* Mobile Auth & CTA Buttons */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "1.2rem", marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {user ? (
                <>
                  <a 
                    href={`/researcher?id=${user.id}`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-secondary" 
                    style={{ width: "100%", justifyContent: "center", background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}
                  >
                    <i className="fa-solid fa-user-graduate"></i> {t.nav.profile}
                  </a>
                  <button 
                    onClick={async () => {
                      await fetch("/api/auth/login", { method: "DELETE" });
                      window.location.reload();
                    }}
                    className="btn btn-secondary"
                    style={{ width: "100%", justifyContent: "center", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", background: "#1e293b" }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <a 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-secondary" 
                    style={{ width: "100%", justifyContent: "center", background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}
                  >
                    {t.nav.login}
                  </a>
                  <a 
                    href="/submit" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-primary" 
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {t.nav.get_started}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
