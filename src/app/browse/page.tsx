"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";
import { ALL_COUNTRY_NAMES, COUNTRY_META_MAP } from "../data/african-countries";

interface Journal {
  id?: string;
  name: string;
  issn: string;
  eissn?: string;
  publisher: string;
  country: string;
  frequency: string;
  disciplines: string[];
  primaryDiscipline: string;
  quartile?: "Q1" | "Q2" | "Q3" | "Q4";
  score?: number;
  qualityGrade?: string;
  isIndexed?: boolean;
  link: string;
}

const seedJournals: Journal[] = [
  {
    id: "arjess",
    name: "African Research Journal of Education and Social Sciences (ARJESS)",
    issn: "2312-0134",
    publisher: "Kenya Projects Organization (KENPRO)",
    country: "Kenya",
    frequency: "Quarterly",
    disciplines: ["Education", "Social Sciences"],
    primaryDiscipline: "Education",
    quartile: "Q1",
    score: 3.42,
    qualityGrade: "A",
    isIndexed: true,
    link: "https://arjess.org"
  },
  {
    id: "jmba",
    name: "Journal of Management and Business Administration (JMBA)",
    issn: "2519-0016",
    publisher: "Kenya Projects Organization (KENPRO)",
    country: "Kenya",
    frequency: "Quarterly",
    disciplines: ["Management", "Business"],
    primaryDiscipline: "Management",
    quartile: "Q2",
    score: 2.15,
    qualityGrade: "A",
    isIndexed: true,
    link: ""
  },
  {
    id: "ijehs",
    name: "International Journal of Environmental and Health Sciences (IJEHS)",
    issn: "Pending",
    publisher: "Kenya Projects Organization (KENPRO)",
    country: "Kenya",
    frequency: "Semi-Annually",
    disciplines: ["Environment", "Health Sciences"],
    primaryDiscipline: "Environment",
    quartile: "Q2",
    score: 1.85,
    qualityGrade: "B",
    isIndexed: true,
    link: ""
  },
  {
    id: "jede",
    name: "Journal of Education in Developing Economies (JEDE)",
    issn: "Pending",
    publisher: "Kenya Projects Organization (KENPRO)",
    country: "Kenya",
    frequency: "Semi-Annually",
    disciplines: ["Education"],
    primaryDiscipline: "Education",
    quartile: "Q3",
    score: 1.20,
    qualityGrade: "B",
    isIndexed: true,
    link: ""
  },
  {
    id: "ajrs",
    name: "African Journal of Religious Studies (AJRS)",
    issn: "Pending",
    publisher: "Writers Bureau Centre / KENPRO",
    country: "Kenya",
    frequency: "Annually",
    disciplines: ["Social Sciences"],
    primaryDiscipline: "Social Sciences",
    quartile: "Q3",
    score: 0.95,
    qualityGrade: "B",
    isIndexed: true,
    link: ""
  }
];

function getDisciplines(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const disciplines: string[] = [];
  if (text.includes("education") || text.includes("teaching") || text.includes("pedagog")) {
    disciplines.push("Education");
  }
  if (text.includes("social") || text.includes("humanit") || text.includes("sociolog") || text.includes("histor") || text.includes("philosoph") || text.includes("religio")) {
    disciplines.push("Social Sciences");
  }
  if (text.includes("management") || text.includes("business") || text.includes("admin") || text.includes("econom")) {
    disciplines.push("Management");
    disciplines.push("Business");
  }
  if (text.includes("environment") || text.includes("ecolog") || text.includes("geograph") || text.includes("agri")) {
    disciplines.push("Environment");
  }
  if (text.includes("health") || text.includes("medic") || text.includes("biomed") || text.includes("clinical") || text.includes("pharmac")) {
    disciplines.push("Health Sciences");
  }
  if (disciplines.length === 0) {
    disciplines.push("Multidisciplinary");
  }
  return Array.from(new Set(disciplines));
}

type SortField = "name" | "country" | "score" | "frequency" | "quartile";
type SortOrder = "asc" | "desc";

const quartileColors: Record<string, { bg: string; text: string; border: string }> = {
  Q1: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  Q2: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  Q3: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  Q4: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" }
};

function BrowseContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCountry = searchParams?.get("country") || "";
  
  // State
  const [journals, setJournals] = useState<Journal[]>(seedJournals);
  const [search, setSearch] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>(urlCountry);
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");
  const [quartileFilter, setQuartileFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync country from URL param
  useEffect(() => {
    if (urlCountry) {
      setCountryFilter(urlCountry);
    }
  }, [urlCountry]);

  // Fetch journals and calculate rankings
  useEffect(() => {
    async function loadJournals() {
      try {
        const [listRes, rankRes] = await Promise.all([
          fetch("/api/journals/list"),
          fetch("/api/journals/rankings")
        ]);

        const listData = await listRes.json();
        const rankData = await rankRes.json();

        const rankingMap = new Map<string, any>();
        if (rankData.success && Array.isArray(rankData.rankings)) {
          rankData.rankings.forEach((r: any) => {
            rankingMap.set(r.id, r);
            if (r.name) rankingMap.set(r.name.toLowerCase().trim(), r);
          });
        }

        if (listData.success && Array.isArray(listData.journals) && listData.journals.length > 0) {
          const dbJournals: Journal[] = listData.journals.map((j: any) => {
            const rankInfo = rankingMap.get(j.id) || rankingMap.get(j.name?.toLowerCase()?.trim());
            const discs = getDisciplines(j.name, j.description || "");

            return {
              id: j.id,
              name: j.name,
              issn: j.issn || "Pending",
              eissn: j.eissn,
              publisher: j.publisherName || "Unknown Publisher",
              country: j.country || "Kenya",
              frequency: j.frequency || "Quarterly",
              disciplines: discs,
              primaryDiscipline: discs[0] || "Multidisciplinary",
              quartile: rankInfo?.quartile || (j.qualityGrade === "A" ? "Q1" : "Q2"),
              score: rankInfo?.score !== undefined ? rankInfo.score : (j.qualityGrade === "A" ? 2.45 : 1.20),
              qualityGrade: j.qualityGrade || "B",
              isIndexed: j.isIndexed ?? true,
              link: j.websiteUrl || ""
            };
          });

          setJournals(dbJournals);
        }
      } catch (err) {
        console.error("Failed to load journals:", err);
      }
    }
    loadJournals();
  }, []);

  // Filter & Sort Logic
  const processedJournals = useMemo(() => {
    const query = search.toLowerCase().trim();

    const filtered = journals.filter(j => {
      const matchesSearch = !query || 
        j.name.toLowerCase().includes(query) || 
        j.issn.toLowerCase().includes(query) || 
        (j.eissn && j.eissn.toLowerCase().includes(query)) ||
        j.publisher.toLowerCase().includes(query);
      
      const matchesCountry = countryFilter === "" || j.country.toLowerCase() === countryFilter.toLowerCase();
      const matchesDiscipline = disciplineFilter === "" || j.disciplines.includes(disciplineFilter);
      const matchesQuartile = quartileFilter === "" || j.quartile === quartileFilter;

      return matchesSearch && matchesCountry && matchesDiscipline && matchesQuartile;
    });

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "country") {
        comparison = a.country.localeCompare(b.country);
      } else if (sortField === "frequency") {
        comparison = a.frequency.localeCompare(b.frequency);
      } else if (sortField === "score") {
        comparison = (a.score ?? 0) - (b.score ?? 0);
      } else if (sortField === "quartile") {
        const qOrder: Record<string, number> = { Q1: 4, Q2: 3, Q3: 2, Q4: 1 };
        comparison = (qOrder[a.quartile || "Q4"] || 0) - (qOrder[b.quartile || "Q4"] || 0);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [journals, search, countryFilter, disciplineFilter, quartileFilter, sortField, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(processedJournals.length / pageSize) || 1;
  const paginatedJournals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedJournals.slice(start, start + pageSize);
  }, [processedJournals, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, countryFilter, disciplineFilter, quartileFilter, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const hasActiveFilters = search !== "" || countryFilter !== "" || disciplineFilter !== "" || quartileFilter !== "";

  const handleClearFilters = () => {
    setSearch("");
    setCountryFilter("");
    setDisciplineFilter("");
    setQuartileFilter("");
    router.replace("/browse");
  };

  const exportCSV = () => {
    const headers = ["#", "Journal Name", "ISSN", "Publisher", "Country", "Disciplines", "Quartile", "AJIF Score", "Frequency", "Website"];
    const rows = processedJournals.map((j, idx) => [
      idx + 1,
      `"${j.name.replace(/"/g, '""')}"`,
      `"${j.issn}"`,
      `"${j.publisher.replace(/"/g, '""')}"`,
      `"${j.country}"`,
      `"${j.disciplines.join("; ")}"`,
      `"${j.quartile || "N/A"}"`,
      `"${(j.score ?? 0).toFixed(3)}"`,
      `"${j.frequency}"`,
      `"${j.link}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AfriJournal_Directory_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to generate compact truncated pagination numbers
  const renderPaginationButtons = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          style={{
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: currentPage === p ? "var(--color-primary)" : "var(--color-border)",
            background: currentPage === p ? "var(--color-primary)" : "#ffffff",
            color: currentPage === p ? "#ffffff" : "var(--color-text-main)",
            fontWeight: currentPage === p ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.82rem"
          }}
        >
          {p}
        </button>
      ));
    }

    const pages: (number | string)[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }

    return pages.map((p, idx) => {
      if (p === "...") {
        return <span key={`ellipsis-${idx}`} style={{ padding: "0 0.3rem", color: "var(--color-text-muted)" }}>...</span>;
      }
      const pageNum = Number(p);
      return (
        <button
          key={pageNum}
          onClick={() => setCurrentPage(pageNum)}
          style={{
            padding: "0.35rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: currentPage === pageNum ? "var(--color-primary)" : "var(--color-border)",
            background: currentPage === pageNum ? "var(--color-primary)" : "#ffffff",
            color: currentPage === pageNum ? "#ffffff" : "var(--color-text-main)",
            fontWeight: currentPage === pageNum ? 700 : 500,
            cursor: "pointer",
            fontSize: "0.82rem"
          }}
        >
          {pageNum}
        </button>
      );
    });
  };

  return (
    <main className="container" style={{ padding: "3rem 0 5rem", maxWidth: "1280px" }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <span className="badge-featured" style={{ marginBottom: "0.5rem" }}>
            <i className="fa-solid fa-book-open"></i>
            African Scholarly Repository
          </span>
          <h1 className="page-title" style={{ fontSize: "2.1rem", margin: "0 0 0.35rem" }}>{t.browse_page.title}</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>{t.browse_page.desc}</p>
        </div>

        <button
          onClick={exportCSV}
          className="btn btn-secondary btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.84rem" }}
          title="Download current table view as CSV"
        >
          <i className="fa-solid fa-file-arrow-down" style={{ color: "var(--color-primary)" }}></i>
          Export Dataset (CSV)
        </button>
      </div>

      {/* Filter and Search Card */}
      <div className="card-surface" style={{ padding: "1.4rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr", gap: "1rem", alignItems: "center" }}>
          
          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontSize: "0.88rem" }}></i>
            <input 
              type="text" 
              placeholder="Search by title, ISSN, or publisher..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: "2.3rem", fontSize: "0.9rem" }}
            />
          </div>

          {/* Country Select */}
          <div>
            <select 
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: "0.9rem" }}
            >
              <option value="">All African Nations ({ALL_COUNTRY_NAMES.length})</option>
              {ALL_COUNTRY_NAMES.map(c => {
                const meta = COUNTRY_META_MAP[c];
                return (
                  <option key={c} value={c}>
                    {meta?.flag || "🌍"} {c}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Discipline Select */}
          <div>
            <select 
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: "0.9rem" }}
            >
              <option value="">All Subject Fields</option>
              <option value="Education">Education</option>
              <option value="Social Sciences">Social Sciences</option>
              <option value="Management">Management</option>
              <option value="Business">Business</option>
              <option value="Environment">Environment</option>
              <option value="Health Sciences">Health Sciences</option>
              <option value="Multidisciplinary">Multidisciplinary</option>
            </select>
          </div>

          {/* Quartile Select */}
          <div>
            <select 
              value={quartileFilter}
              onChange={(e) => setQuartileFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: "0.9rem" }}
            >
              <option value="">All Quartiles</option>
              <option value="Q1">Q1 (Top Tier)</option>
              <option value="Q2">Q2 (High Impact)</option>
              <option value="Q3">Q3 (Moderate)</option>
              <option value="Q4">Q4 (Emerging)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Counter & Quick Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text-muted)", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span>
              Showing <strong style={{ color: "var(--color-navy)" }}>{processedJournals.length}</strong> of {journals.length} indexed journals
              {countryFilter && ` for ${countryFilter}`}
            </span>
            {hasActiveFilters && (
              <button 
                onClick={handleClearFilters}
                style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.82rem" }}
              >
                <i className="fa-solid fa-rotate-left"></i> Reset filters
              </button>
            )}
          </div>

          {/* Per Page Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>Show per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="form-select"
              style={{ padding: "0.25rem 0.5rem", width: "auto", fontSize: "0.82rem" }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structured High-Contrast Academic Table */}
      <div className="table-wrapper" style={{ border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden", background: "#ffffff" }}>
        {processedJournals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
            <i className="fa-solid fa-book-open" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
            <h3 style={{ fontSize: "1.25rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
              {countryFilter ? `No Indexed Journals Cataloged for ${countryFilter} Yet` : "No Matching Journals Found"}
            </h3>
            <p style={{ maxWidth: "460px", margin: "0 auto 1.5rem", lineHeight: "1.6" }}>
              {countryFilter 
                ? `Publishers in ${countryFilter} can submit their peer-reviewed journals for indexing and quartile classification under the 2026 AJIF standard.` 
                : "No indexed publications matched your selected country, quartile, or search keywords."}
            </p>
            <div style={{ display: "inline-flex", gap: "0.75rem" }}>
              <a href="/submit" className="btn btn-primary btn-sm">
                <i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: "0.3rem" }}></i> Submit Journal for Indexing
              </a>
              <button onClick={handleClearFilters} className="btn btn-secondary btn-sm">
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <table className="academic-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                
                {/* # Row Number */}
                <th style={{ width: "45px", textAlign: "center", padding: "0.95rem 0.5rem", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                  #
                </th>

                {/* Journal Name & Publisher */}
                <th 
                  onClick={() => handleSort("name")} 
                  style={{ width: "35%", cursor: "pointer", userSelect: "none", padding: "0.95rem 1.2rem" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    Journal Information
                    {sortField === "name" ? (
                      <i className={`fa-solid fa-arrow-${sortOrder === "asc" ? "up" : "down"}`} style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>
                    ) : (
                      <i className="fa-solid fa-sort" style={{ opacity: 0.35, fontSize: "0.75rem" }}></i>
                    )}
                  </span>
                </th>

                {/* Primary Discipline */}
                <th style={{ width: "18%", padding: "0.95rem 1rem" }}>Subject Field</th>

                {/* Country */}
                <th 
                  onClick={() => handleSort("country")} 
                  style={{ width: "12%", cursor: "pointer", userSelect: "none", padding: "0.95rem 1rem" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    Country
                    {sortField === "country" ? (
                      <i className={`fa-solid fa-arrow-${sortOrder === "asc" ? "up" : "down"}`} style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>
                    ) : (
                      <i className="fa-solid fa-sort" style={{ opacity: 0.35, fontSize: "0.75rem" }}></i>
                    )}
                  </span>
                </th>

                {/* Impact Quartile */}
                <th 
                  onClick={() => handleSort("quartile")} 
                  style={{ width: "9%", textAlign: "center", cursor: "pointer", userSelect: "none", padding: "0.95rem 0.8rem" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    Tier
                    {sortField === "quartile" ? (
                      <i className={`fa-solid fa-arrow-${sortOrder === "asc" ? "up" : "down"}`} style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>
                    ) : (
                      <i className="fa-solid fa-sort" style={{ opacity: 0.35, fontSize: "0.75rem" }}></i>
                    )}
                  </span>
                </th>

                {/* AJIF Impact Score */}
                <th 
                  onClick={() => handleSort("score")} 
                  style={{ width: "10%", textAlign: "right", cursor: "pointer", userSelect: "none", padding: "0.95rem 1rem" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: "5px", width: "100%" }}>
                    AJIF Score
                    {sortField === "score" ? (
                      <i className={`fa-solid fa-arrow-${sortOrder === "asc" ? "up" : "down"}`} style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>
                    ) : (
                      <i className="fa-solid fa-sort" style={{ opacity: 0.35, fontSize: "0.75rem" }}></i>
                    )}
                  </span>
                </th>

                {/* Action Buttons */}
                <th style={{ width: "13%", textAlign: "right", padding: "0.95rem 1.2rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedJournals.map((journal, index) => {
                const q = journal.quartile || "Q2";
                const qStyle = quartileColors[q] || quartileColors["Q2"];
                const rowNum = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr 
                    key={journal.id || index}
                    style={{ 
                      borderBottom: "1px solid var(--color-border)",
                      background: index % 2 === 0 ? "#ffffff" : "#fafcff",
                      transition: "background 0.15s ease"
                    }}
                  >
                    {/* Row Index */}
                    <td style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.82rem", fontWeight: 600, padding: "0.9rem 0.5rem" }}>
                      {rowNum}
                    </td>

                    {/* Journal Title & Identifiers */}
                    <td style={{ padding: "0.9rem 1.2rem" }}>
                      <a 
                        href={`/journal/${journal.id || journal.issn}`}
                        style={{ color: "var(--color-navy)", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem", display: "block", marginBottom: "0.25rem", lineHeight: 1.35 }}
                      >
                        {journal.name}
                      </a>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", fontSize: "0.79rem", color: "var(--color-text-muted)" }}>
                        <span style={{ background: "#f1f5f9", padding: "0.1rem 0.4rem", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                          <strong>ISSN:</strong> {journal.issn}
                        </span>
                        <span>•</span>
                        <span style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {journal.publisher}
                        </span>
                      </div>
                    </td>

                    {/* Disciplines */}
                    <td style={{ padding: "0.9rem 1rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", alignItems: "center" }}>
                        <span className="journal-tag" style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem" }}>
                          {journal.primaryDiscipline}
                        </span>
                        {journal.disciplines.length > 1 && (
                          <span 
                            style={{ fontSize: "0.72rem", background: "#e2e8f0", color: "#475569", padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: 600 }}
                            title={journal.disciplines.slice(1).join(", ")}
                          >
                            +{journal.disciplines.length - 1}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Country */}
                    <td style={{ padding: "0.9rem 1rem" }}>
                      <span className="badge badge-slate" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
                        {journal.country}
                      </span>
                    </td>

                    {/* Quartile Badge */}
                    <td style={{ textAlign: "center", padding: "0.9rem 0.8rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "0.22rem 0.6rem",
                        borderRadius: "6px",
                        background: qStyle.bg,
                        color: qStyle.text,
                        border: `1px solid ${qStyle.border}`,
                        fontSize: "0.76rem",
                        fontWeight: 700
                      }}>
                        {q}
                      </span>
                    </td>

                    {/* AJIF Score */}
                    <td style={{ textAlign: "right", padding: "0.9rem 1rem", fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                      {(journal.score ?? 0).toFixed(3)}
                    </td>

                    {/* Action Links */}
                    <td style={{ textAlign: "right", padding: "0.9rem 1.2rem" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", justifyContent: "flex-end" }}>
                        {journal.link && (
                          <a 
                            href={journal.link.startsWith("http") ? journal.link : `https://${journal.link}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem" }}
                            title="Visit official journal homepage"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        )}
                        <a 
                          href={`/journal/${journal.id || journal.issn}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "0.78rem", padding: "0.32rem 0.75rem", whiteSpace: "nowrap" }}
                        >
                          Profile
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Table Footer & Clean Sliding Pagination Navigation */}
        {processedJournals.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.2rem", background: "#f8fafc", borderTop: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text-muted)", flexWrap: "wrap", gap: "0.5rem" }}>
            <span>
              Showing <strong style={{ color: "var(--color-navy)" }}>{(currentPage - 1) * pageSize + 1}</strong> – <strong style={{ color: "var(--color-navy)" }}>{Math.min(currentPage * pageSize, processedJournals.length)}</strong> of <strong>{processedJournals.length}</strong> items
            </span>

            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.35rem 0.75rem", opacity: currentPage === 1 ? 0.45 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "0.82rem" }}
              >
                <i className="fa-solid fa-chevron-left" style={{ fontSize: "0.7rem", marginRight: "0.25rem" }}></i> Prev
              </button>

              {renderPaginationButtons()}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.35rem 0.75rem", opacity: currentPage === totalPages ? 0.45 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "0.82rem" }}
              >
                Next <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7rem", marginLeft: "0.25rem" }}></i>
              </button>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}

export default function Browse() {
  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header activePage="browse" />
      <Suspense fallback={
        <div style={{ padding: "6rem 2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)" }}></i>
          <p style={{ marginTop: "1rem" }}>Loading African Journal Directory...</p>
        </div>
      }>
        <BrowseContent />
      </Suspense>
      <Footer />
    </div>
  );
}
