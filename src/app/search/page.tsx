"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../Header";
import Footer from "../Footer";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState<"all" | "journals" | "scholars">("all");
  const [searchTerm, setSearchTerm] = useState<string>(query);
  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<{
    journals: any[];
    scholars: any[];
    totalJournals: number;
    totalScholars: number;
  }>({
    journals: [],
    scholars: [],
    totalJournals: 0,
    totalScholars: 0
  });

  useEffect(() => {
    async function fetchResults() {
      if (!query.trim()) {
        setResults({ journals: [], scholars: [], totalJournals: 0, totalScholars: 0 });
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const json = await res.json();
        if (json.success) {
          setResults({
            journals: json.journals || [],
            scholars: json.scholars || [],
            totalJournals: json.totalJournals || 0,
            totalScholars: json.totalScholars || 0
          });
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
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const totalResults = results.totalJournals + results.totalScholars;

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
                placeholder="Search across African journals, scholars, and institutions..."
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

        {/* Filter Tabs: All, Journals, Scholars */}
        {query && (
          <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border)", marginBottom: "2rem" }}>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                background: "none",
                border: "none",
                padding: "0.65rem 1.2rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: activeTab === "all" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === "all" ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              All Results ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab("journals")}
              style={{
                background: "none",
                border: "none",
                padding: "0.65rem 1.2rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: activeTab === "journals" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === "journals" ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              Journals ({results.totalJournals})
            </button>
            <button
              onClick={() => setActiveTab("scholars")}
              style={{
                background: "none",
                border: "none",
                padding: "0.65rem 1.2rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                color: activeTab === "scholars" ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === "scholars" ? "2px solid var(--color-primary)" : "2px solid transparent",
                cursor: "pointer"
              }}
            >
              African Scholars ({results.totalScholars})
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <p>Searching African index...</p>
          </div>
        ) : !query ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
            <p>Type keywords to search across African journals and verified scholars.</p>
          </div>
        ) : totalResults === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
            <i className="fa-solid fa-book-open" style={{ fontSize: "2.5rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
            <h3 style={{ color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>No results found</h3>
            <p>We could not find any journals or scholars matching &quot;{query}&quot;.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* 1. SCHOLARS SECTION */}
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
