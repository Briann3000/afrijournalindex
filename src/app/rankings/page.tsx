"use client";

import React, { useState, useEffect } from "react";
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
  regionalScore: number;
  citationCount: number;
  articleCount: number;
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankedJournal[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

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
          <h1 className="page-title">AJIF Journal Rankings &amp; Quartiles</h1>
          <p className="page-subtitle" style={{ maxWidth: "720px", margin: "0.5rem auto 0" }}>
            Real-time leaderboard of African research journals classified into subject quartiles (Q1–Q4) and ranked by verified AJIF impact indicators.
          </p>
        </div>

        {/* Filter & Analytics Card */}
        <div className="card-surface" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", alignItems: "flex-end" }}>
            
            {/* Country Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="countryFilter" className="form-label">
                <i className="fa-solid fa-earth-africa" style={{ color: "var(--color-primary)" }}></i> Filter by Country
              </label>
              <select
                id="countryFilter"
                className="form-select"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <option value="">All African Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Discipline Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="disciplineFilter" className="form-label">
                <i className="fa-solid fa-graduation-cap" style={{ color: "var(--color-primary)" }}></i> Subject Discipline
              </label>
              <select
                id="disciplineFilter"
                className="form-select"
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value)}
              >
                <option value="">All Subject Fields</option>
                {disciplines.map((disc) => (
                  <option key={disc} value={disc}>
                    {disc}
                  </option>
                ))}
              </select>
            </div>

            {/* University Search */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="instInput" className="form-label">
                <i className="fa-solid fa-building-columns" style={{ color: "var(--color-primary)" }}></i> University Search
              </label>
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement & {
                  elements: HTMLFormControlsCollection & {
                    instInput: HTMLInputElement;
                  };
                }).elements.instInput.value.trim();
                if (input) {
                  window.location.href = `/institution?name=${encodeURIComponent(input)}`;
                }
              }} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  id="instInput"
                  placeholder="e.g. University of Nairobi"
                  className="form-control"
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: "0 1rem", whiteSpace: "nowrap" }}>
                  Analyze
                </button>
              </form>
            </div>
          </div>

          <div style={{ marginTop: "1.2rem", fontSize: "0.85rem", color: "var(--color-text-muted)", borderTop: "1px solid var(--color-border)", paddingTop: "0.85rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>Quick Institutional Analytics:</span>
            <a href="/institution?name=University+of+Nairobi" style={{ color: "var(--color-primary)", fontWeight: 600 }}>University of Nairobi</a>
            <span>•</span>
            <a href="/institution?name=Makerere+University" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Makerere University</a>
            <span>•</span>
            <a href="/institution?name=University+of+Cape+Town" style={{ color: "var(--color-primary)", fontWeight: 600 }}>University of Cape Town</a>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="table-wrapper">
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
              <p>Calculating live quartiles and regional impact coefficients...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
              <h3 style={{ fontSize: "1.2rem", color: "var(--color-text-main)", marginBottom: "0.4rem" }}>No Ranked Journals Found</h3>
              <p>Try adjusting your country or subject discipline filter criteria.</p>
            </div>
          ) : (
            <table className="academic-table">
              <thead>
                <tr>
                  <th style={{ width: "70px", textAlign: "center" }}>Rank</th>
                  <th>Journal Information</th>
                  <th>Discipline</th>
                  <th style={{ textAlign: "center", width: "90px" }}>Quartile</th>
                  <th style={{ textAlign: "right", width: "110px" }}>AJIF Score</th>
                  <th style={{ textAlign: "right", width: "110px" }}>Regional</th>
                  <th style={{ textAlign: "right", width: "90px" }}>Citations</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((journal, idx) => {
                  const q = journal.quartile || "Q2";
                  const qColor = quartileStyles[q] || quartileStyles["Q2"];

                  return (
                    <tr key={journal.id}>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                        {idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : `#${idx + 1}`}
                      </td>
                      <td>
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
                      <td>
                        <span className="journal-tag">
                          {journal.primaryDiscipline || "Multidisciplinary"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
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
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)", fontSize: "1rem" }}>
                        {journal.score.toFixed(3)}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--color-text-body)", fontSize: "0.9rem", fontWeight: 600 }}>
                        {journal.regionalScore.toFixed(3)}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--color-text-muted)", fontWeight: 600 }}>
                        {journal.citationCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
