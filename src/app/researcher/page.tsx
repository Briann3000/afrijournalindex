"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../Header";
import Footer from "../Footer";

function ResearcherProfileContent() {
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
        setError(result.error || "Failed to load profile.");
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
        body: JSON.stringify({ articleId })
      });
      const resData = await res.json();
      if (resData.success) {
        // Refresh profile & update local state
        await loadProfile();
        setSearchResults(prev => prev.map(a => a.id === articleId ? { ...a, isClaimedByMe: true } : a));
      } else {
        alert(resData.error || "Failed to claim article.");
      }
    } catch (err) {
      console.error(err);
      alert("Error claiming article.");
    } finally {
      setClaimActionLoading(null);
    }
  };

  const handleUnclaimArticle = async (articleId: string) => {
    setClaimActionLoading(articleId);
    try {
      const res = await fetch("/api/researcher/claim", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId })
      });
      const resData = await res.json();
      if (resData.success) {
        await loadProfile();
        setSearchResults(prev => prev.map(a => a.id === articleId ? { ...a, isClaimedByMe: false } : a));
      } else {
        alert(resData.error || "Failed to remove article.");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing article.");
    } finally {
      setClaimActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
          <p>Loading researcher metrics and citation analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div className="glass-card" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "3rem", color: "var(--color-secondary)", marginBottom: "1.5rem" }}></i>
          <h3>Profile Error</h3>
          <p style={{ margin: "1rem 0", color: "var(--color-text-muted)" }}>{error || "Researcher not found."}</p>
          <a href="/browse" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>Back to Catalog</a>
        </div>
      </div>
    );
  }

  const { profile, metrics, articles } = data;
  const maxCitations = articles.length > 0 ? Math.max(...articles.map((a: any) => a.citationsCount), 1) : 1;
  const isOwner = currentUser && (currentUser.id === profile.id || !id);

  return (
    <div className="theme-dark">
      <Header />

      <main className="container" style={{ padding: "4rem 0 6rem", maxWidth: "950px" }}>
        
        {/* Profile Details Card */}
        <div className="glass-card" style={{ padding: "3rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
            <div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span className="journal-tag" style={{ background: "rgba(212,160,74,0.15)", color: "var(--color-primary)", fontWeight: 600 }}>
                  {profile.role}
                </span>
                {profile.orcid && (
                  <a href={`https://orcid.org/${profile.orcid}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", color: "#4ade80", textDecoration: "none" }}>
                    <i className="fa-brands fa-orcid"></i> orcid.org/{profile.orcid}
                  </a>
                )}
              </div>
              <h1 style={{ fontSize: "2.4rem", margin: "0.5rem 0", color: "#f8f9fa" }}>{profile.name}</h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "1.05rem", margin: "0.3rem 0 0" }}>
                <i className="fa-solid fa-building-columns" style={{ marginRight: "0.5rem", color: "var(--color-primary)" }}></i> {profile.institution || "Researcher"}
              </p>
            </div>

            {/* Metrics Tally Grid */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ padding: "1rem 1.4rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--border-radius-sm)", textAlign: "center", minWidth: "90px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase" }}>h-index</span>
                <span style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-primary)" }}>{metrics.hIndex}</span>
              </div>
              <div style={{ padding: "1rem 1.4rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--border-radius-sm)", textAlign: "center", minWidth: "90px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase" }}>Citations</span>
                <span style={{ fontSize: "2.2rem", fontWeight: "bold", color: "#38bdf8" }}>{metrics.totalCitations}</span>
              </div>
              <div style={{ padding: "1rem 1.4rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--border-radius-sm)", textAlign: "center", minWidth: "90px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase" }}>Papers</span>
                <span style={{ fontSize: "2.2rem", fontWeight: "bold", color: "#f8f9fa" }}>{metrics.publicationsCount}</span>
              </div>
            </div>
          </div>

          {/* Claim / Manage Actions */}
          {isOwner && (
            <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Author Disambiguation: Link your cataloged publications to update your live citation count and $h$-index.
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
                <span>Claim Indexed Publications</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Citation Analytics Chart */}
        {articles.length > 0 && (
          <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "1.2rem", color: "#f8f9fa" }}>
              <i className="fa-solid fa-chart-simple" style={{ color: "var(--color-primary)" }}></i> Citation Distribution & Impact Velocity
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {articles.map((art: any, idx: number) => {
                const percentage = (art.citationsCount / maxCitations) * 100;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "200px", fontSize: "0.85rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "var(--color-text-muted)" }}>
                      {art.title}
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", height: "20px", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div 
                        style={{ 
                          width: `${Math.max(percentage, 5)}%`, 
                          background: `linear-gradient(90deg, var(--color-primary), #38bdf8)`, 
                          height: "100%", 
                          transition: "width 0.8s ease-in-out" 
                        }}
                      />
                    </div>
                    <div style={{ width: "80px", textAlign: "right", fontSize: "0.85rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                      {art.citationsCount} {art.citationsCount === 1 ? "cite" : "cites"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Publications List Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#f8f9fa" }}>Authored Publications List</h3>
          <span className="journal-tag" style={{ background: "rgba(255,255,255,0.05)" }}>
            {articles.length} Indexed Works
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {articles.length === 0 ? (
            <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              No peer-reviewed articles currently claimed for this researcher profile. Click "Claim Indexed Publications" to link your works.
            </div>
          ) : (
            articles.map((art: any, idx: number) => (
              <div className="glass-card" key={idx} style={{ padding: "1.8rem 2rem", display: "flex", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <span className="journal-tag" style={{ background: "rgba(212,160,74,0.12)", color: "var(--color-primary)", marginBottom: "0.5rem", display: "inline-block", fontSize: "0.75rem" }}>
                    {art.journalName}
                  </span>
                  <h4 style={{ fontSize: "1.1rem", margin: "0.2rem 0 0.5rem", lineHeight: "1.4", color: "#f8f9fa" }}>{art.title}</h4>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <span>Published: {new Date(art.publishDate).getFullYear()}</span>
                    {art.doi && (
                      <a href={`https://doi.org/${art.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                        DOI: {art.doi}
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ padding: "0.8rem 1.2rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", textAlign: "center", minWidth: "85px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block" }}>Citations</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--color-primary)" }}>{art.citationsCount}</span>
                  </div>

                  {isOwner && (
                    <button 
                      onClick={() => handleUnclaimArticle(art.id)}
                      disabled={claimActionLoading === art.id}
                      style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}
                      title="Remove from profile"
                    >
                      {claimActionLoading === art.id ? "..." : "Unclaim"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Claim Articles Modal */}
        {showClaimModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem"
            }}
            onClick={() => setShowClaimModal(false)}
          >
            <div 
              style={{
                background: "#0d1117",
                width: "100%",
                maxWidth: "700px",
                maxHeight: "85vh",
                overflowY: "auto",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "2.5rem",
                position: "relative"
              }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowClaimModal(false)}
                style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "transparent", border: "none", color: "var(--color-text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.4rem", color: "#f8f9fa" }}>
                Claim Indexed Publications
              </h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Search through all peer-reviewed articles cataloged in the AfriJournal Index repository. Claimed articles will immediately sync your $h$-index and citations.
              </p>

              <form onSubmit={handleSearchArticles} style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem" }}>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by article title, DOI, or journal..."
                  style={{
                    flex: 1,
                    padding: "0.7rem 1rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    color: "#f8f9fa",
                    outline: "none"
                  }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </button>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {searchResults.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    No matching articles found in repository.
                  </div>
                ) : (
                  searchResults.map(art => (
                    <div 
                      key={art.id} 
                      style={{ 
                        padding: "1rem 1.25rem", 
                        background: "rgba(255,255,255,0.02)", 
                        border: "1px solid rgba(255,255,255,0.05)", 
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 0.3rem", fontSize: "0.95rem", color: "#f8f9fa" }}>{art.title}</h4>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          <span>{art.journalName || "Indexed Journal"}</span> • <span>{art.citationCount} citations</span>
                        </div>
                      </div>

                      <div>
                        {art.isClaimedByMe ? (
                          <button 
                            onClick={() => handleUnclaimArticle(art.id)}
                            disabled={claimActionLoading === art.id}
                            style={{ padding: "0.3rem 0.8rem", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}
                          >
                            <i className="fa-solid fa-check" style={{ marginRight: "0.3rem" }}></i> Claimed
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleClaimArticle(art.id)}
                            disabled={claimActionLoading === art.id}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: "0.8rem", padding: "0.3rem 0.8rem" }}
                          >
                            {claimActionLoading === art.id ? "Claiming..." : "Claim"}
                          </button>
                        )}
                      </div>
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

export default function ResearcherPage() {
  return (
    <Suspense fallback={<div className="theme-dark" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <ResearcherProfileContent />
    </Suspense>
  );
}
