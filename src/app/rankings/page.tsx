"use client";

import React, { useEffect, useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";

interface RankedJournal {
  id: string;
  name: string;
  issn: string;
  eissn: string;
  websiteUrl: string;
  publisherName: string;
  qualityGrade: string;
  country: string;
  score: number;
  regionalScore: number;
  citationCount: number;
  articleCount: number;
}

export default function Rankings() {
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [rankings, setRankings] = useState<RankedJournal[]>([]);
  const [countryFilter, setCountryFilter] = useState<string>("");

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        let url = "/api/journals/rankings";
        if (countryFilter) {
          url += `?country=${encodeURIComponent(countryFilter)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setRankings(data.rankings);
        }
      } catch (err) {
        console.error("Error loading rankings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, [countryFilter]);

  return (
    <div className="theme-dark">
      {/* Navigation */}
      <Header activePage="rankings" />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "1000px" }}>
        <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 className="section-title">AJIF Journal Rankings</h1>
          <p className="section-desc">Real-time leaderboard of African research journals sorted by standard AJIF impact scores.</p>
        </div>

        {/* Filter controls */}
        <div className="glass-card" style={{ padding: "1.5rem 2rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label htmlFor="countryFilter" style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>Filter by Country:</label>
              <select 
                id="countryFilter" 
                className="lang-selector" 
                style={{ height: "40px", width: "100%" }}
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <option value="">All Countries</option>
                <option value="Kenya">Kenya</option>
              </select>
            </div>

            <div style={{ flex: 2, minWidth: "300px" }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = (e.target as any).elements.instInput.value.trim();
                if (input) {
                  window.location.href = `/institution?name=${encodeURIComponent(input)}`;
                }
              }}>
                <label htmlFor="instInput" style={{ display: "block", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>Search University Metrics Console:</label>
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
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="glass-card" style={{ padding: "2rem", overflowX: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
              <p>Fetching ranks data...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--color-text-muted)" }}>
              No ranked journals found matching filter constraints.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.05)", textAlign: "left" }}>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Rank</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Journal Name</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)" }}>Country</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)", textAlign: "center" }}>Grade</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)", textAlign: "right" }}>AJIF Score</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-muted)", textAlign: "right" }}>Citations</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((journal, idx) => (
                  <tr key={journal.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.2s" }}>
                    <td style={{ padding: "1rem", fontWeight: "bold" }}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <a href={`/submit/status?id=${journal.id}`} style={{ color: "#fff", fontWeight: 600 }}>{journal.name}</a>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>ISSN: {journal.issn} | Publisher: {journal.publisherName}</span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className="journal-tag" style={{ background: "rgba(255,255,255,0.05)" }}>{journal.country}</span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span style={{ padding: "0.25rem 0.5rem", borderRadius: "4px", background: "rgba(212,160,74,0.15)", color: "var(--color-primary)", fontSize: "0.8rem", fontWeight: "bold" }}>
                        {journal.qualityGrade}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: "bold", color: "var(--color-primary)" }}>
                      {journal.score.toFixed(3)}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right", color: "var(--color-text-muted)" }}>
                      {journal.citationCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
