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
  isScopusIndexed?: boolean;
  isWosIndexed?: boolean;
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
    if (text.includes("social") || text.includes("humanit") || text.includes("sociolog") || text.includes("histor")) {
      disciplines.push("Education & Social Sciences");
    } else {
      disciplines.push("Education");
    }
  }
  if (text.includes("social") || text.includes("humanit") || text.includes("sociolog") || text.includes("histor") || text.includes("philosoph") || text.includes("religio")) {
    if (!disciplines.includes("Education & Social Sciences")) {
      disciplines.push("Social Sciences");
    }
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
  Q4: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
  Unrated: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" }
};

function normalizeDiscipline(raw: string): string {
  if (!raw) return "";
  const r = raw.toLowerCase();
  if (r.includes("health") || r.includes("medic")) return "Health Sciences";
  if (r.includes("social") && r.includes("educat")) return "Education & Social Sciences";
  if (r.includes("social") || r.includes("humanit") || r.includes("law")) return "Social Sciences";
  if (r.includes("educat") || r.includes("pedagog")) return "Education";
  if (r.includes("agri") || r.includes("environ") || r.includes("ecolog")) return "Environment";
  if (r.includes("business") || r.includes("econom") || r.includes("financ")) return "Business";
  if (r.includes("manage") || r.includes("admin")) return "Management";
  return raw;
}

function BrowseContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlCountry = searchParams?.get("country") || "";
  const urlQuery = searchParams?.get("q") || "";
  const urlDiscipline = normalizeDiscipline(searchParams?.get("discipline") || "");
  const urlTab = searchParams?.get("tab") || "";
  
  // Tabs: 'journals' or 'articles'
  const [activeTab, setActiveTab] = useState<"journals" | "articles">(urlTab === "articles" ? "articles" : "journals");

  // Journal State
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loadingJournals, setLoadingJournals] = useState<boolean>(true);
  const [search, setSearch] = useState<string>(urlQuery);
  const [countryFilter, setCountryFilter] = useState<string>(urlCountry);
  const [disciplineFilter, setDisciplineFilter] = useState<string>(urlDiscipline);
  const [quartileFilter, setQuartileFilter] = useState<string>("");
  const [indexBodyFilter, setIndexBodyFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Article State
  const [articles, setArticles] = useState<ArticleResult[]>([]);
  const [articleSearch, setArticleSearch] = useState<string>(urlQuery);
  const [articleTotal, setArticleTotal] = useState<number>(0);
  const [articlePage, setArticlePage] = useState<number>(1);
  const [articleSort, setArticleSort] = useState<"newest" | "oldest" | "citations" | "title">("newest");
  const [articleYear, setArticleYear] = useState<string>("");
  const [articleHasPdf, setArticleHasPdf] = useState<boolean>(false);
  const [articlePageSize, setArticlePageSize] = useState<number>(15);
  const [articleLoading, setArticleLoading] = useState<boolean>(false);
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);

  // Sync from URL
  useEffect(() => {
    if (urlCountry) setCountryFilter(urlCountry);
    if (urlDiscipline) setDisciplineFilter(urlDiscipline);
    if (urlTab === "articles") setActiveTab("articles");
    if (urlQuery) {
      setSearch(urlQuery);
      setArticleSearch(urlQuery);
    }
  }, [urlCountry, urlDiscipline, urlTab, urlQuery]);

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
              isScopusIndexed: Boolean(j.isScopusIndexed),
              isWosIndexed: Boolean(j.isWosIndexed),
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

  // Fetch Articles on search, sort, filter or page change
  useEffect(() => {
    async function searchArticles() {
      if (activeTab !== "articles") return;
      setArticleLoading(true);
      try {
        const queryParams = new URLSearchParams({
          q: articleSearch,
          country: countryFilter,
          sortBy: articleSort,
          page: articlePage.toString(),
          limit: articlePageSize.toString()
        });

        if (articleYear) queryParams.set("year", articleYear);
        if (articleHasPdf) queryParams.set("hasPdf", "true");

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
  }, [activeTab, articleSearch, countryFilter, articleSort, articleYear, articleHasPdf, articlePage, articlePageSize]);

  // Filter & Sort Journals
  const processedJournals = useMemo(() => {
    const query = search.toLowerCase().trim();

    const filtered = journals.filter(j => {
      const matchesSearch = !query || 
        j.name.toLowerCase().includes(query) || 
        j.issn.toLowerCase().includes(query) || 
        (j.eissn && j.eissn.toLowerCase().includes(query)) ||
        j.publisher.toLowerCase().includes(query) ||
        (j.disciplines && j.disciplines.some(d => d.toLowerCase().includes(query) || query.includes(d.toLowerCase()))) ||
        (j.primaryDiscipline && (j.primaryDiscipline.toLowerCase().includes(query) || query.includes(j.primaryDiscipline.toLowerCase())));
      
      const matchesCountry = countryFilter === "" || j.country.toLowerCase() === countryFilter.toLowerCase();
      const matchesDiscipline = disciplineFilter === "" || 
        j.disciplines.some(d => {
          const dL = d.toLowerCase();
          const fL = disciplineFilter.toLowerCase();
          return dL === fL || dL.includes(fL) || fL.includes(dL);
        }) || 
        (j.primaryDiscipline && (
          j.primaryDiscipline.toLowerCase().includes(disciplineFilter.toLowerCase()) ||
          disciplineFilter.toLowerCase().includes(j.primaryDiscipline.toLowerCase())
        ));
      const matchesQuartile = quartileFilter === "" || j.quartile === quartileFilter;
      const matchesIndexBody = indexBodyFilter === "" ||
        (indexBodyFilter === "scopus" && j.isScopusIndexed) ||
        (indexBodyFilter === "wos" && j.isWosIndexed) ||
        (indexBodyFilter === "both" && j.isScopusIndexed && j.isWosIndexed);

      return matchesSearch && matchesCountry && matchesDiscipline && matchesQuartile && matchesIndexBody;
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
  }, [journals, search, countryFilter, disciplineFilter, quartileFilter, indexBodyFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(processedJournals.length / pageSize) || 1;
  const paginatedJournals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedJournals.slice(start, start + pageSize);
  }, [processedJournals, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, countryFilter, disciplineFilter, quartileFilter, indexBodyFilter, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const hasActiveFilters = search !== "" || countryFilter !== "" || disciplineFilter !== "" || quartileFilter !== "" || indexBodyFilter !== "";

  const handleClearFilters = () => {
    setSearch("");
    setArticleSearch("");
    setCountryFilter("");
    setDisciplineFilter("");
    setQuartileFilter("");
    setIndexBodyFilter("");
    router.replace("/browse");
  };

  const exportCSV = () => {
    const headers = ["#", "Journal Name", "ISSN", "Publisher", "Country", "Disciplines", "Quartile", "AJCI Score", "Frequency", "Website"];
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
    <main className="container" style={{ padding: "3rem 1.5rem 5rem", maxWidth: "1240px", margin: "0 auto" }}>
      
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
            background: activeTab === "journals" ? "var(--color-primary-light)" : "var(--color-bg-card)",
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
            background: activeTab === "articles" ? "var(--color-primary-light)" : "var(--color-bg-card)",
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
          <div className="card-surface" style={{ padding: "1.4rem", marginBottom: "1.5rem", borderRadius: "14px" }}>
            <div className="browse-filter-grid">
              
              {/* Search Input */}
              <div className="browse-search-wrapper">
                <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "0.95rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-primary)", fontSize: "0.9rem", zIndex: 2 }}></i>
                <input 
                  type="text" 
                  placeholder="Search journal title, ISSN, publisher..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control browse-search-input"
                  style={{ paddingLeft: "2.4rem", fontSize: "0.92rem", height: "46px" }}
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
                  {disciplineFilter && ![
                    "Education & Social Sciences", "Education", "Social Sciences",
                    "Management", "Business", "Environment", "Health Sciences", "Multidisciplinary"
                  ].includes(disciplineFilter) && (
                    <option value={disciplineFilter}>{disciplineFilter}</option>
                  )}
                  <option value="Education & Social Sciences">Education &amp; Social Sciences</option>
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

              {/* Global Indexing Filter */}
              <div>
                <select 
                  value={indexBodyFilter}
                  onChange={(e) => setIndexBodyFilter(e.target.value)}
                  className="form-select"
                  style={{ fontSize: "0.9rem" }}
                >
                  <option value="">All Indexes (AJCI + Global)</option>
                  <option value="scopus">Scopus Indexed Only</option>
                  <option value="wos">Web of Science (WoS) Only</option>
                  <option value="both">Scopus &amp; WoS Dual Indexed</option>
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
          <div className="table-wrapper" style={{ border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden", background: "var(--color-bg-card)" }}>
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
                  <tr style={{ background: "var(--color-bg-card-subtle)", borderBottom: "2px solid var(--color-border)" }}>
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
                      AJCI Score
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
                      <tr key={journal.id || index} style={{ borderBottom: "1px solid var(--color-border)", background: index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.02)" }}>
                        <td style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.82rem", fontWeight: 600, padding: "0.9rem 0.5rem" }}>
                          {rowNum}
                        </td>
                        <td style={{ padding: "0.9rem 1.2rem" }}>
                          <a 
                            href={`/journal/${journal.id || journal.issn}`}
                            style={{ color: "var(--color-text-main)", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem", display: "block", marginBottom: "0.25rem", lineHeight: 1.35 }}
                          >
                            {journal.name}
                          </a>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", fontSize: "0.79rem", color: "var(--color-text-muted)" }}>
                            <span style={{ background: "var(--color-bg-card-subtle)", padding: "0.1rem 0.4rem", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                              <strong>ISSN:</strong> {journal.issn}
                            </span>
                            <span 
                              title="Open Access Journal — Free to read and cite"
                              style={{ 
                                background: "rgba(245, 158, 11, 0.1)", 
                                color: "#d97706", 
                                border: "1px solid rgba(245, 158, 11, 0.3)", 
                                padding: "0.1rem 0.45rem", 
                                borderRadius: "4px", 
                                fontWeight: 700, 
                                fontSize: "0.72rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px"
                              }}
                            >
                              <i className="fa-solid fa-lock-open" style={{ fontSize: "0.68rem" }}></i>
                              <span>Open Access</span>
                            </span>
                            {journal.isScopusIndexed && (
                              <span style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "0.1rem 0.45rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.72rem" }}>
                                <i className="fa-solid fa-earth-americas" style={{ marginRight: "3px" }}></i> Scopus
                              </span>
                            )}
                            {journal.isWosIndexed && (
                              <span style={{ background: "#ede9fe", color: "#5b21b6", border: "1px solid #ddd6fe", padding: "0.1rem 0.45rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.72rem" }}>
                                <i className="fa-solid fa-award" style={{ marginRight: "3px" }}></i> WoS
                              </span>
                            )}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.2rem", background: "var(--color-bg-card-subtle)", borderTop: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                <span>
                  Showing <strong style={{ color: "var(--color-text-main)" }}>{(currentPage - 1) * pageSize + 1}</strong> – <strong style={{ color: "var(--color-text-main)" }}>{Math.min(currentPage * pageSize, processedJournals.length)}</strong> of <strong>{processedJournals.length}</strong> journals
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
          
          {/* Article Search & Multi-Filter Card */}
          <div className="card-surface" style={{ padding: "1.4rem", borderRadius: "14px" }}>
            <div className="browse-filter-grid">
              
              {/* Search Input */}
              <div className="browse-search-wrapper">
                <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-primary)", fontSize: "0.92rem", zIndex: 2 }}></i>
                <input
                  type="text"
                  placeholder="Search title, keywords, abstract, DOI..."
                  value={articleSearch}
                  onChange={(e) => {
                    setArticleSearch(e.target.value);
                    setArticlePage(1);
                  }}
                  className="form-control browse-search-input"
                  style={{ paddingLeft: "2.6rem", paddingRight: articleSearch ? "2.2rem" : "0.75rem", fontSize: "0.92rem", height: "46px" }}
                />
                {articleSearch && (
                  <button
                    onClick={() => { setArticleSearch(""); setArticlePage(1); }}
                    style={{ position: "absolute", right: "0.8rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px", zIndex: 2 }}
                    title="Clear search"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* Country Select */}
              <div>
                <select
                  value={countryFilter}
                  onChange={(e) => {
                    setCountryFilter(e.target.value);
                    setArticlePage(1);
                  }}
                  className="form-select"
                  style={{ fontSize: "0.9rem" }}
                >
                  <option value="">All African Nations ({ALL_COUNTRY_NAMES.length})</option>
                  {ALL_COUNTRY_NAMES.map(c => (
                    <option key={c} value={c}>
                      {COUNTRY_META_MAP[c]?.flag || "🌍"} {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Publication Year Filter */}
              <div>
                <select
                  value={articleYear}
                  onChange={(e) => {
                    setArticleYear(e.target.value);
                    setArticlePage(1);
                  }}
                  className="form-select"
                  style={{ fontSize: "0.9rem" }}
                >
                  <option value="">All Publication Years</option>
                  <option value="2026">2026 (Latest)</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                </select>
              </div>

              {/* Sort Order Selector */}
              <div>
                <select
                  value={articleSort}
                  onChange={(e) => {
                    setArticleSort(e.target.value as any);
                    setArticlePage(1);
                  }}
                  className="form-select"
                  style={{ fontSize: "0.9rem" }}
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="citations">Sort: Most Cited</option>
                  <option value="title">Sort: Title (A → Z)</option>
                </select>
              </div>
            </div>

            {/* Secondary Controls Bar: Open Access PDF Toggle, Reset, Page Size, Results Count */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text-muted)", flexWrap: "wrap", gap: "0.8rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <span>
                  Found <strong style={{ color: "var(--color-primary)" }}>{articleTotal.toLocaleString()}</strong> peer-reviewed African research articles
                </span>

                {/* Open Access Toggle Pill */}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", background: articleHasPdf ? "var(--color-primary-light)" : "#f8fafc", padding: "0.3rem 0.75rem", borderRadius: "20px", border: articleHasPdf ? "1px solid var(--color-primary)" : "1px solid var(--color-border)", fontSize: "0.82rem", fontWeight: 600, color: articleHasPdf ? "var(--color-primary)" : "var(--color-text-main)", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={articleHasPdf}
                    onChange={(e) => {
                      setArticleHasPdf(e.target.checked);
                      setArticlePage(1);
                    }}
                    style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
                  />
                  <i className="fa-solid fa-lock-open" style={{ color: articleHasPdf ? "var(--color-primary)" : "var(--color-text-muted)" }}></i>
                  Open Access / Full Text Only
                </label>

                {(articleSearch || countryFilter || articleYear || articleHasPdf) && (
                  <button
                    onClick={() => {
                      setArticleSearch("");
                      setCountryFilter("");
                      setArticleYear("");
                      setArticleHasPdf(false);
                      setArticleSort("newest");
                      setArticlePage(1);
                    }}
                    style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}
                  >
                    <i className="fa-solid fa-rotate-left" style={{ marginRight: "4px" }}></i> Reset Filters
                  </button>
                )}
              </div>

              {/* Page Size Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>Show:</span>
                <select
                  value={articlePageSize}
                  onChange={(e) => {
                    setArticlePageSize(Number(e.target.value));
                    setArticlePage(1);
                  }}
                  className="form-select"
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.82rem", width: "auto" }}
                >
                  <option value={15}>15 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
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
              <p>Try searching for broader keywords like &quot;agriculture&quot;, &quot;education&quot;, &quot;health&quot;, or &quot;economics&quot;, or reset your filters.</p>
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
                        <span style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: 700, background: "rgba(13, 148, 136, 0.08)", padding: "0.15rem 0.5rem", borderRadius: "4px", border: "1px solid rgba(13, 148, 136, 0.2)" }}>
                          <i className="fa-solid fa-quote-right" style={{ marginRight: "4px" }}></i>
                          {art.citationCount} {art.citationCount === 1 ? "Citation" : "Citations"}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.5rem", lineHeight: "1.4" }}>
                        {art.title}
                      </h3>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      {art.doi && art.doi.startsWith("10.") && !art.doi.includes("zenodo.arjess") && !art.doi.includes("10.5130") && !art.doi.includes("10.59235") ? (
                        <a
                          href={`https://doi.org/${art.doi.trim()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                        >
                          <span>Access via DOI</span>
                          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }}></i>
                        </a>
                      ) : (art.pdfUrl || (art as any).url) ? (
                        <a
                          href={art.pdfUrl || (art as any).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                        >
                          <span>Publisher Site</span>
                          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }}></i>
                        </a>
                      ) : null}

                      <a
                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(art.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "var(--color-text-muted)" }}
                        title="Search citations on Google Scholar"
                      >
                        <i className="fa-brands fa-google" style={{ fontSize: "0.75rem" }}></i>
                        <span>Scholar</span>
                      </a>
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

              {/* Robust Numbered Article Pagination */}
              {articleTotal > 0 && (() => {
                const totalPages = Math.max(1, Math.ceil(articleTotal / articlePageSize));
                const getPages = () => {
                  const pages: (number | string)[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (articlePage > 3) pages.push("...");
                    const start = Math.max(2, articlePage - 1);
                    const end = Math.min(totalPages - 1, articlePage + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (articlePage < totalPages - 2) pages.push("...");
                    pages.push(totalPages);
                  }
                  return pages;
                };

                return (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.1rem 1.4rem", marginTop: "1rem", background: "var(--color-bg-card-subtle)", borderRadius: "12px", border: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text-muted)", flexWrap: "wrap", gap: "0.8rem" }}>
                    <span>
                      Showing <strong style={{ color: "var(--color-navy)" }}>{(articlePage - 1) * articlePageSize + 1}</strong> – <strong style={{ color: "var(--color-navy)" }}>{Math.min(articlePage * articlePageSize, articleTotal)}</strong> of <strong style={{ color: "var(--color-navy)" }}>{articleTotal.toLocaleString()}</strong> articles
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                      <button
                        disabled={articlePage === 1}
                        onClick={() => setArticlePage(p => Math.max(1, p - 1))}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.35rem 0.75rem", opacity: articlePage === 1 ? 0.45 : 1, fontSize: "0.82rem" }}
                      >
                        <i className="fa-solid fa-chevron-left" style={{ marginRight: "4px" }}></i> Prev
                      </button>

                      {getPages().map((p, idx) => {
                        if (p === "...") {
                          return <span key={`ell-${idx}`} style={{ padding: "0.2rem 0.5rem", color: "var(--color-text-muted)" }}>...</span>;
                        }
                        const pageNum = p as number;
                        const isActive = pageNum === articlePage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setArticlePage(pageNum)}
                            style={{
                              minWidth: "34px",
                              height: "34px",
                              padding: "0 0.5rem",
                              borderRadius: "6px",
                              border: isActive ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                              background: isActive ? "var(--color-primary)" : "#ffffff",
                              color: isActive ? "#ffffff" : "var(--color-text-main)",
                              fontWeight: isActive ? 700 : 500,
                              fontSize: "0.84rem",
                              cursor: "pointer",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        disabled={articlePage >= totalPages}
                        onClick={() => setArticlePage(p => Math.min(p + 1, totalPages))}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.35rem 0.75rem", opacity: articlePage >= totalPages ? 0.45 : 1, fontSize: "0.82rem" }}
                      >
                        Next <i className="fa-solid fa-chevron-right" style={{ marginLeft: "4px" }}></i>
                      </button>
                    </div>
                  </div>
                );
              })()}
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
