"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../Header";
import Footer from "../Footer";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const typeParam = searchParams.get("type");

  const [activeTab, setActiveTab] = useState<"all" | "articles" | "journals" | "scholars">(
    typeParam === "articles" || typeParam === "journals" || typeParam === "scholars" ? typeParam : "all"
  );
  const [searchTerm, setSearchTerm] = useState<string>(query);
  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<{
    journals: any[];
    scholars: any[];
    articles: any[];
    totalJournals: number;
    totalScholars: number;
    totalArticles: number;
  }>({
    journals: [],
    scholars: [],
    articles: [],
    totalJournals: 0,
    totalScholars: 0,
    totalArticles: 0
  });

  // Sync active tab if type query param changes
  useEffect(() => {
    if (typeParam === "articles" || typeParam === "journals" || typeParam === "scholars") {
      setActiveTab(typeParam);
    }
  }, [typeParam]);

  useEffect(() => {
    async function fetchResults() {
      if (!query.trim()) {
        setResults({ journals: [], scholars: [], articles: [], totalJournals: 0, totalScholars: 0, totalArticles: 0 });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.success) {
          const fetchedResults = {
            journals: json.journals || [],
            scholars: json.scholars || [],
            articles: json.articles || [],
            totalJournals: json.totalJournals || 0,
            totalScholars: json.totalScholars || 0,
            totalArticles: json.totalArticles || 0
          };
          setResults(fetchedResults);

          // Smart Auto-Fallback: If URL requested a specific category with 0 matches, but other categories have matches, auto-show "all"
          const total = fetchedResults.totalArticles + fetchedResults.totalJournals + fetchedResults.totalScholars;
          if (typeParam && typeParam !== "all" && total > 0) {
            const countForType = typeParam === "articles" 
              ? fetchedResults.totalArticles 
              : typeParam === "journals" 
              ? fetchedResults.totalJournals 
              : fetchedResults.totalScholars;
            if (countForType === 0) {
              setActiveTab("all");
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch search results:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const typePart = activeTab !== "all" ? `&type=${activeTab}` : "";
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}${typePart}`);
    }
  };

  const handleTabChange = (newTab: "all" | "articles" | "journals" | "scholars") => {
    setActiveTab(newTab);
    if (query.trim()) {
      const typePart = newTab !== "all" ? `&type=${newTab}` : "";
      router.push(`/search?q=${encodeURIComponent(query.trim())}${typePart}`);
    }
  };

  const totalResults = results.totalArticles + results.totalJournals + results.totalScholars;

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, padding: "2.5rem 2rem", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
        {/* Search Input Bar */}
        <div style={{ maxWidth: "780px", margin: "0 auto 2.5rem" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.6rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search across African articles, journals, and scholars..."
                className="form-control"
                style={{ width: "100%", height: "46px", padding: "0 1rem 0 2.6rem", borderRadius: "10px", fontSize: "0.95rem" }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-primary)" }}></i>
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: "0 1.5rem", borderRadius: "10px", fontWeight: 700 }}>
              Search
            </button>
          </form>

          {query && (
            <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
              Found <strong>{totalResults}</strong> result{totalResults !== 1 ? "s" : ""} for &quot;<span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>{query}</span>&quot;
            </div>
          )}
        </div>

        {/* Filter Tabs: All, Articles, Journals, Scholars */}
        {query && (
          <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border)", marginBottom: "2rem", overflowX: "auto" }}>
            <button
              onClick={() => handleTabChange("all")}
              style={{
                background: "none",
                border: "none",
                padding: "0.65rem 1.2rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: activeTab === "all" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === "all" ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              All Results ({totalResults})
            </button>
            <button
              onClick={() => handleTabChange("articles")}
              style={{
                background: "none",
                border: "none",
                padding: "0.65rem 1.2rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: activeTab === "articles" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === "articles" ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-file-lines" style={{ fontSize: "0.8rem" }}></i>
              Articles ({results.totalArticles})
            </button>
            <button
              onClick={() => handleTabChange("journals")}
              style={{
                background: "none",
                border: "none",
                padding: "0.65rem 1.2rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: activeTab === "journals" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === "journals" ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-book-journal-whills" style={{ fontSize: "0.8rem" }}></i>
              Journals ({results.totalJournals})
            </button>
            <button
              onClick={() => handleTabChange("scholars")}
              style={{
                background: "none",
                border: "none",
                padding: "0.65rem 1.2rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: activeTab === "scholars" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === "scholars" ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <i className="fa-solid fa-user-graduate" style={{ fontSize: "0.8rem" }}></i>
              African Scholars ({results.totalScholars})
            </button>

            <a
              href={`https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "auto",
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.25)",
                borderRadius: "8px",
                padding: "0.4rem 0.85rem",
                fontWeight: 700,
                fontSize: "0.82rem",
                color: "#2563eb",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap"
              }}
              title="Search across all global uncurated web literature on Google Scholar"
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span>Google Scholar</span>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem" }}></i>
            </a>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <p>Searching African index repository...</p>
          </div>
        ) : !query ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
            <p>Type keywords to search across African articles, journals, and verified scholars.</p>
          </div>
        ) : totalResults === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
            <i className="fa-solid fa-book-open" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
            <h3 style={{ color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>No results found</h3>
            <p>We could not find any articles, journals, or scholars matching &quot;{query}&quot;.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Smart Zero-Result Category Fallback Alert */}
            {activeTab !== "all" && results[activeTab]?.length === 0 && totalResults > 0 && (
              <div 
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid #fde68a",
                  borderRadius: "12px",
                  padding: "1.2rem 1.5rem",
                  boxShadow: "0 4px 15px -3px rgba(245, 158, 11, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                    <i className="fa-solid fa-lightbulb"></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                      No direct matches under {activeTab === "articles" ? "Articles" : activeTab === "journals" ? "Journals" : "African Scholars"}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      We found <strong>{totalResults}</strong> result{totalResults !== 1 ? "s" : ""} across other African categories:
                      {results.totalArticles > 0 && ` ${results.totalArticles} articles`}
                      {results.totalJournals > 0 && ` • ${results.totalJournals} journals`}
                      {results.totalScholars > 0 && ` • ${results.totalScholars} scholars`}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleTabChange("all")}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: "0.82rem", padding: "0.4rem 0.9rem" }}
                  >
                    View All Results ({totalResults})
                  </button>
                  {results.totalArticles > 0 && activeTab !== "articles" && (
                    <button
                      type="button"
                      onClick={() => handleTabChange("articles")}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}
                    >
                      View Articles ({results.totalArticles})
                    </button>
                  )}
                  {results.totalJournals > 0 && activeTab !== "journals" && (
                    <button
                      type="button"
                      onClick={() => handleTabChange("journals")}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}
                    >
                      View Journals ({results.totalJournals})
                    </button>
                  )}
                  {results.totalScholars > 0 && activeTab !== "scholars" && (
                    <button
                      type="button"
                      onClick={() => handleTabChange("scholars")}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}
                    >
                      View Scholars ({results.totalScholars})
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* 1. ARTICLES SECTION */}
            {(activeTab === "all" || activeTab === "articles") && results.articles.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-file-lines" style={{ color: "var(--color-primary)", fontSize: "1.1rem" }}></i>
                    <span>Peer-Reviewed Articles</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>({results.totalArticles})</span>
                  </h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {results.articles.map(article => (
                    <div
                      key={article.id}
                      className="card-surface"
                      style={{
                        padding: "1.25rem 1.5rem",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                        <a 
                          href={`https://scholar.google.com/scholar?q=${encodeURIComponent(article.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                          title="Search on Google Scholar"
                        >
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)", lineHeight: 1.4 }}>
                            {article.title}
                          </h3>
                        </a>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <span style={{
                            background: "rgba(2, 132, 199, 0.08)",
                            color: "#0284c7",
                            border: "1px solid rgba(2, 132, 199, 0.2)",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            whiteSpace: "nowrap"
                          }} title="Verified peer-reviewed citations cataloged in AfriJournal Index">
                            <i className="fa-solid fa-quote-right" style={{ marginRight: "4px" }}></i>
                            {article.citationCount || 0} African cites
                          </span>
                          <a
                            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(article.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "0.74rem",
                              color: "var(--color-text-muted)",
                              textDecoration: "none",
                              padding: "0.2rem 0.45rem",
                              borderRadius: "4px",
                              border: "1px solid var(--color-border)",
                              background: "var(--color-bg-card-subtle)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="Inspect global web citations on Google Scholar"
                          >
                            <span>Google Scholar</span>
                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem" }}></i>
                          </a>
                        </div>
                      </div>

                      {/* Journal & Metadata attribution */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {article.journal && (
                          <a 
                            href={`/journal/${article.journal.id}`}
                            style={{ fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}
                          >
                            <i className="fa-solid fa-book-journal-whills" style={{ marginRight: "4px" }}></i>
                            {article.journal.name}
                          </a>
                        )}
                        {article.journal?.country && (
                          <>
                            <span>•</span>
                            <span>{article.journal.country}</span>
                          </>
                        )}
                        {article.year && (
                          <>
                            <span>•</span>
                            <span>Published {article.year}</span>
                          </>
                        )}
                        {article.journal?.qualityGrade && (
                          <>
                            <span>•</span>
                            <span style={{ 
                              fontSize: "0.7rem", 
                              fontWeight: 700, 
                              padding: "1px 5px", 
                              borderRadius: "4px", 
                              background: "rgba(245, 158, 11, 0.1)", 
                              color: "#d97706",
                              border: "1px solid rgba(245, 158, 11, 0.25)" 
                            }}>
                              Grade {article.journal.qualityGrade}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Abstract snippet */}
                      {article.abstract && (
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-body)", lineHeight: 1.5 }}>
                          {article.abstract}
                        </p>
                      )}

                      {/* Action Links: Google Scholar / DOI / Journal Dossier */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "0.2rem", flexWrap: "wrap", fontSize: "0.8rem" }}>
                        <a 
                          href={`https://scholar.google.com/scholar?q=${encodeURIComponent(article.title)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.25rem 0.75rem", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <i className="fa-solid fa-graduation-cap" style={{ color: "var(--color-primary)" }}></i>
                          Google Scholar
                        </a>
                        {article.doi && (
                          <a 
                            href={`https://doi.org/${article.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.72rem" }}></i>
                            DOI: {article.doi}
                          </a>
                        )}
                        {article.journal && (
                          <a 
                            href={`/journal/${article.journal.id}`}
                            style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600, marginLeft: "auto" }}
                          >
                            View Journal Dossier <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.7rem", marginLeft: "2px" }}></i>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. JOURNALS SECTION */}
            {(activeTab === "all" || activeTab === "journals") && results.journals.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-book-journal-whills" style={{ color: "#f59e0b", fontSize: "1.1rem" }}></i>
                    <span>Journals</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>({results.totalJournals})</span>
                  </h2>
                  <a href={`/browse?q=${encodeURIComponent(query)}`} className="btn btn-secondary btn-sm" style={{ fontSize: "0.8rem" }}>
                    View all journals in Browse <i className="fa-solid fa-arrow-right" style={{ marginLeft: "4px" }}></i>
                  </a>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                  {results.journals.map(journal => (
                    <a
                      key={journal.id}
                      href={`/journal/${journal.id}`}
                      className="card-surface"
                      style={{
                        padding: "1.2rem",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border)",
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                        <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                          {journal.name}
                        </div>
                        <span style={{ 
                          fontSize: "0.72rem", 
                          fontWeight: 700, 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          background: "rgba(245, 158, 11, 0.1)", 
                          color: "#d97706",
                          border: "1px solid rgba(245, 158, 11, 0.25)" 
                        }}>
                          Grade {journal.qualityGrade}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {journal.publisherName || "African Academic Publisher"} • {journal.country}
                      </div>
                      {journal.ajciScore && (
                        <div style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: 600 }}>
                          AJCI Score: {Number(journal.ajciScore).toFixed(3)}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SCHOLARS SECTION */}
            {(activeTab === "all" || activeTab === "scholars") && results.scholars.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-user-graduate" style={{ color: "var(--color-primary)", fontSize: "1.1rem" }}></i>
                    <span>African Scholars</span>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>({results.totalScholars})</span>
                  </h2>
                  <a href={`/scholars?q=${encodeURIComponent(query)}`} className="btn btn-secondary btn-sm" style={{ fontSize: "0.8rem" }}>
                    View all scholars in Directory <i className="fa-solid fa-arrow-right" style={{ marginLeft: "4px" }}></i>
                  </a>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                  {results.scholars.map(scholar => (
                    <a
                      key={scholar.id}
                      href={`/researcher?id=${scholar.id}`}
                      className="card-surface"
                      style={{
                        padding: "1.2rem",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border)",
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        gap: "0.85rem",
                        alignItems: "flex-start",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div 
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--color-primary), #0369a1)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.9rem",
                          flexShrink: 0
                        }}
                      >
                        {scholar.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                          {scholar.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "2px 0 6px" }}>
                          {scholar.institution}
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.78rem" }}>
                          <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>{scholar.totalCitations.toLocaleString()} citations</span>
                          <span style={{ color: "var(--color-border)" }}>•</span>
                          <span style={{ fontWeight: 700, color: "#16a34a" }}>h-{scholar.hIndex}</span>
                          <span style={{ color: "var(--color-border)" }}>•</span>
                          <span style={{ color: "var(--color-text-muted)" }}>{scholar.articlesCount} papers</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Google Scholar Global Search Bridge */}
            {query && (
              <div style={{
                marginTop: "2.5rem",
                background: "rgba(59, 130, 246, 0.05)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "14px",
                padding: "1.25rem 1.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem"
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                    <i className="fa-solid fa-graduation-cap" style={{ color: "#3b82f6", marginRight: "8px" }}></i>
                    Looking for literature beyond indexed African journals?
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "3px" }}>
                    Search &quot;{query}&quot; across open-web papers, global preprints, and non-indexed repositories on Google Scholar.
                  </div>
                </div>
                <a
                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.82rem", padding: "0.45rem 1rem", fontWeight: 700, color: "#2563eb", borderColor: "rgba(59, 130, 246, 0.3)" }}
                >
                  Search on Google Scholar <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginLeft: "4px", fontSize: "0.7rem" }}></i>
                </a>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
