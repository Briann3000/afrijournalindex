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

  const quartileStyles: Record<string, { bg: string; text: string }> = {
    Q1: { bg: "rgba(212,160,74,0.18)", text: "#d4a04a" },
    Q2: { bg: "rgba(37,99,235,0.18)", text: "#60a5fa" },
    Q3: { bg: "rgba(5,150,105,0.18)", text: "#34d399" },
    Q4: { bg: "rgba(107,114,128,0.18)", text: "#9ca3af" }
  };

  return (
    <div className="theme-dark">
      <Header activePage="rankings" />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "1050px" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 className="section-title">AJIF Journal Rankings & Quartiles</h1>
          <p className="section-desc">Real-time leaderboard of African research journals classified into subject quartiles (Q1–Q4) and sorted by standard AJIF impact scores.</p>
        </div>

        {/* Filter Controls */}
        <div className="glass-card" style={{ padding: "1.5rem 2rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            
            {/* Country Filter */}
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label htmlFor="countryFilter" style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>Filter by Country:</label>
              <select
                id="countryFilter"
                className="lang-selector"
                style={{ height: "40px", width: "100%" }}
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Discipline Filter */}
            <div style={{ flex: 1, minWidth: "220px" }}>
              <label htmlFor="disciplineFilter" style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>Filter by Subject Discipline:</label>
              <select
                id="disciplineFilter"
                className="lang-selector"
                style={{ height: "40px", width: "100%" }}
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value)}
              >
                <option value="">All Disciplines</option>
                {disciplines.map((disc) => (
                  <option key={disc} value={disc}>
                    {disc}
                  </option>
                ))}
              </select>
            </div>

            {/* University Search */}
            <div style={{ flex: 1.5, minWidth: "250px" }}>
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
              }}>
                <label htmlFor="instInput" style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>University Analytics Console:</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    id="instInput"
                    placeholder="e.g. University of Nairobi"
                    style={{
                      flex: 1,
                      padding: "0.5rem 1rem",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "0.9rem"
                    }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", height: "40px" }}>Search</button>
                </div>
              </form>
            </div>
          </div>

          <div style={{ marginTop: "1.2rem", fontSize: "0.85rem", color: "var(--color-text-muted)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.8rem" }}>
            <span>Featured Institution Metrics: </span>
            <a href="/institution?name=University+of+Nairobi" style={{ color: "var(--color-primary)", marginLeft: "0.5rem", textDecoration: "underline" }}>University of Nairobi</a>
            <span style={{ margin: "0 0.5rem" }}>•</span>
            <a href="/institution?name=Makerere+University" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Makerere University</a>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="glass-card" style={{ padding: "2rem", overflowX: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
              <p>Fetching rankings and quartile metrics...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--color-text-muted)" }}>
              No ranked journals found matching filter constraints.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.05)", textAlign: "left" }}>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Rank</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Journal Name</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Discipline</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)", textAlign: "center" }}>Quartile</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)", textAlign: "right" }}>AJIF Score</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)", textAlign: "right" }}>Regional</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)", textAlign: "right" }}>Citations</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((journal, idx) => {
                  const q = journal.quartile || "Q2";
                  const qColor = quartileStyles[q] || quartileStyles["Q2"];

                  return (
                    <tr key={journal.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}>
                      <td style={{ padding: "1rem", fontWeight: "bold" }}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <a href={`/journal/${journal.id}`} style={{ color: "#fff", fontWeight: 600, textDecoration: "none" }}>
                          {journal.name}
                        </a>
                        <div style={{ display: "flex", gap: "0.8rem", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                          <span>ISSN: {journal.issn || "Pending"}</span>
                          <span>•</span>
                          <span>{journal.country}</span>
                          <span>•</span>
                          <span>{journal.publisherName}</span>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span className="journal-tag" style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.75rem" }}>
                          {journal.primaryDiscipline || "Multidisciplinary"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ padding: "0.25rem 0.6rem", borderRadius: "4px", background: qColor.bg, color: qColor.text, fontSize: "0.8rem", fontWeight: "bold" }}>
                          {q}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold", color: "var(--color-primary)" }}>
                        {journal.score.toFixed(3)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", color: "#e2e2e9", fontSize: "0.9rem" }}>
                        {journal.regionalScore.toFixed(3)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", color: "var(--color-text-muted)" }}>
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
