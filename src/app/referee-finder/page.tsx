"use client";

import React, { useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

interface RecentWork {
  title: string;
  venue: string;
  year: number;
  doi: string | null;
  url: string | null;
}

interface RefereeCandidate {
  id: string;
  name: string;
  institution: string;
  country: string;
  countryCode: string;
  isAfrican: boolean;
  orcid: string | null;
  publicationCount: number;
  recentWorks: RecentWork[];
}

function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const code = countryCode.toUpperCase();
  try {
    const codePoints = [...code].map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌍";
  }
}

export default function RefereeFinderPage() {
  const { t } = useLang();

  // Form State
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [excludedAuthors, setExcludedAuthors] = useState("");
  const [region, setRegion] = useState<"african" | "all">("african");
  const [yearWindow, setYearWindow] = useState<3 | 5>(3);

  // Results & UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<RefereeCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !abstract.trim()) {
      setError("Please provide a manuscript title or abstract to extract topic concepts.");
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(false);

    try {
      const excludedList = excludedAuthors
        .split(/[,\n]/)
        .map(a => a.trim())
        .filter(Boolean);

      const res = await fetch("/api/referee-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          abstract: abstract.trim(),
          excludedAuthors: excludedList,
          region,
          yearWindow
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to search for referees.");
      }

      setCandidates(data.candidates || []);
      setKeywords(data.queryKeywords || []);
      setSearched(true);
      // Auto-expand the first candidate by default
      if (data.candidates && data.candidates.length > 0) {
        setExpandedIds({ [data.candidates[0].id]: true });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during reviewer lookup.");
    } finally {
      setLoading(false);
    }
  };

  const copyReviewerDetails = (candidate: RefereeCandidate) => {
    const worksText = candidate.recentWorks
      .map(w => `  • "${w.title}" — ${w.venue} (${w.year})${w.doi ? ` [DOI: ${w.doi}]` : ""}`)
      .join("\n");

    const text = `Referee Recommendation:
Name: ${candidate.name}
Institution: ${candidate.institution} (${candidate.country})
${candidate.orcid ? `ORCID: https://orcid.org/${candidate.orcid}\n` : ""}Recent Publications in Topic:
${worksText || "  • Verified peer-reviewed works indexed in academic bibliometrics"}
Source: AfriJournal Index Referee Discovery`;

    navigator.clipboard.writeText(text);
    setCopiedId(candidate.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const exportCsv = () => {
    if (candidates.length === 0) return;

    const headers = ["Name", "Institution", "Country", "ORCID", "Regional Focus", "Topic Publications Count", "Sample Publication Title", "DOI"];
    const rows = candidates.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.institution.replace(/"/g, '""')}"`,
      `"${c.country.replace(/"/g, '""')}"`,
      c.orcid ? `"${c.orcid}"` : `""`,
      c.isAfrican ? `"African Institution"` : `"International"`,
      c.publicationCount,
      c.recentWorks[0] ? `"${c.recentWorks[0].title.replace(/"/g, '""')}"` : `""`,
      c.recentWorks[0]?.doi ? `"${c.recentWorks[0].doi}"` : `""`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `referee_shortlist_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      <Header activePage="referee-finder" />

      <main style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        
        {/* Compact Header */}
        <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "0.45rem", 
              padding: "0.25rem 0.75rem", 
              borderRadius: "20px", 
              background: "var(--color-primary-light)", 
              color: "var(--color-primary)", 
              fontSize: "0.78rem", 
              fontWeight: 700,
              marginBottom: "0.5rem" 
            }}>
              <i className="fa-solid fa-user-check"></i>
              <span>Editorial Workspace</span>
            </div>
            <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.4rem 0", lineHeight: 1.2 }}>
              African Referee &amp; Reviewer Finder
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", margin: 0, maxWidth: "680px" }}>
              Identify active peer reviewers across African and international universities with automated conflict-of-interest exclusion.
            </p>
          </div>

          {searched && candidates.length > 0 && (
            <button
              type="button"
              onClick={exportCsv}
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", padding: "0.45rem 1rem" }}
            >
              <i className="fa-solid fa-file-csv" style={{ color: "var(--color-primary)" }}></i>
              <span>Export Shortlist (CSV)</span>
            </button>
          )}
        </div>

        {/* Split-Screen Workspace Grid */}
        <div 
          className="referee-split-grid"
          style={{ 
            display: "grid", 
            gridTemplateColumns: "minmax(340px, 420px) 1fr", 
            gap: "2rem", 
            alignItems: "start" 
          }}
        >
          {/* ================= LEFT COLUMN: STICKY FORM ================= */}
          <div style={{ position: "sticky", top: "1.5rem" }}>
            <div style={{ 
              background: "var(--color-bg-card)", 
              border: "1px solid var(--color-border)", 
              borderRadius: "14px", 
              padding: "1.75rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)"
            }}>
              <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <i className="fa-solid fa-file-lines" style={{ color: "var(--color-primary)", fontSize: "1rem" }}></i>
                <span>Manuscript Details</span>
              </h3>

              <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                {/* Title */}
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                    Manuscript Title <span style={{ color: "var(--color-primary)" }}>*</span>
                  </label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Solid waste management and municipal policy in Nairobi"
                    style={{ 
                      width: "100%", 
                      padding: "0.7rem 0.85rem", 
                      borderRadius: "8px", 
                      border: "1px solid var(--color-border)", 
                      background: "var(--color-bg-card-subtle)", 
                      color: "var(--color-text-main)",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>

                {/* Abstract */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <label style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                      Abstract
                    </label>
                    <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                      {abstract.trim() ? `${abstract.trim().split(/\s+/).length} words` : "Recommended"}
                    </span>
                  </div>
                  <textarea 
                    rows={4}
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    placeholder="Paste abstract to extract domain keywords and specialized concepts..."
                    style={{ 
                      width: "100%", 
                      padding: "0.7rem 0.85rem", 
                      borderRadius: "8px", 
                      border: "1px solid var(--color-border)", 
                      background: "var(--color-bg-card-subtle)", 
                      color: "var(--color-text-main)",
                      fontSize: "0.86rem",
                      lineHeight: 1.45,
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* Exclude Authors */}
                <div>
                  <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.2rem" }}>
                    Exclude Authors (Conflict of Interest)
                  </label>
                  <span style={{ display: "block", fontSize: "0.74rem", color: "var(--color-text-muted)", marginBottom: "0.35rem" }}>
                    Submitting authors and their collaborators are filtered out.
                  </span>
                  <input 
                    type="text"
                    value={excludedAuthors}
                    onChange={(e) => setExcludedAuthors(e.target.value)}
                    placeholder="e.g., Sarah Ochieng, John Kamau"
                    style={{ 
                      width: "100%", 
                      padding: "0.65rem 0.85rem", 
                      borderRadius: "8px", 
                      border: "1px solid var(--color-border)", 
                      background: "var(--color-bg-card-subtle)", 
                      color: "var(--color-text-main)",
                      fontSize: "0.86rem"
                    }}
                  />
                </div>

                {/* Scope & Recency Window */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", paddingTop: "0.4rem", borderTop: "1px solid var(--color-border)" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                      Institutional Scope
                    </label>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={() => setRegion("african")}
                        style={{
                          flex: 1,
                          padding: "0.45rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: region === "african" ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          background: region === "african" ? "var(--color-primary-light)" : "var(--color-bg-card-subtle)",
                          color: region === "african" ? "var(--color-primary)" : "var(--color-text-main)"
                        }}
                      >
                        <i className="fa-solid fa-earth-africa" style={{ marginRight: "4px" }}></i>
                        African First
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegion("all")}
                        style={{
                          flex: 1,
                          padding: "0.45rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: region === "all" ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          background: region === "all" ? "var(--color-primary-light)" : "var(--color-bg-card-subtle)",
                          color: region === "all" ? "var(--color-primary)" : "var(--color-text-main)"
                        }}
                      >
                        <i className="fa-solid fa-globe" style={{ marginRight: "4px" }}></i>
                        Global
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                      Publication Recency
                    </label>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={() => setYearWindow(3)}
                        style={{
                          flex: 1,
                          padding: "0.45rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: yearWindow === 3 ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          background: yearWindow === 3 ? "var(--color-primary-light)" : "var(--color-bg-card-subtle)",
                          color: yearWindow === 3 ? "var(--color-primary)" : "var(--color-text-main)"
                        }}
                      >
                        Last 3 Years
                      </button>
                      <button
                        type="button"
                        onClick={() => setYearWindow(5)}
                        style={{
                          flex: 1,
                          padding: "0.45rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: yearWindow === 5 ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          background: yearWindow === 5 ? "var(--color-primary-light)" : "var(--color-bg-card-subtle)",
                          color: yearWindow === 5 ? "var(--color-primary)" : "var(--color-text-main)"
                        }}
                      >
                        Last 5 Years
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Box */}
                {error && (
                  <div style={{ 
                    padding: "0.6rem 0.8rem", 
                    borderRadius: "6px", 
                    background: "rgba(239, 68, 68, 0.1)", 
                    border: "1px solid rgba(239, 68, 68, 0.3)", 
                    color: "#ef4444", 
                    fontSize: "0.8rem" 
                  }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "6px" }}></i>
                    {error}
                  </div>
                )}

                {/* Submit Action */}
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ 
                    width: "100%", 
                    padding: "0.75rem 1rem", 
                    fontSize: "0.92rem", 
                    fontWeight: 700, 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "0.5rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: "0.5rem"
                  }}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Searching Active Reviewers...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-magnifying-glass"></i>
                      <span>Find Independent Referees</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: RESULTS & EXPLAINER ================= */}
          <div>
            {/* STATE 1: INITIAL ONBOARDING EXPLAINER */}
            {!searched && !loading && (
              <div style={{ 
                background: "var(--color-bg-card)", 
                border: "1px solid var(--color-border)", 
                borderRadius: "14px", 
                padding: "2.5rem 2rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)"
              }}>
                <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto 2.5rem auto" }}>
                  <div style={{ 
                    width: "56px", 
                    height: "56px", 
                    borderRadius: "50%", 
                    background: "var(--color-primary-light)", 
                    color: "var(--color-primary)", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    marginBottom: "1rem" 
                  }}>
                    <i className="fa-solid fa-user-check"></i>
                  </div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.5rem 0" }}>
                    How the Referee Finder Works
                  </h2>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                    Designed for editors and conference organizers to discover qualified, independent peer reviewers who have actively published on the topic in recent years.
                  </p>
                </div>

                {/* 3 Step Walkthrough Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                  <div style={{ 
                    padding: "1.25rem", 
                    background: "var(--color-bg-card-subtle)", 
                    border: "1px solid var(--color-border)", 
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "50%", 
                        background: "var(--color-primary)", 
                        color: "#ffffff", 
                        fontSize: "0.78rem", 
                        fontWeight: 700, 
                        display: "inline-flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}>1</span>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                        Enter Details
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.45 }}>
                      Paste your manuscript title and abstract into the left console to extract core subject taxonomy and domain keywords.
                    </p>
                  </div>

                  <div style={{ 
                    padding: "1.25rem", 
                    background: "var(--color-bg-card-subtle)", 
                    border: "1px solid var(--color-border)", 
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "50%", 
                        background: "var(--color-primary)", 
                        color: "#ffffff", 
                        fontSize: "0.78rem", 
                        fontWeight: 700, 
                        display: "inline-flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}>2</span>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                        COI Protection
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.45 }}>
                      List the manuscript’s authors. Our engine checks co-authorship networks to ensure no candidate has recently published with them.
                    </p>
                  </div>

                  <div style={{ 
                    padding: "1.25rem", 
                    background: "var(--color-bg-card-subtle)", 
                    border: "1px solid var(--color-border)", 
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ 
                        width: "24px", 
                        height: "24px", 
                        borderRadius: "50%", 
                        background: "var(--color-primary)", 
                        color: "#ffffff", 
                        fontSize: "0.78rem", 
                        fontWeight: 700, 
                        display: "inline-flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}>3</span>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                        Verify &amp; Invite
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.45 }}>
                      Receive ranked scholars with verified ORCIDs, active publication timelines, university flags, and one-click clipboard copying.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2: LOADING SKELETON */}
            {loading && (
              <div style={{ 
                background: "var(--color-bg-card)", 
                border: "1px solid var(--color-border)", 
                borderRadius: "14px", 
                padding: "3.5rem 2rem",
                textAlign: "center"
              }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2.2rem", color: "var(--color-primary)", marginBottom: "1.25rem" }}></i>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.5rem 0" }}>
                  Querying Academic Bibliometrics...
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", maxWidth: "480px", margin: "0 auto" }}>
                  Extracting concept keywords, querying authentic 2021–2026 literature, and filtering out direct co-authorship conflicts.
                </p>
              </div>
            )}

            {/* STATE 3: SEARCH RESULTS */}
            {searched && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                
                {/* Result Header Bar */}
                <div style={{ 
                  background: "var(--color-bg-card)", 
                  border: "1px solid var(--color-border)", 
                  borderRadius: "10px", 
                  padding: "0.85rem 1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem"
                }}>
                  <div>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                      Found {candidates.length} Independent Reviewer Candidates
                    </span>
                    {keywords.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.3rem" }}>
                        {keywords.map((kw, i) => (
                          <span key={i} style={{ 
                            fontSize: "0.72rem", 
                            padding: "0.15rem 0.5rem", 
                            borderRadius: "12px", 
                            background: "var(--color-bg-card-subtle)", 
                            border: "1px solid var(--color-border)", 
                            color: "var(--color-text-muted)" 
                          }}>
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    Sorted by Subject Relevance &amp; Output
                  </span>
                </div>

                {/* Candidate Cards */}
                {candidates.length === 0 ? (
                  <div style={{ 
                    background: "var(--color-bg-card)", 
                    border: "1px solid var(--color-border)", 
                    borderRadius: "12px", 
                    padding: "3rem 1.5rem", 
                    textAlign: "center" 
                  }}>
                    <i className="fa-solid fa-user-slash" style={{ fontSize: "2rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
                    <h4 style={{ color: "var(--color-text-main)", marginBottom: "0.5rem" }}>No Reviewers Found Matching These Terms</h4>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", maxWidth: "520px", margin: "0 auto" }}>
                      Try adding more descriptive keywords in the abstract or changing the scope to Pan-African &amp; Global.
                    </p>
                  </div>
                ) : (
                  candidates.map((c) => {
                    const isExpanded = !!expandedIds[c.id];
                    const flag = getCountryFlag(c.countryCode);
                    const mostRecentYear = c.recentWorks[0]?.year;

                    return (
                      <div 
                        key={c.id}
                        style={{ 
                          background: "var(--color-bg-card)", 
                          border: "1px solid var(--color-border)", 
                          borderRadius: "12px", 
                          padding: "1.1rem 1.35rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.65rem",
                          transition: "border-color 0.15s ease",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.03)"
                        }}
                      >
                        {/* Top Row: Name, Activity Badge, ORCID, and Copy Action */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.6rem" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                              <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                                {c.name}
                              </h4>

                              {/* Activity Timeline Badge */}
                              {mostRecentYear && (
                                <span style={{ 
                                  fontSize: "0.72rem", 
                                  padding: "0.15rem 0.5rem", 
                                  borderRadius: "10px", 
                                  background: "rgba(245, 158, 11, 0.12)", 
                                  color: "var(--color-primary)", 
                                  fontWeight: 700 
                                }}>
                                  Active {mostRecentYear}
                                </span>
                              )}

                              {/* Verified ORCID Badge */}
                              {c.orcid && (
                                <a 
                                  href={`https://orcid.org/${c.orcid}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  title={`Verified ORCID: ${c.orcid}`}
                                  style={{ 
                                    display: "inline-flex", 
                                    alignItems: "center", 
                                    gap: "0.25rem", 
                                    fontSize: "0.7rem", 
                                    color: "#a6ce39", 
                                    background: "rgba(166, 206, 57, 0.1)", 
                                    border: "1px solid rgba(166, 206, 57, 0.3)", 
                                    padding: "0.12rem 0.45rem", 
                                    borderRadius: "10px",
                                    textDecoration: "none",
                                    fontWeight: 600
                                  }}
                                >
                                  <i className="fa-brands fa-orcid"></i>
                                  <span>{c.orcid}</span>
                                </a>
                              )}
                            </div>

                            {/* Affiliation with Country Flag */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginTop: "0.3rem", fontSize: "0.82rem", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                                <span style={{ fontSize: "1.05rem", lineHeight: 1 }} title={c.country}>{flag}</span>
                                <strong style={{ color: "var(--color-text-main)" }}>{c.institution}</strong>
                                <span>({c.country})</span>
                              </span>
                              <span>•</span>
                              <span style={{ color: "#10b981", fontSize: "0.76rem", fontWeight: 600 }}>
                                <i className="fa-solid fa-check-circle" style={{ marginRight: "0.25rem" }}></i>
                                Independent
                              </span>
                            </div>
                          </div>

                          {/* Quick Copy Button */}
                          <button
                            type="button"
                            onClick={() => copyReviewerDetails(c)}
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              fontSize: "0.76rem", 
                              padding: "0.3rem 0.75rem", 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: "0.35rem",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <i className={`fa-solid ${copiedId === c.id ? "fa-check" : "fa-copy"}`} style={{ color: copiedId === c.id ? "#10b981" : "var(--color-primary)" }}></i>
                            <span>{copiedId === c.id ? "Copied" : "Copy Details"}</span>
                          </button>
                        </div>

                        {/* Collapsible Publications Accordion Trigger */}
                        {c.recentWorks.length > 0 && (
                          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => toggleExpanded(c.id)}
                              style={{ 
                                background: "none", 
                                border: "none", 
                                padding: "0.2rem 0", 
                                cursor: "pointer", 
                                fontSize: "0.76rem", 
                                fontWeight: 700, 
                                color: "var(--color-primary)", 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "0.35rem" 
                              }}
                            >
                              <span>
                                {isExpanded 
                                  ? `Hide ${c.recentWorks.length} Relevant Publications` 
                                  : `View ${c.recentWorks.length} Relevant Publications in Topic`}
                              </span>
                              <i className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ fontSize: "0.68rem" }}></i>
                            </button>

                            {/* Collapsible Content */}
                            {isExpanded && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.45rem" }}>
                                {c.recentWorks.map((work, idx) => (
                                  <div key={idx} style={{ fontSize: "0.8rem", display: "flex", alignItems: "flex-start", gap: "0.4rem", lineHeight: 1.4 }}>
                                    <i className="fa-solid fa-angle-right" style={{ color: "var(--color-primary)", marginTop: "3px", fontSize: "0.65rem" }}></i>
                                    <div>
                                      <span style={{ color: "var(--color-text-main)", fontWeight: 500 }}>
                                        {work.title}
                                      </span>
                                      <span style={{ color: "var(--color-text-muted)", marginLeft: "0.35rem" }}>
                                        — {work.venue} ({work.year})
                                      </span>
                                      {work.doi && (
                                        <a 
                                          href={work.url || `https://doi.org/${work.doi}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          style={{ color: "var(--color-primary)", marginLeft: "0.45rem", textDecoration: "none", fontSize: "0.74rem" }}
                                        >
                                          [DOI: {work.doi}]
                                          <i className="fa-solid fa-up-right-from-square" style={{ fontSize: "0.58rem", marginLeft: "2px" }}></i>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
