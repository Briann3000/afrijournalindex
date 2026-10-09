"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

function ResearcherProfileContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Claiming Modal State
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [claimActionLoading, setClaimActionLoading] = useState<string | null>(null);

  // Check current session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const sessionData = await res.json();
        if (sessionData.success && sessionData.authenticated) {
          setCurrentUser(sessionData.user);
        }
      } catch {
        // Not logged in
      }
    }
    checkAuth();
  }, []);

  const targetId = id || currentUser?.id || "seed-researcher-1";

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/researcher/profile?id=${encodeURIComponent(targetId)}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || t.researcher_page.not_found_desc);
      }
    } catch (err) {
      console.error(err);
      setError("Error connecting to database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      loadProfile();
    }
  }, [targetId]);

  const handleSearchArticles = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await fetch(`/api/researcher/claim?query=${encodeURIComponent(searchQuery.trim())}`);
      const searchData = await res.json();
      if (searchData.success) {
        setSearchResults(searchData.articles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleClaimArticle = async (articleId: string) => {
    setClaimActionLoading(articleId);
    try {
      const res = await fetch("/api/researcher/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, researcherId: targetId })
      });
      const resData = await res.json();
      if (resData.success) {
        await loadProfile();
        setSearchResults((prev) => prev.filter((a) => a.id !== articleId));
      } else {
        alert(resData.error || "Failed to claim publication.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing claim request.");
    } finally {
      setClaimActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ padding: 0 }}>
        <Header />
        <main className="container" style={{ padding: "8rem 0", textAlign: "center" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2.5rem", color: "var(--color-primary)", marginBottom: "1.2rem" }}></i>
          <h3 style={{ color: "var(--color-text-main)" }}>{t.common.loading}</h3>
          <p style={{ color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
            {t.researcher_page.subtitle}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-wrapper" style={{ padding: 0 }}>
        <Header />
        <main className="container" style={{ padding: "6rem 0", textAlign: "center", maxWidth: "600px" }}>
          <div className="glass-card" style={{ padding: "3rem" }}>
            <i className="fa-solid fa-user-xmark" style={{ fontSize: "3rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
            <h2 style={{ color: "var(--color-text-main)" }}>{t.researcher_page.not_found_title}</h2>
            <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 1.5rem" }}>{error || t.researcher_page.not_found_desc}</p>
            <a href="/" className="btn btn-primary">{t.nav.home}</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { profile, metrics, articles } = data;
  const maxCitations = articles.length > 0 ? Math.max(...articles.map((a: any) => a.citationsCount), 1) : 1;
  const isOwner = currentUser && (currentUser.id === profile.id || !id);

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      <main className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "1000px" }}>
        
        {/* Profile Details Card */}
        <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                <span className="badge badge-blue">
                  {profile.role === "RESEARCHER" ? t.auth.role_researcher : profile.role}
                </span>
                {profile.orcid ? (
                  <a 
                    href={`https://orcid.org/${profile.orcid}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", color: "#16a34a", fontWeight: 600, textDecoration: "none" }}
                  >
                    <i className="fa-brands fa-orcid"></i> orcid.org/{profile.orcid}
                  </a>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{t.researcher_page.no_orcid}</span>
                )}
              </div>
              <h1 style={{ fontSize: "2rem", margin: "0.3rem 0 0.5rem", color: "var(--color-text-main)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {profile.name}
              </h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", margin: "0.3rem 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <i className="fa-solid fa-building-columns" style={{ color: "var(--color-primary)" }}></i> 
                {profile.institution || "African Academic Institution"}
              </p>
            </div>

            {/* Metrics Tally Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", width: "100%", maxWidth: "340px" }}>
              <div style={{ padding: "0.85rem 1rem", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>h-index</span>
                <span style={{ fontSize: "1.75rem", fontWeight: "bold", color: "var(--color-primary)" }}>{metrics.hIndex}</span>
              </div>
              <div style={{ padding: "0.85rem 1rem", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>{t.top_institutions.citations}</span>
                <span style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#0284c7" }}>{metrics.totalCitations}</span>
              </div>
              <div style={{ padding: "0.85rem 1rem", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>{t.top_institutions.publications}</span>
                <span style={{ fontSize: "1.75rem", fontWeight: "bold", color: "var(--color-text-main)" }}>{metrics.publicationsCount}</span>
              </div>
            </div>
          </div>

          {/* Claim / Manage Actions */}
          {isOwner && (
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <span style={{ fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
                {t.researcher_page.subtitle}
              </span>
              <button 
                onClick={() => {
                  setShowClaimModal(true);
                  if (searchResults.length === 0) {
                    fetch("/api/researcher/claim").then(r => r.json()).then(d => {
                      if (d.success) setSearchResults(d.articles || []);
                    });
                  }
                }}
                className="btn btn-primary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <i className="fa-solid fa-plus-circle"></i>
                <span>{t.researcher_page.claim_btn}</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Citation Analytics Chart */}
        {articles.length > 0 && (
          <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
            <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "1.15rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <i className="fa-solid fa-chart-simple" style={{ color: "var(--color-primary)" }}></i> 
              {t.top_institutions.citations} &amp; {t.valprop.if_title}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {articles.map((art: any, idx: number) => {
                const percentage = (art.citationsCount / maxCitations) * 100;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px", fontSize: "0.85rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "var(--color-text-body)", fontWeight: 500 }}>
                      {art.title}
                    </div>
                    <div style={{ flex: "2 1 200px", background: "var(--color-bg-base)", height: "18px", borderRadius: "9px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                      <div 
                        style={{ 
                          width: `${Math.max(percentage, 5)}%`, 
                          height: "100%", 
                          background: "linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
                          borderRadius: "9px"
                        }}
                      />
                    </div>
                    <div style={{ width: "80px", textAlign: "right", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-primary)" }}>
                      {art.citationsCount} {t.researcher_page.citations_label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Authored Articles Repository */}
        <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <i className="fa-solid fa-book-open" style={{ color: "var(--color-primary)" }}></i>
            {t.researcher_page.articles_heading} ({articles.length})
          </h2>

          {articles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-file-circle-question" style={{ fontSize: "2.5rem", marginBottom: "0.8rem", color: "var(--color-text-lighter)" }}></i>
              <p>{t.researcher_page.no_articles_found}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {articles.map((art: any) => (
                <div 
                  key={art.id} 
                  style={{
                    padding: "1.25rem",
                    borderRadius: "var(--border-radius-sm)",
                    background: "var(--color-bg-base)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.4rem" }}>
                      {art.title}
                    </h4>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
                      <span>{t.researcher_page.published_in} <strong>{art.journal?.name || "AfriJournal Repository"}</strong></span>
                      {art.publishedYear && <span>• {art.publishedYear}</span>}
                      {art.doi && (
                        <span>
                          • DOI: <a href={`https://doi.org/${art.doi}`} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>{art.doi}</a>
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)", display: "block" }}>
                        {art.citationsCount}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                        {t.researcher_page.citations_label}
                      </span>
                    </div>
                    <span style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", background: "#dcfce7", color: "#15803d", fontSize: "0.75rem", fontWeight: 700 }}>
                      <i className="fa-solid fa-circle-check"></i> {t.researcher_page.claimed_badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Claim Article Modal */}
        {showClaimModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem"
            }}
          >
            <div 
              className="card-surface" 
              style={{
                width: "100%",
                maxWidth: "680px",
                maxHeight: "85vh",
                overflowY: "auto",
                padding: "2rem",
                borderRadius: "16px",
                position: "relative",
                background: "#ffffff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--color-primary)", marginRight: "8px" }}></i>
                  {t.researcher_page.claim_modal_title}
                </h3>
                <button 
                  onClick={() => setShowClaimModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--color-text-muted)" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchArticles} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t.researcher_page.claim_search_placeholder}
                  className="form-control"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: "0 1.2rem", whiteSpace: "nowrap" }} disabled={searching}>
                  {searching ? t.researcher_page.searching : t.researcher_page.claim_search_btn}
                </button>
              </form>

              {/* Results List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {searchResults.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
                    {searching ? t.researcher_page.searching : t.researcher_page.no_articles_found}
                  </p>
                ) : (
                  searchResults.map(art => (
                    <div 
                      key={art.id}
                      style={{
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-bg-base)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.92rem" }}>
                          {art.title}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                          {art.journal?.name} • DOI: {art.doi || "N/A"}
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaimArticle(art.id)}
                        disabled={claimActionLoading === art.id}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }}
                      >
                        {claimActionLoading === art.id ? t.common.loading : t.researcher_page.claim_action}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function ResearcherProfilePage() {
  return (
    <Suspense fallback={<div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <ResearcherProfileContent />
    </Suspense>
  );
}
