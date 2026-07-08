"use client";

import React, { useState, useEffect } from "react";
import { useLang } from "./LangContext";

interface HeaderProps {
  activePage?: "home" | "browse" | "rankings" | "submit" | "pricing" | "about";
}

export default function Header({ activePage }: HeaderProps) {
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

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

  return (
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
          <a href="/" className={`nav-link ${activePage === "home" ? "active" : ""}`}>{t.nav.home}</a>
          <a href="/browse" className={`nav-link ${activePage === "browse" ? "active" : ""}`}>{t.nav.browse}</a>
          <a href="/rankings" className={`nav-link ${activePage === "rankings" ? "active" : ""}`}>Rankings</a>
          <a href="/submit" className={`nav-link ${activePage === "submit" ? "active" : ""}`}>{t.nav.submit}</a>
          <a href="/pricing" className={`nav-link ${activePage === "pricing" ? "active" : ""}`}>{t.nav.pricing}</a>
          <a href="/about" className={`nav-link ${activePage === "about" ? "active" : ""}`}>{t.nav.about}</a>
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

          {user ? (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <a href={`/researcher?id=${user.id}`} className="btn btn-secondary btn-sm">Profile</a>
              <button 
                onClick={async () => {
                  await fetch("/api/auth/login", { method: "DELETE" });
                  window.location.reload();
                }}
                className="btn btn-secondary btn-sm"
                style={{ border: "1px solid rgba(255,74,74,0.3)", color: "#ff4a4a" }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <a href="/login" className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem" }}>Login</a>
              <a href="/submit" className="btn btn-primary btn-sm">{t.nav.get_started}</a>
            </>
          )}
          
          <button className="menu-toggle" id="menuToggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
