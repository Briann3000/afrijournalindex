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

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand Logo */}
        <a href="/" className="logo">
          <span style={{ color: "#ffffff", fontWeight: 800 }}>Afri</span>
          <span style={{ color: "#38bdf8", fontWeight: 800 }}>Journal Indexing</span>
        </a>
        
        {/* Clustered Navigation Menu */}
        <nav 
          ref={navRef}
          className={`nav-menu ${isMobileMenuOpen ? "active" : ""}`} 
          id="navMenu"
          style={isMobileMenuOpen ? {
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            top: "72px",
            left: "0",
            width: "100%",
            background: "#0f172a",
            padding: "1.5rem 2rem",
            borderBottom: "1px solid #1e293b",
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.6)",
            zIndex: 99,
            gap: "1rem"
          } : undefined}
        >
          {/* Direct Home Link */}
          <a href="/" className={`nav-link ${activePage === "home" ? "active" : ""}`}>
            {t.nav.home}
          </a>

          {/* Group 1: Journals */}
          <div className="nav-dropdown-wrapper" style={{ position: "relative" }}>
            <button 
              type="button"
              className={`nav-link nav-dropdown-btn ${activePage === "browse" || activePage === "submit" || activePage === "pricing" ? "active" : ""}`}
              onClick={() => toggleDropdown("journals")}
              onMouseEnter={() => setOpenDropdown("journals")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <span>Journals</span>
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
                  minWidth: "220px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.5rem 0",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  zIndex: 110
                }}
              >
                <a href="/browse" className="nav-dropdown-item">
                  <i className="fa-solid fa-book-open" style={{ color: "#38bdf8", width: "18px" }}></i>
                  <span>Browse Directory</span>
                </a>
                <a href="/submit" className="nav-dropdown-item">
                  <i className="fa-solid fa-cloud-arrow-up" style={{ color: "#38bdf8", width: "18px" }}></i>
                  <span>Submit for Indexing</span>
                </a>
                <a href="/pricing" className="nav-dropdown-item">
                  <i className="fa-solid fa-tags" style={{ color: "#38bdf8", width: "18px" }}></i>
                  <span>Pricing & Packages</span>
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
              style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <span>Rankings & Metrics</span>
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
                  minWidth: "230px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.5rem 0",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  zIndex: 110
                }}
              >
                <a href="/rankings" className="nav-dropdown-item">
                  <i className="fa-solid fa-chart-line" style={{ color: "#38bdf8", width: "18px" }}></i>
                  <span>Journal Quartiles (Q1-Q4)</span>
                </a>
                <a href="/institution" className="nav-dropdown-item">
                  <i className="fa-solid fa-building-columns" style={{ color: "#38bdf8", width: "18px" }}></i>
                  <span>University League Table</span>
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
              style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              <span>Resources & About</span>
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
                  minWidth: "210px",
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "0.5rem 0",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  zIndex: 110
                }}
              >
                <a href="/about" className="nav-dropdown-item">
                  <i className="fa-solid fa-circle-info" style={{ color: "#38bdf8", width: "18px" }}></i>
                  <span>About Us</span>
                </a>
                <a href="/about#methodology" className="nav-dropdown-item">
                  <i className="fa-solid fa-scale-balanced" style={{ color: "#38bdf8", width: "18px" }}></i>
                  <span>AJIF Methodology</span>
                </a>
                <a href="/contact" className="nav-dropdown-item">
                  <i className="fa-solid fa-envelope" style={{ color: "#38bdf8", width: "18px" }}></i>
                  <span>Contact & Support</span>
                </a>
              </div>
            )}
          </div>
        </nav>
        
        {/* Right Header Actions */}
        <div className="header-actions">
          <div className="lang-selector-wrapper">
            <select 
              id="langSelector" 
              className="lang-selector"
              value={lang}
              aria-label="Select Language"
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="pt">Português</option>
              <option value="ar">العربية</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>

          {user ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <a href={`/researcher?id=${user.id}`} className="btn btn-secondary btn-sm" style={{ background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}>Profile</a>
              <button 
                onClick={async () => {
                  await fetch("/api/auth/login", { method: "DELETE" });
                  window.location.reload();
                }}
                className="btn btn-secondary btn-sm"
                style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", background: "#1e293b" }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <a href="/login" className="btn btn-secondary btn-sm" style={{ background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}>Login</a>
              <a href="/submit" className="btn btn-primary btn-sm">{t.nav.get_started}</a>
            </>
          )}
          
          <button className="menu-toggle" id="menuToggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
