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
      <div style={{ background: "var(--color-bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-main)" }}>
        <div style={{ textAlign: "center" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
          <p>Loading researcher metrics and citation analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "var(--color-bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-main)" }}>
        <div className="glass-card" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "3rem", color: "var(--color-secondary)", marginBottom: "1.5rem" }}></i>
          <h3 style={{ color: "var(--color-text-main)" }}>Profile Error</h3>
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
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      <main className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "1000px" }}>
        
        {/* Profile Details Card */}
        <div className="card-surface" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
            <div>
              <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                <span className="badge badge-blue">
                  {profile.role}
                </span>
                {profile.orcid && (
                  <a 
                    href={`https://orcid.org/${profile.orcid}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", color: "#16a34a", fontWeight: 600, textDecoration: "none" }}
                  >
                    <i className="fa-brands fa-orcid"></i> orcid.org/{profile.orcid}
                  </a>
                )}
              </div>
              <h1 style={{ fontSize: "2.2rem", margin: "0.3rem 0 0.5rem", color: "var(--color-text-main)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {profile.name}
              </h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", margin: "0.3rem 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <i className="fa-solid fa-building-columns" style={{ color: "var(--color-primary)" }}></i> 
                {profile.institution || "African Academic Institution"}
              </p>
            </div>

            {/* Metrics Tally Grid */}
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ padding: "1rem 1.4rem", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--border-radius-sm)", textAlign: "center", minWidth: "95px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>h-index</span>
                <span style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-primary)" }}>{metrics.hIndex}</span>
              </div>
              <div style={{ padding: "1rem 1.4rem", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--border-radius-sm)", textAlign: "center", minWidth: "95px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Citations</span>
                <span style={{ fontSize: "2rem", fontWeight: "bold", color: "#0284c7" }}>{metrics.totalCitations}</span>
              </div>
              <div style={{ padding: "1rem 1.4rem", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--border-radius-sm)", textAlign: "center", minWidth: "95px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Papers</span>
                <span style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-text-main)" }}>{metrics.publicationsCount}</span>
              </div>
            </div>
          </div>

          {/* Claim / Manage Actions */}
          {isOwner && (
            <div style={{ marginTop: "2rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <span style={{ fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
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
          <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "1.15rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <i className="fa-solid fa-chart-simple" style={{ color: "var(--color-primary)" }}></i> 
              Citation Distribution &amp; Impact Velocity
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {articles.map((art: any, idx: number) => {
                const percentage = (art.citationsCount / maxCitations) * 100;
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "220px", fontSize: "0.85rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "var(--color-text-body)", fontWeight: 500 }}>
                      {art.title}
                    </div>
                    <div style={{ flex: 1, background: "var(--color-bg-base)", height: "18px", borderRadius: "9px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--color-text-main)", fontWeight: 700 }}>
            Authored Publications List
          </h3>
          <span className="badge badge-slate">
            {articles.length} Indexed Works
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {articles.length === 0 ? (
            <div className="card-surface" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              No peer-reviewed articles currently claimed for this researcher profile. Click "Claim Indexed Publications" to link your works.
            </div>
          ) : (
            articles.map((art: any, idx: number) => (
              <div className="card-surface" key={idx} style={{ padding: "1.5rem 1.8rem", display: "flex", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <span className="journal-tag" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
                    {art.journalName}
                  </span>
                  <h4 style={{ fontSize: "1.05rem", margin: "0.2rem 0 0.4rem", lineHeight: "1.4", color: "var(--color-text-main)", fontWeight: 700 }}>
                    {art.title}
                  </h4>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                    <span>Published: {new Date(art.publishDate).getFullYear()}</span>
                    {art.doi && (
                      <a href={`https://doi.org/${art.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>
                        DOI: {art.doi}
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ padding: "0.6rem 1rem", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "6px", textAlign: "center", minWidth: "80px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", display: "block", textTransform: "uppercase", fontWeight: 600 }}>Citations</span>
                    <span style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--color-primary)" }}>{art.citationsCount}</span>
                  </div>

                  {isOwner && (
                    <button 
                      onClick={() => handleUnclaimArticle(art.id)}
                      disabled={claimActionLoading === art.id}
                      style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.45rem 0.85rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
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
              backgroundColor: "rgba(15, 23, 42, 0.75)",
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
                background: "#ffffff",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "85vh",
                overflowY: "auto",
                borderRadius: "14px",
                border: "1px solid var(--color-border)",
                padding: "2.2rem",
                position: "relative",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
              }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowClaimModal(false)}
                style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "transparent", border: "none", color: "var(--color-text-muted)", fontSize: "1.3rem", cursor: "pointer" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.3rem", color: "var(--color-text-main)", fontWeight: 800 }}>
                Claim Indexed Publications
              </h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                Search through all peer-reviewed articles cataloged in the AfriJournal Index repository. Claimed articles will immediately sync your $h$-index and citations.
              </p>

              <form onSubmit={handleSearchArticles} style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem" }}>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by article title, DOI, or journal..."
                  className="form-control"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={searching} style={{ whiteSpace: "nowrap" }}>
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
                        background: "var(--color-bg-base)", 
                        border: "1px solid var(--color-border)", 
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 0.3rem", fontSize: "0.95rem", color: "var(--color-text-main)", fontWeight: 700 }}>{art.title}</h4>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                          <span>{art.journalName || "Indexed Journal"}</span> • <span>{art.citationCount} citations</span>
                        </div>
                      </div>

                      <div>
                        {art.isClaimedByMe ? (
                          <button 
                            onClick={() => handleUnclaimArticle(art.id)}
                            disabled={claimActionLoading === art.id}
                            style={{ padding: "0.35rem 0.85rem", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            <i className="fa-solid fa-check" style={{ marginRight: "0.3rem" }}></i> Claimed
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleClaimArticle(art.id)}
                            disabled={claimActionLoading === art.id}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: "0.8rem", padding: "0.35rem 0.85rem" }}
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
    <Suspense fallback={<div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <ResearcherProfileContent />
    </Suspense>
  );
}
