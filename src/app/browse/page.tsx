"use client";

import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

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

  const handleViewStatus = async (query: string) => {
    if (query === "Pending" || !query) {
      alert("This journal is currently awaiting formal evaluation setup.");
      return;
    }
    try {
      const res = await fetch(`/api/evaluate/lookup?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        window.location.href = `/submit/status?id=${data.submissionId}`;
      } else {
        alert("This seed journal does not have active evaluation logs recorded.");
      }
    } catch (err) {
      console.error(err);
      alert("Error retrieving journal status page.");
    }
  };

  return (
    <div className="theme-dark">
      {/* Header */}
      <Header activePage="browse" />

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
                <div className="journal-footer" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", width: "100%" }}>
                  {journal.link ? (
                    <a href={journal.link} target="_blank" rel="noopener noreferrer" className="journal-link" style={{ marginRight: "auto" }}>
                      {journal.link.replace("https://", "")} <i className="fa-solid fa-up-right-from-square"></i>
                    </a>
                  ) : (
                    <span className="journal-link-placeholder" style={{ marginRight: "auto" }}>kenpro.org</span>
                  )}
                  
                  <button 
                    onClick={() => handleViewStatus(journal.issn)} 
                    style={{
                      background: "rgba(212,160,74,0.1)",
                      border: "1px solid rgba(212,160,74,0.3)",
                      color: "var(--color-primary)",
                      padding: "0.3rem 0.8rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <i className="fa-solid fa-chart-column"></i> View Report
                  </button>

                  <span className="journal-badge badge-indexed"><i className="fa-solid fa-check-double"></i> {t.browse_page.badge_indexed}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
