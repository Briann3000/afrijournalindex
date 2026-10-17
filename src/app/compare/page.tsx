"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

interface CitationOrigin {
  total: number;
  regionalCount: number;
  globalCount: number;
  regionalPercentage: number;
  globalPercentage: number;
  topCitingCountries: Array<{ country: string; count: number }>;
}

interface HistoricalReport {
  year: number;
  standardScore: number;
  regionalScore: number;
  citationCount: number;
  articleCount: number;
}

interface ComparedJournal {
  id: string;
  name: string;
  issn: string | null;
  eissn: string | null;
  publisherName: string;
  country: string;
  frequency: string;
  websiteUrl: string | null;
  isIndexed: boolean;
  qualityGrade: string | null;
  indexedAt: string | null;
  disciplines: string[];
  primaryDiscipline: string;
  quartile: string;
  disciplineRank: number | null;
  totalInDiscipline: number | null;
  selfCitationRate: number;
  citationOrigin: CitationOrigin;
  latestReport: HistoricalReport | null;
  historicalReports: HistoricalReport[];
}

interface SearchCandidate {
  id: string;
  name: string;
  issn: string | null;
  eissn: string | null;
  country: string;
  publisherName: string;
  qualityGrade: string | null;
}

function CompareContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial journal IDs from query params (e.g. ?j1=xxx&j2=yyy or ?ids=xxx,yyy)
  const initialIds = React.useMemo(() => {
    const list: string[] = [];
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      idsParam.split(",").forEach(id => list.push(id.trim()));
    }
    const j1 = searchParams.get("j1");
    const j2 = searchParams.get("j2");
    const j3 = searchParams.get("j3");
    if (j1) list.push(j1.trim());
    if (j2) list.push(j2.trim());
    if (j3) list.push(j3.trim());

    return Array.from(new Set(list.filter(Boolean))).slice(0, 3);
  }, [searchParams]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [journals, setJournals] = useState<ComparedJournal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Search state for picking journals
  const [activeSearchSlot, setActiveSearchSlot] = useState<number | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [searchResults, setSearchResults] = useState<Record<number, SearchCandidate[]>>({});
  const [searchingSlot, setSearchingSlot] = useState<number | null>(null);

  const searchContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Sync URL when selectedIds change
  const updateUrl = (ids: string[]) => {
    const params = new URLSearchParams();
    if (ids.length > 0) {
      ids.forEach((id, idx) => {
        params.set(`j${idx + 1}`, id);
      });
    }
    const newUrl = `/compare${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Fetch comparison data when selectedIds change
  useEffect(() => {
    if (selectedIds.length === 0) {
      setJournals([]);
      return;
    }

    async function fetchComparison() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/journals/compare?ids=${encodeURIComponent(selectedIds.join(","))}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.journals)) {
          setJournals(data.journals);
        } else {
          setError(data.error || "Failed to load journal comparison data.");
        }
      } catch (err: any) {
        console.error("Comparison load error:", err);
        setError("Network error fetching journal metrics.");
      } finally {
        setLoading(false);
      }
    }

    fetchComparison();
    updateUrl(selectedIds);
  }, [selectedIds]);

  // Outside click handler to close search dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeSearchSlot !== null) {
        const currentRef = searchContainerRefs.current[activeSearchSlot];
        if (currentRef && !currentRef.contains(event.target as Node)) {
          setActiveSearchSlot(null);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeSearchSlot]);

  // Debounced journal search for a specific slot
  const handleSearchChange = (slotIndex: number, query: string) => {
    setSearchQueries(prev => ({ ...prev, [slotIndex]: query }));
    setActiveSearchSlot(slotIndex);

    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, [slotIndex]: [] }));
      return;
    }

    setSearchingSlot(slotIndex);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/journals/search?q=${encodeURIComponent(query.trim())}&limit=8`);
        const data = await res.json();
        if (data.success && Array.isArray(data.journals)) {
          // Filter out already selected journals
          const filtered = data.journals.filter((j: SearchCandidate) => !selectedIds.includes(j.id));
          setSearchResults(prev => ({ ...prev, [slotIndex]: filtered }));
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchingSlot(null);
      }
    }, 280);

    return () => clearTimeout(timeoutId);
  };

  const handleSelectJournal = (slotIndex: number, journal: SearchCandidate) => {
    const updated = [...selectedIds];
    if (slotIndex < updated.length) {
      updated[slotIndex] = journal.id;
    } else {
      updated.push(journal.id);
    }
    setSelectedIds(updated);
    setActiveSearchSlot(null);
    setSearchQueries(prev => ({ ...prev, [slotIndex]: "" }));
    setSearchResults(prev => ({ ...prev, [slotIndex]: [] }));
  };

  const handleRemoveJournal = (journalId: string) => {
    const updated = selectedIds.filter(id => id !== journalId);
    setSelectedIds(updated);
  };

  const handleAddSlot = () => {
    if (selectedIds.length < 3) {
      setActiveSearchSlot(selectedIds.length);
    }
  };

  // CSV Export utility
  const handleExportCsv = () => {
    if (journals.length === 0) return;

    const headers = [
      "Metric / Dimension",
      ...journals.map(j => `"${j.name.replace(/"/g, '""')}"`)
    ];

    const rows: string[][] = [
      ["Country", ...journals.map(j => `"${j.country}"`)],
      ["Publisher", ...journals.map(j => `"${j.publisherName.replace(/"/g, '""')}"`)],
      ["ISSN", ...journals.map(j => `"${j.issn || j.eissn || "N/A"}"`)],
      ["Quality Grade", ...journals.map(j => `"${j.qualityGrade || "Unrated"}"`)],
      ["Quartile", ...journals.map(j => `"${j.quartile}"`)],
      ["Primary Discipline", ...journals.map(j => `"${j.primaryDiscipline}"`)],
      ["Discipline Rank", ...journals.map(j => j.disciplineRank ? `"#${j.disciplineRank} of ${j.totalInDiscipline || "-"}"` : '"N/A"')],
      ["2-Year Impact Factor", ...journals.map(j => j.latestReport ? j.latestReport.standardScore.toFixed(3) : "0.000")],
      ["Regional African Score", ...journals.map(j => j.latestReport?.regionalScore ? j.latestReport.regionalScore.toFixed(3) : "0.000")],
      ["Regional Citations (%)", ...journals.map(j => `${j.citationOrigin.regionalPercentage}%`)],
      ["Global Citations (%)", ...journals.map(j => `${j.citationOrigin.globalPercentage}%`)],
      ["Self-Citation Rate (%)", ...journals.map(j => `${j.selfCitationRate}%`)],
      ["Indexed Articles", ...journals.map(j => j.latestReport ? String(j.latestReport.articleCount) : "0")],
      ["Total Citations", ...journals.map(j => String(j.citationOrigin.total))]
    ];

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `afrijournal_comparison_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quartileStyles: Record<string, { bg: string; text: string; border: string }> = {
    Q1: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    Q2: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
    Q3: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    Q4: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
    Unrated: { bg: "#f1f5f9", text: "#64748b", border: "#e2e8f0" }
  };

  // Collect all unique report years across the compared journals
  const allYears = Array.from(
    new Set(
      journals.flatMap(j => j.historicalReports.map(r => r.year))
    )
  ).sort((a, b) => b - a);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)" }}>
      <Header activePage="browse" />

      <main style={{ flex: 1, padding: "2.5rem 1rem", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
          <Link href="/" style={{ color: "var(--color-text-muted)" }}>Home</Link>
          <span>/</span>
          <Link href="/browse" style={{ color: "var(--color-text-muted)" }}>Journals</Link>
          <span>/</span>
          <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Compare</span>
        </div>

        {/* Header Title Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text-main)", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              Journal Comparison Engine
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.975rem", maxWidth: "700px" }}>
              Direct side-by-side scientometric, citation, and editorial evaluation across verified peer-reviewed venues. Compare up to 3 journals simultaneously.
            </p>
          </div>

          {journals.length > 0 && (
            <button
              onClick={handleExportCsv}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "var(--border-radius-sm)",
                background: "#ffffff",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-main)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          )}
        </div>

        {/* Journal Selector Slots */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[0, 1, 2].slice(0, Math.max(2, selectedIds.length + (selectedIds.length < 3 ? 1 : 0))).map((slotIndex) => {
            const journalId = selectedIds[slotIndex];
            const journal = journals.find(j => j.id === journalId);
            const isFilled = Boolean(journalId);

            return (
              <div
                key={slotIndex}
                ref={(el) => { searchContainerRefs.current[slotIndex] = el; }}
                style={{
                  background: "var(--color-bg-card)",
                  border: isFilled ? "1.5px solid var(--color-primary-light)" : "1.5px dashed var(--color-border)",
                  borderRadius: "var(--border-radius)",
                  padding: "1.25rem",
                  boxShadow: "var(--card-shadow)",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)" }}>
                    Journal Slot {slotIndex + 1}
                  </span>
                  {isFilled && (
                    <button
                      onClick={() => handleRemoveJournal(journalId)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-text-muted)",
                        cursor: "pointer",
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        fontSize: "0.875rem"
                      }}
                      title="Remove journal"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {isFilled && journal ? (
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.25rem", lineHeight: 1.35 }}>
                      {journal.name}
                    </h3>
                    <div style={{ fontSize: "0.825rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                      {journal.country} • {journal.publisherName}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      {journal.issn && (
                        <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", background: "var(--color-bg-alt)", borderRadius: "4px", color: "var(--color-text-body)" }}>
                          ISSN: {journal.issn}
                        </span>
                      )}
                      {journal.qualityGrade && (
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.5rem", background: "var(--color-primary-light)", color: "var(--color-primary)", borderRadius: "4px" }}>
                          Grade {journal.qualityGrade}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Type journal title, ISSN, or country..."
                      value={searchQueries[slotIndex] || ""}
                      onChange={(e) => handleSearchChange(slotIndex, e.target.value)}
                      onFocus={() => setActiveSearchSlot(slotIndex)}
                      style={{
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        borderRadius: "var(--border-radius-sm)",
                        border: "1px solid var(--input-border)",
                        fontSize: "0.875rem",
                        color: "var(--color-text-body)",
                        background: "var(--input-bg)",
                        outline: "none"
                      }}
                    />

                    {/* Autocomplete Dropdown */}
                    {activeSearchSlot === slotIndex && (
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 4px)",
                          left: 0,
                          right: 0,
                          background: "#ffffff",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--border-radius-sm)",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                          maxHeight: "260px",
                          overflowY: "auto",
                          zIndex: 50
                        }}
                      >
                        {searchingSlot === slotIndex ? (
                          <div style={{ padding: "0.875rem", fontSize: "0.85rem", color: "var(--color-text-muted)", textAlign: "center" }}>
                            Searching authentic repository...
                          </div>
                        ) : searchResults[slotIndex]?.length ? (
                          searchResults[slotIndex].map((candidate) => (
                            <div
                              key={candidate.id}
                              onClick={() => handleSelectJournal(slotIndex, candidate)}
                              style={{
                                padding: "0.75rem 1rem",
                                borderBottom: "1px solid var(--color-border-subtle)",
                                cursor: "pointer",
                                transition: "background 0.15s ease"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-alt)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                                {candidate.name}
                              </div>
                              <div style={{ fontSize: "0.775rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                {candidate.country} • {candidate.publisherName} {candidate.issn ? `• ISSN: ${candidate.issn}` : ""}
                              </div>
                            </div>
                          ))
                        ) : searchQueries[slotIndex]?.trim() ? (
                          <div style={{ padding: "0.875rem", fontSize: "0.85rem", color: "var(--color-text-muted)", textAlign: "center" }}>
                            No indexed journal matched &quot;{searchQueries[slotIndex]}&quot;
                          </div>
                        ) : (
                          <div style={{ padding: "0.875rem", fontSize: "0.85rem", color: "var(--color-text-muted)", textAlign: "center" }}>
                            Start typing to search journals
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
            <div style={{ display: "inline-block", width: "28px", height: "28px", border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ marginTop: "0.75rem", fontSize: "0.95rem" }}>Aggregating scientometric comparison...</div>
          </div>
        )}

        {error && (
          <div style={{ padding: "1.25rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--border-radius-sm)", color: "#991b1b", marginBottom: "2rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {/* Zero State (Prompt to pick journals) */}
        {!loading && journals.length === 0 && (
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--border-radius)", padding: "3.5rem 2rem", textAlign: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" style={{ margin: "0 auto 1rem" }}>
              <path d="M16 3h5v5" />
              <path d="M8 21H3v-5" />
              <path d="M21 3l-7.5 7.5" />
              <path d="M3 21l7.5-7.5" />
            </svg>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
              Select Journals to Compare
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.925rem", maxWidth: "540px", margin: "0 auto 1.5rem" }}>
              Search and pick two or three journals above to inspect side-by-side citation counts, regional African impact, discipline rankings, and historical trends.
            </p>
          </div>
        )}

        {/* Comparison Matrix Table */}
        {!loading && journals.length > 0 && (
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--border-radius)", overflow: "hidden", boxShadow: "var(--card-shadow)", marginBottom: "3rem" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--color-bg-alt)", borderBottom: "2px solid var(--color-border)" }}>
                    <th style={{ padding: "1.25rem 1.5rem", width: "240px", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
                      Evaluation Dimension
                    </th>
                    {journals.map((j) => (
                      <th key={j.id} style={{ padding: "1.25rem 1.5rem", minWidth: "260px" }}>
                        <Link href={`/journal/${j.id}`} style={{ textDecoration: "none" }}>
                          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", lineHeight: 1.35, marginBottom: "0.25rem" }}>
                            {j.name}
                          </div>
                        </Link>
                        <div style={{ fontSize: "0.825rem", color: "var(--color-text-muted)" }}>
                          {j.country}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Category: Official Scientometrics */}
                  <tr style={{ background: "#fdf8ee", borderTop: "1px solid #fed7aa" }}>
                    <td colSpan={journals.length + 1} style={{ padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9a3412" }}>
                      Scientometric Indicators
                    </td>
                  </tr>

                  {/* 2-Year Impact Factor */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      2-Year Impact Factor
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem" }}>
                        <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)", letterSpacing: "-0.02em" }}>
                          {j.latestReport ? j.latestReport.standardScore.toFixed(3) : "0.000"}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          Reporting Year {j.latestReport?.year || 2024}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Regional African Impact Score */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Regional Impact Score
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem" }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                          {j.latestReport?.regionalScore ? j.latestReport.regionalScore.toFixed(3) : "0.000"}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          Weighted by Pan-African citations
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Quartile */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Quartile Ranking
                    </td>
                    {journals.map((j) => {
                      const qStyle = quartileStyles[j.quartile] || quartileStyles.Unrated;
                      return (
                        <td key={j.id} style={{ padding: "1rem 1.5rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "0.25rem 0.65rem",
                              borderRadius: "4px",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              background: qStyle.bg,
                              color: qStyle.text,
                              border: `1px solid ${qStyle.border}`
                            }}
                          >
                            {j.quartile}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Discipline & Discipline Rank */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Discipline & Rank
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "var(--color-text-body)" }}>
                        <div style={{ fontWeight: 600 }}>{j.primaryDiscipline}</div>
                        <div style={{ fontSize: "0.785rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          {j.disciplineRank ? `Rank #${j.disciplineRank} of ${j.totalInDiscipline || "-"}` : "Rank unassigned"}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Quality Grade */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Editorial Quality Grade
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            background: "var(--color-primary-light)",
                            color: "var(--color-primary)",
                            fontSize: "0.85rem"
                          }}
                        >
                          Grade {j.qualityGrade || "Pending"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Category: Citation Provenance */}
                  <tr style={{ background: "#fdf8ee", borderTop: "1px solid #fed7aa" }}>
                    <td colSpan={journals.length + 1} style={{ padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9a3412" }}>
                      Citation Provenance & Integrity
                    </td>
                  </tr>

                  {/* Regional vs Global Split */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Citation Origin Split
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem" }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                          {j.citationOrigin.regionalPercentage}% Regional / {j.citationOrigin.globalPercentage}% International
                        </div>
                        {/* Progress Bar */}
                        <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden", display: "flex", width: "100%", maxWidth: "180px" }}>
                          <div style={{ width: `${j.citationOrigin.regionalPercentage}%`, background: "var(--color-primary)" }} />
                          <div style={{ width: `${j.citationOrigin.globalPercentage}%`, background: "#3b82f6" }} />
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Self-Citation Rate */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Self-Citation Rate
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 600, color: j.selfCitationRate > 25 ? "#b91c1c" : "var(--color-text-main)" }}>
                          {j.selfCitationRate}%
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          {j.selfCitationRate > 25 ? "Elevated concentration" : "Healthy distribution (<20%)"}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Top Citing Countries */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Top Citing Countries
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem", fontSize: "0.85rem", color: "var(--color-text-body)" }}>
                        {j.citationOrigin.topCitingCountries.map((c, i) => (
                          <div key={i} style={{ marginBottom: "2px" }}>
                            {c.country} ({c.count})
                          </div>
                        ))}
                      </td>
                    ))}
                  </tr>

                  {/* Category: Publishing Scale */}
                  <tr style={{ background: "#fdf8ee", borderTop: "1px solid #fed7aa" }}>
                    <td colSpan={journals.length + 1} style={{ padding: "0.75rem 1.5rem", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9a3412" }}>
                      Publishing Scope & Activity
                    </td>
                  </tr>

                  {/* Indexed Articles & Total Citations */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Articles & Citations
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem", fontSize: "0.875rem" }}>
                        <div><strong>{j.latestReport?.articleCount || 0}</strong> articles published (latest reporting year)</div>
                        <div style={{ color: "var(--color-text-muted)", marginTop: "2px" }}><strong>{j.citationOrigin.total}</strong> verified citations received</div>
                      </td>
                    ))}
                  </tr>

                  {/* Publisher & Frequency */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Publisher & Frequency
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "var(--color-text-body)" }}>
                        <div>{j.publisherName}</div>
                        <div style={{ color: "var(--color-text-muted)", fontSize: "0.785rem" }}>{j.frequency}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Website & Profile Link */}
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-main)" }}>
                      Links & Dossier
                    </td>
                    {journals.map((j) => (
                      <td key={j.id} style={{ padding: "1rem 1.5rem", fontSize: "0.875rem" }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                          <Link
                            href={`/journal/${j.id}`}
                            style={{
                              color: "var(--color-primary)",
                              fontWeight: 600,
                              textDecoration: "underline"
                            }}
                          >
                            Full Journal Dossier →
                          </Link>
                          {j.websiteUrl && (
                            <a
                              href={j.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}
                            >
                              Official Website ↗
                            </a>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Historical Performance Matrix */}
            {allYears.length > 0 && (
              <div style={{ padding: "1.5rem", borderTop: "2px solid var(--color-border)", background: "#fafafa" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "1rem" }}>
                  Historical 2-Year Impact Factor Trajectory
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <th style={{ padding: "0.5rem 0.75rem", color: "var(--color-text-muted)" }}>Year</th>
                        {journals.map(j => (
                          <th key={j.id} style={{ padding: "0.5rem 0.75rem", color: "var(--color-text-main)", fontWeight: 600 }}>
                            {j.name} (Impact Factor)
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allYears.map(year => (
                        <tr key={year} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                          <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "var(--color-text-body)" }}>{year}</td>
                          {journals.map(j => {
                            const report = j.historicalReports.find(r => r.year === year);
                            return (
                              <td key={j.id} style={{ padding: "0.5rem 0.75rem", color: report ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: report ? 700 : 400 }}>
                                {report ? report.standardScore.toFixed(3) : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#64748b" }}>
        Loading Journal Comparison...
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
