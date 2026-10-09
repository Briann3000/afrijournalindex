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

interface ArticleResult {
  id: string;
  title: string;
  doi: string | null;
  abstract: string | null;
  pdfUrl: string | null;
  publishDate: string;
  journalName: string;
  journalId: string;
  country: string;
  issn: string | null;
  qualityGrade: string;
  citationCount: number;
}

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
  const urlQuery = searchParams?.get("q") || "";
  
  // Tabs: 'journals' or 'articles'
  const [activeTab, setActiveTab] = useState<"journals" | "articles">("journals");

  // Journal State
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loadingJournals, setLoadingJournals] = useState<boolean>(true);
  const [search, setSearch] = useState<string>(urlQuery);
  const [countryFilter, setCountryFilter] = useState<string>(urlCountry);
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");
  const [quartileFilter, setQuartileFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Article State
  const [articles, setArticles] = useState<ArticleResult[]>([]);
  const [articleSearch, setArticleSearch] = useState<string>(urlQuery);
  const [articleTotal, setArticleTotal] = useState<number>(0);
  const [articlePage, setArticlePage] = useState<number>(1);
  const [articleLoading, setArticleLoading] = useState<boolean>(false);
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);

  // Sync from URL
  useEffect(() => {
    if (urlCountry) setCountryFilter(urlCountry);
    if (urlQuery) {
      setSearch(urlQuery);
      setArticleSearch(urlQuery);
    }
  }, [urlCountry, urlQuery]);

  // Load Journals
  useEffect(() => {
    async function loadJournals() {
      setLoadingJournals(true);
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
              publisher: j.publisherName || "African Academic Publisher",
              country: j.country || "Pan-African",
              frequency: j.frequency || "Quarterly",
              disciplines: discs,
              primaryDiscipline: discs[0] || "Multidisciplinary",
              quartile: rankInfo?.quartile || (j.qualityGrade === "A+" ? "Q1" : j.qualityGrade === "A" ? "Q2" : "Q3"),
              score: rankInfo?.score !== undefined ? rankInfo.score : (j.qualityGrade === "A+" ? 3.10 : j.qualityGrade === "A" ? 2.15 : 1.10),
              qualityGrade: j.qualityGrade || "A",
              isIndexed: j.isIndexed ?? true,
              link: j.websiteUrl || ""
            };
          });

          setJournals(dbJournals);
        }
      } catch (err) {
        console.error("Failed to load journals:", err);
      } finally {
        setLoadingJournals(false);
      }
    }
    loadJournals();
  }, []);

  // Fetch Articles on search or page change
  useEffect(() => {
    async function searchArticles() {
      if (activeTab !== "articles") return;
      setArticleLoading(true);
      try {
        const queryParams = new URLSearchParams({
          q: articleSearch,
          country: countryFilter,
          page: articlePage.toString(),
          limit: "15"
        });

        const res = await fetch(`/api/articles/search?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.articles || []);
          setArticleTotal(data.total || 0);
        }
      } catch (err) {
        console.error("Failed to load articles:", err);
      } finally {
        setArticleLoading(false);
      }
    }

    const timer = setTimeout(() => {
      searchArticles();
    }, 200);

    return () => clearTimeout(timer);
  }, [activeTab, articleSearch, countryFilter, articlePage]);

  // Filter & Sort Journals
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

  const totalPages = Math.ceil(processedJournals.length / pageSize) || 1;
  const paginatedJournals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedJournals.slice(start, start + pageSize);
  }, [processedJournals, currentPage, pageSize]);

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
    setArticleSearch("");
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

  return (
    <main className="container" style={{ padding: "3rem 0 5rem", maxWidth: "1280px" }}>
      
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "1.8rem" }}>
        <div>
          <span className="badge-featured" style={{ marginBottom: "0.5rem" }}>
            <i className="fa-solid fa-book-open"></i>
            African Scholarly Index &amp; Repository
          </span>
          <h1 className="page-title" style={{ fontSize: "2.1rem", margin: "0 0 0.35rem" }}>{t.browse_page.title}</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Search across {journals.length > 0 ? `${journals.length}+` : "1,600+"} indexed journals and 20,000+ peer-reviewed African research articles.
          </p>
        </div>

        {activeTab === "journals" && (
          <button
            onClick={exportCSV}
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.84rem" }}
            title="Download current table view as CSV"
          >
            <i className="fa-solid fa-file-arrow-down" style={{ color: "var(--color-primary)" }}></i>
            Export Dataset (CSV)
          </button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("journals")}
          style={{
            padding: "0.65rem 1.4rem",
            borderRadius: "10px",
            border: activeTab === "journals" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
            background: activeTab === "journals" ? "var(--color-primary-light)" : "#ffffff",
            color: activeTab === "journals" ? "var(--color-primary)" : "var(--color-text-main)",
            fontWeight: 700,
            fontSize: "0.92rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.15s ease"
          }}
        >
          <i className="fa-solid fa-book-bookmark"></i>
          Journals Directory ({journals.length > 0 ? journals.length : "1,680+"})
        </button>

        <button
          onClick={() => setActiveTab("articles")}
          style={{
            padding: "0.65rem 1.4rem",
            borderRadius: "10px",
            border: activeTab === "articles" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
            background: activeTab === "articles" ? "var(--color-primary-light)" : "#ffffff",
            color: activeTab === "articles" ? "var(--color-primary)" : "var(--color-text-main)",
            fontWeight: 700,
            fontSize: "0.92rem",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.15s ease"
          }}
        >
          <i className="fa-solid fa-newspaper"></i>
          Articles &amp; Abstracts ({articleTotal > 0 ? `${articleTotal} Results` : "20,000+ Papers"})
        </button>
      </div>

      {/* ================= TAB 1: JOURNALS DIRECTORY ================= */}
      {activeTab === "journals" && (
        <>
          {/* Filter and Search Card */}
          <div className="card-surface" style={{ padding: "1.4rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr", gap: "1rem", alignItems: "center" }}>
              
              {/* Search Input */}
              <div style={{ position: "relative" }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontSize: "0.88rem" }}></i>
                <input 
                  type="text" 
                  placeholder="Search journal title, ISSN, publisher..." 
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

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>Show per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="form-select"
                  style={{ padding: "0.25rem 0.5rem", width: "auto", fontSize: "0.82rem" }}
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                </select>
              </div>
            </div>
          </div>

          {/* Structured High-Contrast Academic Table */}
          <div className="table-wrapper" style={{ border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden", background: "#ffffff" }}>
            {loadingJournals ? (
              <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)" }}></i>
                <p style={{ marginTop: "1rem" }}>Loading African Journal Directory...</p>
              </div>
            ) : processedJournals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
                <i className="fa-solid fa-book-open" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
                <h3 style={{ fontSize: "1.25rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                  {countryFilter ? `No Indexed Journals Cataloged for ${countryFilter} Yet` : "No Matching Journals Found"}
                </h3>
                <p style={{ maxWidth: "460px", margin: "0 auto 1.5rem", lineHeight: "1.6" }}>
                  No indexed publications matched your selected filters.
                </p>
                <button onClick={handleClearFilters} className="btn btn-secondary btn-sm">
                  Clear Filters
                </button>
              </div>
            ) : (
              <table className="academic-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ width: "45px", textAlign: "center", padding: "0.95rem 0.5rem", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>#</th>
                    <th onClick={() => handleSort("name")} style={{ width: "35%", cursor: "pointer", userSelect: "none", padding: "0.95rem 1.2rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        Journal Information
                        <i className="fa-solid fa-sort" style={{ opacity: 0.35, fontSize: "0.75rem" }}></i>
                      </span>
                    </th>
                    <th style={{ width: "18%", padding: "0.95rem 1rem" }}>Subject Field</th>
                    <th onClick={() => handleSort("country")} style={{ width: "12%", cursor: "pointer", userSelect: "none", padding: "0.95rem 1rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        Country
                        <i className="fa-solid fa-sort" style={{ opacity: 0.35, fontSize: "0.75rem" }}></i>
                      </span>
                    </th>
                    <th onClick={() => handleSort("quartile")} style={{ width: "9%", textAlign: "center", cursor: "pointer", userSelect: "none", padding: "0.95rem 0.8rem" }}>
                      Tier
                    </th>
                    <th onClick={() => handleSort("score")} style={{ width: "10%", textAlign: "right", cursor: "pointer", userSelect: "none", padding: "0.95rem 1rem" }}>
                      AJIF Score
                    </th>
                    <th style={{ width: "13%", textAlign: "right", padding: "0.95rem 1.2rem" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJournals.map((journal, index) => {
                    const q = journal.quartile || "Q2";
                    const qStyle = quartileColors[q] || quartileColors["Q2"];
                    const rowNum = (currentPage - 1) * pageSize + index + 1;

                    return (
                      <tr key={journal.id || index} style={{ borderBottom: "1px solid var(--color-border)", background: index % 2 === 0 ? "#ffffff" : "#fafcff" }}>
                        <td style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.82rem", fontWeight: 600, padding: "0.9rem 0.5rem" }}>
                          {rowNum}
                        </td>
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
                        <td style={{ padding: "0.9rem 1rem" }}>
                          <span className="journal-tag" style={{ fontSize: "0.74rem", padding: "0.2rem 0.5rem" }}>
                            {journal.primaryDiscipline}
                          </span>
                        </td>
                        <td style={{ padding: "0.9rem 1rem" }}>
                          <span className="badge badge-slate" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
                            {journal.country}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", padding: "0.9rem 0.8rem" }}>
                          <span style={{ display: "inline-block", padding: "0.22rem 0.6rem", borderRadius: "6px", background: qStyle.bg, color: qStyle.text, border: `1px solid ${qStyle.border}`, fontSize: "0.76rem", fontWeight: 700 }}>
                            {q}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", padding: "0.9rem 1rem", fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                          {(journal.score ?? 0).toFixed(3)}
                        </td>
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

            {/* Pagination Controls */}
            {processedJournals.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.2rem", background: "#f8fafc", borderTop: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                <span>
                  Showing <strong style={{ color: "var(--color-navy)" }}>{(currentPage - 1) * pageSize + 1}</strong> – <strong style={{ color: "var(--color-navy)" }}>{Math.min(currentPage * pageSize, processedJournals.length)}</strong> of <strong>{processedJournals.length}</strong> journals
                </span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "0.3rem 0.7rem", opacity: currentPage === 1 ? 0.45 : 1 }}
                  >
                    Prev
                  </button>
                  <span style={{ padding: "0.3rem 0.7rem", fontWeight: 700 }}>{currentPage} / {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "0.3rem 0.7rem", opacity: currentPage === totalPages ? 0.45 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 2: ARTICLES & ABSTRACTS SEARCH ================= */}
      {activeTab === "articles" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Article Search Bar */}
          <div className="card-surface" style={{ padding: "1.4rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}></i>
                <input
                  type="text"
                  placeholder="Search articles by keywords, topics, DOI, or abstract content..."
                  value={articleSearch}
                  onChange={(e) => {
                    setArticleSearch(e.target.value);
                    setArticlePage(1);
                  }}
                  className="form-control"
                  style={{ paddingLeft: "2.6rem", fontSize: "0.95rem" }}
                />
              </div>

              <div>
                <select
                  value={countryFilter}
                  onChange={(e) => {
                    setCountryFilter(e.target.value);
                    setArticlePage(1);
                  }}
                  className="form-select"
                  style={{ fontSize: "0.92rem" }}
                >
                  <option value="">Filter by Author/Publisher Country (All Africa)</option>
                  {ALL_COUNTRY_NAMES.map(c => (
                    <option key={c} value={c}>
                      {COUNTRY_META_MAP[c]?.flag || "🌍"} {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: "0.85rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Found <strong style={{ color: "var(--color-primary)" }}>{articleTotal}</strong> peer-reviewed African research articles
            </div>
          </div>

          {/* Article List Cards */}
          {articleLoading ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)" }}></i>
              <p style={{ marginTop: "1rem" }}>Searching indexed African research papers...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="card-surface" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-newspaper" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
              <h3 style={{ fontSize: "1.2rem", color: "var(--color-text-main)" }}>No Articles Found</h3>
              <p>Try searching for broader keywords like "agriculture", "education", "health", or "economics".</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="card-surface"
                  style={{ padding: "1.6rem", transition: "transform 0.15s ease", border: "1px solid var(--color-border)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                        <span className="badge badge-slate" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                          {art.country}
                        </span>
                        <a
                          href={`/journal/${art.journalId || art.issn}`}
                          style={{ fontSize: "0.82rem", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
                        >
                          {art.journalName}
                        </a>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                          • {new Date(art.publishDate).getFullYear()}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.5rem", lineHeight: "1.4" }}>
                        {art.title}
                      </h3>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {art.doi && (
                        <a
                          href={`https://doi.org/${art.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                        >
                          <span>DOI</span>
                          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }}></i>
                        </a>
                      )}
                      {art.pdfUrl && (
                        <a
                          href={art.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                        >
                          <i className="fa-solid fa-file-pdf"></i>
                          <span>Open PDF</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {art.abstract && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <p style={{
                        fontSize: "0.88rem",
                        color: "var(--color-text-muted)",
                        lineHeight: "1.6",
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: expandedAbstractId === art.id ? "unset" : 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {art.abstract}
                      </p>
                      {art.abstract.length > 180 && (
                        <button
                          onClick={() => setExpandedAbstractId(expandedAbstractId === art.id ? null : art.id)}
                          style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.8rem", fontWeight: 600, padding: 0, marginTop: "0.3rem", cursor: "pointer" }}
                        >
                          {expandedAbstractId === art.id ? "Show less" : "Read full abstract..."}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Article Pagination */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", marginTop: "1rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Page {articlePage} of {Math.ceil(articleTotal / 15) || 1}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    disabled={articlePage === 1}
                    onClick={() => setArticlePage(p => Math.max(1, p - 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: articlePage === 1 ? 0.45 : 1 }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={articlePage >= Math.ceil(articleTotal / 15)}
                    onClick={() => setArticlePage(p => p + 1)}
                    className="btn btn-secondary btn-sm"
                    style={{ opacity: articlePage >= Math.ceil(articleTotal / 15) ? 0.45 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

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
          <p style={{ marginTop: "1rem" }}>Loading African Scholarly Index...</p>
        </div>
      }>
        <BrowseContent />
      </Suspense>
      <Footer />
    </div>
  );
}
