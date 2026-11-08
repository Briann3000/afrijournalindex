"use client";

import React, { useState, useMemo } from "react";
import Header from "../Header";
import Footer from "../Footer";
import topVenuesData from "../../data/top_international_venues.json";

interface VenueItem {
  name: string;
  paperCount: number;
  scholarCount: number;
  topScholars: string;
  samplePapers: string;
}

export default function WhereAfricaPublishesPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const allVenues = topVenuesData as VenueItem[];

  const filteredVenues = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allVenues;
    return allVenues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.topScholars && v.topScholars.toLowerCase().includes(q))
    );
  }, [allVenues, search]);

  const totalPages = Math.ceil(filteredVenues.length / pageSize) || 1;
  const paginatedVenues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVenues.slice(start, start + pageSize);
  }, [filteredVenues, currentPage, pageSize]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, padding: "3rem 1.5rem", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        
        {/* Page Hero Header */}
        <div style={{ marginBottom: "2.5rem", textAlign: "left" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(212, 160, 74, 0.1)", border: "1px solid rgba(212, 160, 74, 0.3)", padding: "0.35rem 0.9rem", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "1rem" }}>
            <i className="fa-solid fa-earth-africa"></i>
            Continental Scientometrics &amp; Publication Matrix
          </div>
          <h1 style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.75rem)", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.8rem", lineHeight: 1.25 }}>
            Where Does Africa Publish?
          </h1>
          <p style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)", color: "var(--color-text-muted)", maxWidth: "880px", lineHeight: 1.7, margin: 0 }}>
            A comprehensive bibliometric audit analyzing <strong>508,578 lifetime publications</strong> from <strong>2,321 verified African scholars</strong> across 40 sovereign nations, tracking global publication destinations and continental research sovereignty.
          </p>
        </div>

        {/* Scientometrics KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
          <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
              Career Works Analyzed
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--color-primary)", margin: "0.3rem 0" }}>
              508,578
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              Peer-reviewed works across 2,321 African scholars
            </div>
          </div>

          <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
              Indexed African Journals
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--color-primary)", margin: "0.3rem 0" }}>
              1,908
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              Sovereign African publications indexed in AfriJournal Index
            </div>
          </div>

          <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
              Continental Articles Ingested
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--color-primary)", margin: "0.3rem 0" }}>
              746,070+
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              2006–2026 backfiles with DOIs &amp; structured abstracts
            </div>
          </div>

          <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
              Preserved African Citations
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--color-primary)", margin: "0.3rem 0" }}>
              17,488
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              Direct verified links between scholars &amp; African journals
            </div>
          </div>
        </div>

        {/* Narrative Context Card */}
        <div className="card-surface" style={{ padding: "1.75rem 2rem", borderRadius: "14px", border: "1px solid var(--color-border)", marginBottom: "2.5rem", background: "var(--color-bg-card)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.8rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-scale-balanced" style={{ color: "var(--color-primary)" }}></i>
            The Two Realities of African Scholarly Publishing
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", fontSize: "0.92rem", color: "var(--color-text-body)", lineHeight: 1.75 }}>
            <div>
              <strong style={{ color: "var(--color-text-main)", display: "block", marginBottom: "0.4rem" }}>
                1. Global Consortia &amp; High-Volume Open Access
              </strong>
              African scholars frequently publish in large international open-access mega-journals (such as <em>PLOS ONE</em> with 7,192 African papers, and <em>Scientific Reports</em>) and physics consortia (such as <em>Journal of High Energy Physics</em> with 10,547 papers). These venues provide high global visibility and are powered by international research partnerships (e.g. CERN/ATLAS).
            </div>
            <div>
              <strong style={{ color: "var(--color-text-main)", display: "block", marginBottom: "0.4rem" }}>
                2. Continental Sovereignty &amp; Local Indexation
              </strong>
              While international venues capture high volume, sovereign African journals address critical local development challenges (tropical agriculture, regional public health, African constitutional law). AfriJournal Index provides unbiased, transparent indexing for 1,907 African journals so regional research receives certified citation recognition.
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              Top International Publication Venues
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "2px 0 0" }}>
              Showing {filteredVenues.length} cataloged global venues ranked by African author paper volume
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: "380px", position: "relative" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-primary)", fontSize: "0.85rem" }}></i>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Filter by venue title or scholar..."
              className="form-control"
              style={{ width: "100%", height: "42px", padding: "0 1rem 0 2.5rem", borderRadius: "10px", fontSize: "0.9rem" }}
            />
          </div>
        </div>

        {/* Venues Table */}
        <div className="card-surface" style={{ borderRadius: "14px", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-alt)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--color-text-main)", width: "70px" }}>Rank</th>
                  <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--color-text-main)" }}>Publication Venue</th>
                  <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--color-text-main)", textAlign: "center" }}>African Papers</th>
                  <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--color-text-main)", textAlign: "center" }}>Contributing Scholars</th>
                  <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--color-text-main)" }}>Leading African Contributors</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVenues.length > 0 ? (
                  paginatedVenues.map((v, idx) => {
                    const globalRank = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.15s ease" }} className="hover-row">
                        <td style={{ padding: "1rem 1.25rem", fontWeight: 800, color: globalRank <= 3 ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                          #{globalRank}
                        </td>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                            {v.name}
                          </div>
                          <a
                            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(v.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.75rem", color: "#3b82f6", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}
                          >
                            <span>Google Scholar Search</span>
                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem" }}></i>
                          </a>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", textAlign: "center", fontWeight: 800, color: "var(--color-text-main)" }}>
                          <span style={{ background: "rgba(2, 132, 199, 0.08)", color: "#0284c7", padding: "0.25rem 0.65rem", borderRadius: "6px", fontSize: "0.85rem" }}>
                            {v.paperCount.toLocaleString()}
                          </span>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", textAlign: "center", fontWeight: 700, color: "var(--color-text-muted)" }}>
                          {v.scholarCount.toLocaleString()}
                        </td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.82rem", color: "var(--color-text-body)", minWidth: "260px", maxWidth: "420px", lineHeight: 1.5 }}>
                          <div style={{ wordBreak: "break-word" }} title={v.topScholars}>
                            {v.topScholars || "African Research Collaborators"}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                      No publication venues match &quot;{search}&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.6rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="btn btn-secondary btn-sm"
              style={{
                opacity: currentPage <= 1 ? 0.45 : 1,
                cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                padding: "0.45rem 0.95rem",
                borderRadius: "8px",
                fontWeight: 600
              }}
            >
              <i className="fa-solid fa-chevron-left" style={{ fontSize: "0.75rem", marginRight: "6px" }}></i>
              Previous
            </button>

            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", padding: "0 1rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", height: "36px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>Page</span>
              <span style={{ color: "var(--color-primary)" }}>{currentPage}</span>
              <span>of {totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="btn btn-secondary btn-sm"
              style={{
                opacity: currentPage >= totalPages ? 0.45 : 1,
                cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                padding: "0.45rem 0.95rem",
                borderRadius: "8px",
                fontWeight: 600
              }}
            >
              Next
              <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.75rem", marginLeft: "6px" }}></i>
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
