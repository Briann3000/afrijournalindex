"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "./LangContext";

interface HeaderProps {
  activePage?: "home" | "browse" | "rankings" | "submit" | "pricing" | "about" | "compare" | "referee-finder" | "scholars" | "forum" | "posts";
}

export default function Header({ activePage }: HeaderProps) {
  const { lang, setLang, t } = useLang();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<{ [key: string]: boolean }>({
    journals: false,
    rankings: false,
    about: false,
  });
  const [user, setUser] = useState<any>(null);

  // Expandable Header Quick Search State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileSearchQuery, setMobileSearchQuery] = useState<string>("");

  const navRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Close dropdown or search on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isMobileMenuOpen) return;

      const target = event.target as Node;
      const clickedInsideNav = navRef.current ? navRef.current.contains(target) : false;
      const clickedInsideUser = userDropdownRef.current ? userDropdownRef.current.contains(target) : false;

      if (!clickedInsideNav && !clickedInsideUser) {
        setOpenDropdown(null);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        if (!searchQuery.trim()) {
          setIsSearchOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery, isMobileMenuOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

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

  const toggleMobileSection = (key: string) => {
    setMobileExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/browse");
    }
    setIsSearchOpen(false);
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
    } else {
      router.push("/browse");
    }
    setIsMobileMenuOpen(false);
  };

  const handleMobileNavigate = (url: string) => {
    setIsMobileMenuOpen(false);
    router.push(url);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Brand Logo */}
        <a href="/" className="logo" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div 
            className="logo-badge-container"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              background: "transparent",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0
            }}
          >
            <img 
              src="/logo.png" 
              alt="AfriJournal Indexing Logo" 
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} 
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="logo-text-afri" style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.35rem" }}>Afri</span>
            <span className="logo-text-journal" style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "1.35rem" }}>Journal Indexing</span>
          </div>
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
                  background: "#181820",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "0.6rem 0",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.6)",
                  zIndex: 110
                }}
              >
                <a href="/browse" className="nav-dropdown-item">
                  <i className="fa-solid fa-book-open" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.browse}</span>
                </a>
                <a href="/compare" className="nav-dropdown-item">
                  <i className="fa-solid fa-code-compare" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.compare || "Compare Journals"}</span>
                </a>
                <a href="/referee-finder" className="nav-dropdown-item">
                  <i className="fa-solid fa-user-check" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.referee_finder || "Referee Finder"}</span>
                </a>
                <a href="/submit" className="nav-dropdown-item">
                  <i className="fa-solid fa-cloud-arrow-up" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.submit}</span>
                </a>
                <a href="/pricing" className="nav-dropdown-item">
                  <i className="fa-solid fa-tags" style={{ color: "#f59e0b", width: "20px" }}></i>
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
                  background: "#181820",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "0.6rem 0",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.6)",
                  zIndex: 110
                }}
              >
                <a href="/rankings" className="nav-dropdown-item">
                  <i className="fa-solid fa-chart-line" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.rankings}</span>
                </a>
                <a href="/institution" className="nav-dropdown-item">
                  <i className="fa-solid fa-building-columns" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.institution}</span>
                </a>
              </div>
            )}
          </div>

          {/* Direct African Scholars Directory Link */}
          <a href="/scholars" className={`nav-link ${activePage === "scholars" ? "active" : ""}`}>
            Scholars
          </a>

          {/* Posts & Preprints Link */}
          <a href="/posts" className={`nav-link ${activePage === "posts" ? "active" : ""}`}>
            Posts
          </a>

          {/* AfriScholarChat Community Link */}
          <a href="/forum" className={`nav-link ${activePage === "forum" ? "active" : ""}`}>
            AfriScholarChat
          </a>

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
                  background: "#181820",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "0.6rem 0",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.6)",
                  zIndex: 110
                }}
              >
                <a href="/about" className="nav-dropdown-item">
                  <i className="fa-solid fa-circle-info" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.about}</span>
                </a>
                <a href="/methodology" className="nav-dropdown-item">
                  <i className="fa-solid fa-scale-balanced" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.footer.methodology}</span>
                </a>
                <a href="/faq" className="nav-dropdown-item">
                  <i className="fa-solid fa-circle-question" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.faq}</span>
                </a>
                <a href="/contact" className="nav-dropdown-item">
                  <i className="fa-solid fa-envelope" style={{ color: "#f59e0b", width: "20px" }}></i>
                  <span>{t.nav.contact}</span>
                </a>
              </div>
            )}
          </div>
        </nav>
        
        {/* Right Header Actions */}
        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, minWidth: 0 }}>
          
          {/* Expandable Desktop Quick Search */}
          <div ref={searchContainerRef} className="header-search-container" style={{ position: "relative", display: "flex", alignItems: "center", minWidth: 0 }}>
            {isSearchOpen ? (
              <form 
                onSubmit={handleSearchSubmit} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  background: "#1c1c24", 
                  border: "1px solid #f59e0b", 
                  borderRadius: "20px", 
                  padding: "2px 6px 2px 8px",
                  boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.25)",
                  transition: "all 0.25s ease",
                  width: "clamp(120px, 18vw, 200px)",
                  maxWidth: "100%",
                  flexShrink: 1
                }}
              >
                <i className="fa-solid fa-magnifying-glass" style={{ color: "#f59e0b", fontSize: "0.78rem", marginRight: "4px" }}></i>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, journals, scholars..."
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    width: "100%",
                    minWidth: "60px",
                    padding: "3px 0"
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchQuery) {
                      setSearchQuery("");
                    } else {
                      setIsSearchOpen(false);
                    }
                  }}
                  title="Close Search"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "3px 4px",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="header-search-trigger"
                title="Search Journals, Articles & Universities"
                aria-label="Open Search"
                style={{
                  background: "#1c1c24",
                  border: "1px solid rgba(255, 255, 255, 0.16)",
                  color: "#cbd5e1",
                  borderRadius: "50%",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
                  e.currentTarget.style.color = "#cbd5e1";
                }}
              >
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "0.82rem", color: "var(--color-primary)" }}></i>
              </button>
            )}
          </div>

          {/* Language Switcher - Compact Width */}
          <div className="lang-selector-wrapper" style={{ flexShrink: 0 }}>
            <select 
              id="langSelector" 
              className="lang-selector"
              value={lang}
              aria-label="Select Language"
              onChange={(e) => setLang(e.target.value)}
              style={{ fontSize: "0.78rem", padding: "0.35rem 18px 0.35rem 0.5rem", width: "72px" }}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="sw">SW</option>
              <option value="pt">PT</option>
              <option value="ar">AR</option>
            </select>
          </div>

          {/* Desktop User Action Buttons */}
          <div className="desktop-actions" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {user ? (
              <div ref={userDropdownRef} className="nav-dropdown-wrapper" style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => toggleDropdown("userProfile")}
                  onMouseEnter={() => setOpenDropdown("userProfile")}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: "#1c1c24",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "0.4rem 0.85rem",
                    cursor: "pointer"
                  }}
                >
                  <i className={`fa-solid ${user.role === "PUBLISHER" ? "fa-feather-pointed" : "fa-user-graduate"}`} style={{ color: "var(--color-primary)" }}></i>
                  <span style={{ fontWeight: 600 }}>{user.name ? user.name.split(" ")[0] : (user.role === "PUBLISHER" ? "Editor" : "Scholar")}</span>
                  <i className="fa-solid fa-chevron-down" style={{ fontSize: "0.68rem", opacity: 0.8, transition: "transform 0.2s", transform: openDropdown === "userProfile" ? "rotate(180deg)" : "rotate(0deg)" }}></i>
                </button>

                {openDropdown === "userProfile" && (
                  <div 
                    className="nav-dropdown-menu"
                    onMouseLeave={() => setOpenDropdown(null)}
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "6px",
                      minWidth: "220px",
                      background: "#181820",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "10px",
                      boxShadow: "0 12px 28px -5px rgba(0, 0, 0, 0.55)",
                      padding: "0.5rem",
                      zIndex: 1000,
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px"
                    }}
                  >
                    <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "4px" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.name || "Scholar"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </div>
                    </div>

                    <a 
                      href={`/researcher?id=${user.id}`} 
                      onClick={() => setOpenDropdown(null)}
                      className="nav-dropdown-item"
                      style={{ padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "10px", color: "#f1f5f9", textDecoration: "none", fontSize: "0.84rem", borderRadius: "6px", cursor: "pointer" }}
                    >
                      <i className={`fa-solid ${user.role === "PUBLISHER" ? "fa-feather-pointed" : "fa-user-graduate"}`} style={{ color: "var(--color-primary)", width: "16px" }}></i>
                      <span>{user.role === "PUBLISHER" ? "Editor & Scholar Profile" : t.nav.profile}</span>
                    </a>

                    <a 
                      href={`/researcher?id=${user.id}&tab=library`} 
                      onClick={() => setOpenDropdown(null)}
                      className="nav-dropdown-item"
                      style={{ padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "10px", color: "#f1f5f9", textDecoration: "none", fontSize: "0.84rem", borderRadius: "6px", cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-star" style={{ color: "#fbbf24", width: "16px" }}></i>
                      <span>Reading Library</span>
                    </a>

                    {user.role === "ADMIN" && (
                      <Link 
                        href="/admin" 
                        onClick={() => setOpenDropdown(null)}
                        className="nav-dropdown-item"
                        style={{ padding: "0.5rem 0.75rem", display: "flex", alignItems: "center", gap: "10px", color: "#f59e0b", textDecoration: "none", fontSize: "0.84rem", borderRadius: "6px", cursor: "pointer" }}
                      >
                        <i className="fa-solid fa-shield-halved" style={{ width: "16px" }}></i>
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", marginTop: "4px", paddingTop: "4px" }}>
                      <button 
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenDropdown(null);
                          await fetch("/api/auth/login", { method: "DELETE" }).catch(() => {});
                          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                          window.location.href = "/login";
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          padding: "0.5rem 0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          color: "#f87171",
                          fontSize: "0.84rem",
                          cursor: "pointer",
                          borderRadius: "6px"
                        }}
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: "16px" }}></i>
                        <span>{t.nav.logout}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a href="/login" className="btn btn-secondary btn-sm" style={{ background: "#1c1c24", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
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
        >
          <div 
            className="mobile-nav-drawer" 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: 0,
              right: lang === "ar" ? "auto" : 0,
              left: lang === "ar" ? 0 : "auto",
              width: "85%",
              maxWidth: "340px",
              height: "100vh",
              maxHeight: "100dvh",
              background: "#121217",
              borderLeft: lang === "ar" ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
              borderRight: lang === "ar" ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
              padding: "1.25rem 1.5rem 2.5rem",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              flexDirection: "column",
              gap: "1.1rem",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.6)",
              zIndex: 10000
            }}
          >
            {/* Drawer Top Brand Bar & Close Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.2rem" }}>Afri</span>
                <span style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "1.2rem" }}>Journal</span>
              </div>
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.3rem", cursor: "pointer", padding: "4px 8px" }}
                aria-label="Close menu"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Mobile Quick Search Bar */}
            <form onSubmit={handleMobileSearchSubmit} style={{ width: "100%", marginBottom: "0.25rem" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  placeholder="Search articles, journals, scholars..."
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem 0.65rem 2.2rem",
                    background: "#1c1c24",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                />
                <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "0.75rem", color: "#f59e0b", fontSize: "0.85rem" }}></i>
              </div>
            </form>

            {/* Direct Links */}
            <Link 
              href="/" 
              className={`nav-link ${activePage === "home" ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ fontSize: "1.05rem", fontWeight: 600, color: "#ffffff", padding: "0.5rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
            >
              <i className="fa-solid fa-house" style={{ width: "22px", color: "#f59e0b", textAlign: "center" }}></i>
              <span>{t.nav.home}</span>
            </Link>

            {/* Mobile Accordion 1: Journals */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem" }}>
              <button 
                type="button"
                onClick={() => toggleMobileSection("journals")}
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-book" style={{ width: "22px", color: "#f59e0b", textAlign: "center" }}></i>
                  <span>{t.nav.journals}</span>
                </div>
                <i 
                  className="fa-solid fa-chevron-down" 
                  style={{ 
                    fontSize: "0.8rem", 
                    color: "#94a3b8",
                    transition: "transform 0.2s ease",
                    transform: mobileExpanded.journals ? "rotate(180deg)" : "rotate(0deg)"
                  }}
                ></i>
              </button>
              {mobileExpanded.journals && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", padding: "0.6rem 0 0.4rem 1.75rem" }}>
                  <Link 
                    href="/browse" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-book-open" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.browse}</span>
                  </Link>
                  <Link 
                    href="/compare" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-code-compare" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.compare || "Compare Journals"}</span>
                  </Link>
                  <Link 
                    href="/referee-finder" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-user-check" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.referee_finder || "Referee Finder"}</span>
                  </Link>
                  <Link 
                    href="/submit" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-cloud-arrow-up" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.submit}</span>
                  </Link>
                  <Link 
                    href="/pricing" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-tags" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.pricing}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Accordion 2: Rankings & Metrics */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem" }}>
              <button 
                type="button"
                onClick={() => toggleMobileSection("rankings")}
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-chart-line" style={{ width: "22px", color: "#f59e0b", textAlign: "center" }}></i>
                  <span>{t.nav.rankings}</span>
                </div>
                <i 
                  className="fa-solid fa-chevron-down" 
                  style={{ 
                    fontSize: "0.8rem", 
                    color: "#94a3b8",
                    transition: "transform 0.2s ease",
                    transform: mobileExpanded.rankings ? "rotate(180deg)" : "rotate(0deg)"
                  }}
                ></i>
              </button>
              {mobileExpanded.rankings && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", padding: "0.6rem 0 0.4rem 1.75rem" }}>
                  <Link 
                    href="/rankings" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-chart-line" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.rankings}</span>
                  </Link>
                  <Link 
                    href="/institution" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-building-columns" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.institution}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Direct Scholars Directory Link */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem" }}>
              <Link 
                href="/scholars" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`nav-link ${activePage === "scholars" ? "active" : ""}`}
                style={{ fontSize: "1.05rem", fontWeight: 600, color: "#ffffff", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
              >
                <i className="fa-solid fa-graduation-cap" style={{ width: "22px", color: "#f59e0b", textAlign: "center" }}></i>
                <span>Scholars</span>
              </Link>
            </div>

            {/* Direct Posts & Preprints Link */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem" }}>
              <Link 
                href="/posts" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`nav-link ${activePage === "posts" ? "active" : ""}`}
                style={{ fontSize: "1.05rem", fontWeight: 600, color: "#ffffff", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
              >
                <i className="fa-solid fa-scroll" style={{ width: "22px", color: "#f59e0b", textAlign: "center" }}></i>
                <span>Posts</span>
              </Link>
            </div>

            {/* Mobile Accordion 3: Resources & About */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "0.85rem" }}>
              <button 
                type="button"
                onClick={() => toggleMobileSection("about")}
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-circle-info" style={{ width: "22px", color: "#f59e0b", textAlign: "center" }}></i>
                  <span>{t.nav.about}</span>
                </div>
                <i 
                  className="fa-solid fa-chevron-down" 
                  style={{ 
                    fontSize: "0.8rem", 
                    color: "#94a3b8",
                    transition: "transform 0.2s ease",
                    transform: mobileExpanded.about ? "rotate(180deg)" : "rotate(0deg)"
                  }}
                ></i>
              </button>
              {mobileExpanded.about && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", padding: "0.6rem 0 0.4rem 1.75rem" }}>
                  <Link 
                    href="/about" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-circle-info" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.about}</span>
                  </Link>
                  <Link 
                    href="/methodology" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-scale-balanced" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.footer.methodology}</span>
                  </Link>
                  <Link 
                    href="/faq" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-circle-question" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.faq}</span>
                  </Link>
                  <Link 
                    href="/contact" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    style={{ color: "#cbd5e1", fontSize: "0.95rem", padding: "0.4rem 0", display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
                  >
                    <i className="fa-solid fa-envelope" style={{ color: "#f59e0b", width: "18px", fontSize: "0.85rem", textAlign: "center" }}></i>
                    <span>{t.nav.contact}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Auth & CTA Buttons */}
            <div style={{ borderTop: "1px solid #1e293b", paddingTop: "1.2rem", marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {user ? (
                <>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="btn btn-sm"
                      style={{ width: "100%", justifyContent: "center", background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.4)", padding: "0.6rem 1rem" }}
                    >
                      <i className="fa-solid fa-shield-halved"></i> Chief Admin Console
                    </Link>
                  )}
                  <Link 
                    href={`/researcher?id=${user.id}`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-secondary" 
                    style={{ width: "100%", justifyContent: "center", background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}
                  >
                    <i className={`fa-solid ${user.role === "PUBLISHER" ? "fa-feather-pointed" : "fa-user-graduate"}`}></i> {user.role === "PUBLISHER" ? "Editor & Scholar Profile" : t.nav.profile}
                  </Link>
                  <Link 
                    href={`/researcher?id=${user.id}&tab=library`} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-secondary" 
                    style={{ width: "100%", justifyContent: "center", background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}
                  >
                    <i className="fa-solid fa-star" style={{ color: "#fbbf24" }}></i> Reading Library
                  </Link>
                  <button 
                    onClick={async () => {
                      await fetch("/api/auth/login", { method: "DELETE" }).catch(() => {});
                      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                      window.location.href = "/login";
                    }}
                    className="btn btn-secondary"
                    style={{ width: "100%", justifyContent: "center", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", background: "#1e293b" }}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-secondary" 
                    style={{ width: "100%", justifyContent: "center", background: "#1e293b", color: "#ffffff", border: "1px solid #334155" }}
                  >
                    {t.nav.login}
                  </Link>
                  <Link 
                    href="/submit" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn btn-primary" 
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {t.nav.get_started}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
