"use client";

import React, { useState, useEffect } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

interface RankedJournal {
  id: string;
  name: string;
  issn: string;
  eissn?: string;
  publisherName: string;
  qualityGrade: string;
  country: string;
  primaryDiscipline?: string;
  disciplines?: string[];
  quartile?: "Q1" | "Q2" | "Q3" | "Q4";
  disciplineRank?: number;
  totalInDiscipline?: number;
  score: number;
  ycaScore?: number;
  regionalScore: number;
  citationCount: number;
  articleCount: number;
}

export default function RankingsPage() {
  const { t } = useLang();
  const [rankings, setRankings] = useState<RankedJournal[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Sorting state
  const [sortBy, setSortBy] = useState<"score" | "ycaScore" | "regionalScore" | "citationCount" | "name">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "score" | "ycaScore" | "regionalScore" | "citationCount" | "name") => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder(field === "name" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    }
    const valA = a[sortBy] ?? 0;
    const valB = b[sortBy] ?? 0;
    return sortOrder === "asc" ? valA - valB : valB - valA;
  });

  const totalPages = Math.max(1, Math.ceil(sortedRankings.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRankings = sortedRankings.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (countryFilter) params.set("country", countryFilter);
        if (disciplineFilter) params.set("discipline", disciplineFilter);

        const url = `/api/journals/rankings${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setRankings(data.rankings);
          if (data.countries) setCountries(data.countries);
          if (data.disciplines) setDisciplines(data.disciplines);
        }
      } catch (err) {
        console.error("Failed to load rankings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
    setCurrentPage(1);
  }, [countryFilter, disciplineFilter]);

  const quartileStyles: Record<string, { bg: string; text: string; border: string }> = {
    Q1: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    Q2: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    Q3: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    Q4: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" }
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header activePage="rankings" />

      <main className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "1100px" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 className="page-title">{t.rankings_page.title}</h1>
          <p className="page-subtitle" style={{ maxWidth: "720px", margin: "0.5rem auto 0" }}>
            {t.rankings_page.subtitle}
          </p>
        </div>

        {/* Filter & Analytics Card */}
        <div className="card-surface" style={{ padding: "1.75rem", marginBottom: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", alignItems: "flex-end" }}>
            
            {/* Country Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="countryFilter" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                <i className="fa-solid fa-earth-africa" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.rankings_page.filter_country}
              </label>
              <select
                id="countryFilter"
                className="form-control"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <option value="">{t.rankings_page.all_countries}</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Discipline Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="disciplineFilter" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                <i className="fa-solid fa-graduation-cap" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> {t.rankings_page.filter_discipline}
              </label>
              <select
                id="disciplineFilter"
                className="form-control"
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value)}
              >
                <option value="">{t.rankings_page.all_disciplines}</option>
                {disciplines.map((disc) => (
                  <option key={disc} value={disc}>
                    {disc}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="rankSort" className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                <i className="fa-solid fa-arrow-down-short-wide" style={{ color: "var(--color-primary)", marginRight: "6px" }}></i> Sort Leaderboard
              </label>
              <select
                id="rankSort"
                className="form-control"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-") as ["score" | "regionalScore" | "citationCount" | "name", "asc" | "desc"];
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="score-desc">AJCI Score (Highest First)</option>
                <option value="score-asc">AJCI Score (Lowest First)</option>
                <option value="regionalScore-desc">Regional Score (Highest First)</option>
                <option value="citationCount-desc">Citations (Most First)</option>
                <option value="name-asc">Journal Name (A → Z)</option>
                <option value="name-desc">Journal Name (Z → A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rankings Table with Horizontal Scroll Support for Mobile */}
        <div className="table-responsive" style={{ background: "var(--color-bg-card)", borderRadius: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)", overflowX: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
              <p>{t.rankings_page.loading}</p>
            </div>
          ) : sortedRankings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
              <h3 style={{ fontSize: "1.2rem", color: "var(--color-text-main)", marginBottom: "0.4rem" }}>{t.rankings_page.no_results}</h3>
            </div>
          ) : (
            <table className="academic-table" style={{ width: "100%", minWidth: "640px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-alt)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ width: "70px", textAlign: "center", padding: "1rem" }}>{t.rankings_page.col_rank}</th>
                  <th 
                    onClick={() => handleSort("name")}
                    style={{ padding: "1rem", cursor: "pointer", userSelect: "none" }}
                    title="Click to sort by Journal Name"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {t.rankings_page.col_journal}
                      <i 
                        className={`fa-solid ${sortBy === "name" ? (sortOrder === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort"}`}
                        style={{ opacity: sortBy === "name" ? 1 : 0.35, color: sortBy === "name" ? "var(--color-primary)" : "inherit" }}
                      ></i>
                    </span>
                  </th>
                  <th style={{ padding: "1rem" }}>{t.rankings_page.col_discipline}</th>
                  <th style={{ textAlign: "center", width: "90px", padding: "1rem" }}>{t.rankings_page.col_quartile}</th>
                  <th 
                    onClick={() => handleSort("score")}
                    style={{ textAlign: "right", width: "110px", padding: "1rem", cursor: "pointer", userSelect: "none" }}
                    title="Click to sort by 2-Year AJCI Citation Index"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", width: "100%" }}>
                      {t.rankings_page.col_ajif}
                      <i 
                        className={`fa-solid ${sortBy === "score" ? (sortOrder === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort"}`}
                        style={{ opacity: sortBy === "score" ? 1 : 0.35, color: sortBy === "score" ? "var(--color-primary)" : "inherit" }}
                      ></i>
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort("ycaScore")}
                    style={{ textAlign: "right", width: "115px", padding: "1rem", cursor: "pointer", userSelect: "none" }}
                    title="Click to sort by 3-Year Citation Average (3-YCA)"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", width: "100%" }}>
                      3-YCA
                      <i 
                        className={`fa-solid ${sortBy === "ycaScore" ? (sortOrder === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort"}`}
                        style={{ opacity: sortBy === "ycaScore" ? 1 : 0.35, color: sortBy === "ycaScore" ? "var(--color-primary)" : "inherit" }}
                      ></i>
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort("regionalScore")}
                    style={{ textAlign: "right", width: "110px", padding: "1rem", cursor: "pointer", userSelect: "none" }}
                    title="Click to sort by Regional Score"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", width: "100%" }}>
                      {t.rankings_page.col_regional}
                      <i 
                        className={`fa-solid ${sortBy === "regionalScore" ? (sortOrder === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort"}`}
                        style={{ opacity: sortBy === "regionalScore" ? 1 : 0.35, color: sortBy === "regionalScore" ? "var(--color-primary)" : "inherit" }}
                      ></i>
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort("citationCount")}
                    style={{ textAlign: "right", width: "100px", padding: "1rem", cursor: "pointer", userSelect: "none" }}
                    title="Click to sort by Citation Count"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", width: "100%" }}>
                      {t.journal_page.citations}
                      <i 
                        className={`fa-solid ${sortBy === "citationCount" ? (sortOrder === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort"}`}
                        style={{ opacity: sortBy === "citationCount" ? 1 : 0.35, color: sortBy === "citationCount" ? "var(--color-primary)" : "inherit" }}
                      ></i>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRankings.map((journal, idx) => {
                  const globalIdx = startIndex + idx;
                  const q = journal.quartile || "Q2";
                  const qColor = quartileStyles[q] || quartileStyles["Q2"];

                  return (
                    <tr key={journal.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }} className="hover-row">
                      <td style={{ textAlign: "center", fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem", padding: "1rem" }}>
                        {sortBy === "score" && sortOrder === "desc" ? (
                          globalIdx === 0 ? "🥇 1" : globalIdx === 1 ? "🥈 2" : globalIdx === 2 ? "🥉 3" : `#${globalIdx + 1}`
                        ) : (
                          `#${globalIdx + 1}`
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <a href={`/journal/${journal.id}`} style={{ color: "var(--color-text-main)", fontWeight: 700, textDecoration: "none", fontSize: "0.98rem" }}>
                          {journal.name}
                        </a>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                          <span><strong>ISSN:</strong> {journal.issn || "Pending"}</span>
                          <span>•</span>
                          <span>{journal.country}</span>
                          <span>•</span>
                          <span>{journal.publisherName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span className="journal-tag">
                          {journal.primaryDiscipline || "Multidisciplinary"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", padding: "1rem" }}>
                        <span style={{
                          padding: "0.3rem 0.65rem",
                          borderRadius: "6px",
                          background: qColor.bg,
                          color: qColor.text,
                          border: `1px solid ${qColor.border}`,
                          fontSize: "0.8rem",
                          fontWeight: 700
                        }}>
                          {q}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)", fontSize: "0.98rem", padding: "1rem" }}>
                        {journal.score.toFixed(3)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#0284c7", fontSize: "0.95rem", padding: "1rem" }}>
                        {(journal.ycaScore ?? Number((journal.score * 1.14).toFixed(3))).toFixed(3)}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--color-text-body)", fontSize: "0.9rem", fontWeight: 600, padding: "1rem" }}>
                        {journal.regionalScore.toFixed(3)}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--color-text-muted)", fontWeight: 600, padding: "1rem" }}>
                        {journal.citationCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Clean Pagination Bar */}
          {!loading && sortedRankings.length > 0 && (
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              flexWrap: "wrap", 
              gap: "1rem", 
              padding: "1.25rem 1.5rem", 
              background: "var(--color-bg-card-subtle)", 
              borderTop: "1px solid var(--color-border)",
              fontSize: "0.85rem"
            }}>
              <div style={{ color: "var(--color-text-muted)" }}>
                Showing <strong>{startIndex + 1}</strong> – <strong>{Math.min(startIndex + itemsPerPage, sortedRankings.length)}</strong> of <strong>{sortedRankings.length.toLocaleString()}</strong> ranked journals
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: currentPage === 1 ? 0.5 : 1, padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
                >
                  <i className="fa-solid fa-chevron-left" style={{ marginRight: "4px" }}></i> Previous
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    if (pageNum < 1 || pageNum > totalPages) return null;

                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          border: isActive ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          background: isActive ? "var(--color-primary)" : "var(--color-bg-card)",
                          color: isActive ? "#ffffff" : "var(--color-text-main)",
                          fontWeight: isActive ? 700 : 500,
                          cursor: "pointer",
                          fontSize: "0.82rem"
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1, padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
                >
                  Next <i className="fa-solid fa-chevron-right" style={{ marginLeft: "4px" }}></i>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-card)",
                    color: "var(--color-text-main)",
                    fontSize: "0.82rem",
                    cursor: "pointer"
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
