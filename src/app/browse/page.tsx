"use client";

import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";

interface Journal {
  name: string;
  issn: string;
  publisher: string;
  country: string;
  frequency: string;
  disciplines: string[];
  link: string;
}

const seedJournals: Journal[] = [
  {
    name: "African Research Journal of Education and Social Sciences (ARJESS)",
    issn: "2312-0134",
    publisher: "Kenya Projects Organization (KENPRO)",
    country: "Kenya",
    frequency: "Quarterly",
    disciplines: ["Education", "Social Sciences"],
    link: "https://arjess.org"
  },
  {
    name: "Journal of Management and Business Administration (JMBA)",
    issn: "2519-0016",
    publisher: "Kenya Projects Organization (KENPRO)",
    country: "Kenya",
    frequency: "Quarterly",
    disciplines: ["Management", "Business"],
    link: ""
  },
  {
    name: "International Journal of Environmental and Health Sciences (IJEHS)",
    issn: "Pending",
    publisher: "Kenya Projects Organization (KENPRO)",
    country: "Kenya",
    frequency: "Semi-Annually",
    disciplines: ["Environment", "Health Sciences"],
    link: ""
  },
  {
    name: "Journal of Education in Developing Economies (JEDE)",
    issn: "Pending",
    publisher: "Kenya Projects Organization (KENPRO)",
    country: "Kenya",
    frequency: "Semi-Annually",
    disciplines: ["Education"],
    link: ""
  },
  {
    name: "African Journal of Religious Studies (AJRS)",
    issn: "Pending",
    publisher: "Writers Bureau Centre / KENPRO",
    country: "Kenya",
    frequency: "Annually",
    disciplines: ["Social Sciences"],
    link: ""
  }
];

export default function Browse() {
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  
  // Search and Filter State
  const [search, setSearch] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");
  const [filteredJournals, setFilteredJournals] = useState<Journal[]>(seedJournals);

  // Handle Search & Filter logic
  useEffect(() => {
    const query = search.toLowerCase();
    const result = seedJournals.filter(j => {
      const matchesSearch = j.name.toLowerCase().includes(query) || 
                           j.issn.toLowerCase().includes(query) || 
                           j.publisher.toLowerCase().includes(query);
      
      const matchesCountry = countryFilter === "" || j.country === countryFilter;
      const matchesDiscipline = disciplineFilter === "" || j.disciplines.includes(disciplineFilter);

      return matchesSearch && matchesCountry && matchesDiscipline;
    });
    setFilteredJournals(result);
  }, [search, countryFilter, disciplineFilter]);

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
            <a href="/browse" className="nav-link active">{t.nav.browse}</a>
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

      <main className="container" style={{ padding: "4rem 0" }}>
        <div className="section-header">
          <h1 className="section-title">{t.browse_page.title}</h1>
          <p className="section-desc">{t.browse_page.desc}</p>
        </div>

        {/* Filter and Search Row */}
        <div className="search-filter-wrapper" style={{ marginBottom: "3rem" }}>
          <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
              <input 
                type="text" 
                placeholder={t.browse_page.search_placeholder} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "0.8rem 1rem 0.8rem 2.5rem", 
                  background: "rgba(255,255,255,0.05)", 
                  border: "1px solid rgba(255,255,255,0.1)", 
                  borderRadius: "var(--border-radius-sm)", 
                  color: "var(--color-text-light)", 
                  outline: "none" 
                }} 
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "1rem", top: "1.1rem", color: "var(--color-text-muted)" }}></i>
            </div>
            <div>
              <select 
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="lang-selector" 
                style={{ height: "45px" }}
              >
                <option value="">{t.browse_page.filter_all_countries}</option>
                <option value="Kenya">Kenya</option>
              </select>
            </div>
            <div>
              <select 
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value)}
                className="lang-selector" 
                style={{ height: "45px" }}
              >
                <option value="">{t.browse_page.filter_all_disciplines}</option>
                <option value="Education">Education</option>
                <option value="Social Sciences">Social Sciences</option>
                <option value="Management">Management</option>
                <option value="Business">Business</option>
                <option value="Environment">Environment</option>
                <option value="Health Sciences">Health Sciences</option>
              </select>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="journals-grid">
          {filteredJournals.length === 0 ? (
            <div className="glass-card" style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem" }}>
              {t.browse_page.no_results}
            </div>
          ) : (
            filteredJournals.map((journal, index) => (
              <div className="journal-card" key={index}>
                <div className="journal-meta">
                  {journal.disciplines.map((d, i) => (
                    <span className="journal-tag" key={i}>{d}</span>
                  ))}
                  <span className="journal-tag" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)" }}>
                    {journal.country}
                  </span>
                </div>
                <h3 className="journal-name">{journal.name}</h3>
                <div className="journal-details">
                  <p><strong>ISSN:</strong> {journal.issn}</p>
                  <p><strong>Publisher:</strong> {journal.publisher}</p>
                  <p><strong>Frequency:</strong> {journal.frequency}</p>
                </div>
                <div className="journal-footer">
                  {journal.link ? (
                    <a href={journal.link} target="_blank" rel="noopener noreferrer" className="journal-link">
                      {journal.link.replace("https://", "")} <i className="fa-solid fa-up-right-from-square"></i>
                    </a>
                  ) : (
                    <span className="journal-link-placeholder">kenpro.org</span>
                  )}
                  <span className="journal-badge badge-indexed"><i className="fa-solid fa-check-double"></i> {t.browse_page.badge_indexed}</span>
                </div>
              </div>
            ))
          )}
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
