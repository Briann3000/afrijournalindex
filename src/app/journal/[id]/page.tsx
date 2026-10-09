"use client";

import React, { useEffect, useState, use } from "react";
import Header from "../../Header";
import Footer from "../../Footer";
import { useLang } from "../../LangContext";

interface JournalDetail {
  id: string;
  name: string;
  issn: string | null;
  eissn: string | null;
  description: string;
  publisherName: string;
  country: string;
  frequency: string;
  websiteUrl: string;
  isIndexed: boolean;
  qualityGrade: string | null;
  indexedAt: string | null;
  latestReport: {
    year: number;
    standardScore: number;
    regionalScore: number;
    citationCount: number;
    articleCount: number;
  } | null;
  historicalReports: Array<{
    year: number;
    standardScore: number;
    regionalScore: number;
    citationCount: number;
    articleCount: number;
  }>;
  articles: Array<{
    id: string;
    title: string;
    doi: string | null;
    publishDate: string;
    citationCount: number;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      institution: string | null;
      role: string;
    };
  }>;
}

export default function JournalPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { t } = useLang();
  const jp = t.journal_page;

  const [journal, setJournal] = useState<JournalDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [commentContent, setCommentContent] = useState<string>("");
  const [postingComment, setPostingComment] = useState<boolean>(false);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);

  // Load journal data
  useEffect(() => {
    async function fetchJournal() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/journals/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.journal) {
          setJournal(data.journal);
        } else {
          setError(data.error || "Journal not found.");
        }
      } catch (err: any) {
        console.error("Failed to load journal:", err);
        setError("Network error while loading journal details.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchJournal();
    }
  }, [id]);

  // Check user session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.authenticated) {
          setUser(data.user);
        }
      } catch {
        // Not logged in
      }
    }
    checkAuth();
  }, []);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !journal) return;

    setPostingComment(true);
    setCommentSuccess(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId: journal.id,
          content: commentContent.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setJournal(prev => prev ? {
          ...prev,
          comments: [data.comment, ...prev.comments]
        } : null);
        setCommentContent("");
        setCommentSuccess("Your review has been posted successfully.");
      } else {
        alert(data.error || "Failed to post comment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting comment.");
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div className="theme-dark">
      <Header />

      <main className="container" style={{ padding: "3rem 0 5rem", maxWidth: "1050px" }}>
        {/* Back Link */}
        <div style={{ marginBottom: "2rem" }}>
          <a 
            href="/browse" 
            style={{ 
              color: "var(--color-primary)", 
              textDecoration: "none", 
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> {jp.back_to_browse || "Back to Browse Directory"}
          </a>
        </div>

        {loading ? (
          <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", color: "var(--color-primary)", marginBottom: "1rem" }}>
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            </div>
            <p style={{ color: "var(--color-text-muted)" }}>Loading journal repository records...</p>
          </div>
        ) : error || !journal ? (
          <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
            <i className="fa-solid fa-book-open" style={{ fontSize: "3rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}></i>
            <h2 style={{ marginBottom: "0.5rem" }}>{jp.not_found_title || "Journal Not Found"}</h2>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
              {jp.not_found_desc || "The requested journal could not be located in the AfriJournal Index registry."}
            </p>
            <a href="/browse" className="btn btn-primary">
              {jp.back_to_browse || "Back to Browse Directory"}
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* 1. Hero & Verified Metadata Card */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "1.5rem" }}>
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1rem" }}>
                    <span className="journal-tag" style={{ backgroundColor: "rgba(212,160,74,0.15)", color: "var(--color-primary)", border: "1px solid rgba(212,160,74,0.3)", fontWeight: 600 }}>
                      <i className="fa-solid fa-certificate" style={{ marginRight: "0.3rem" }}></i>
                      {journal.isIndexed ? (jp.indexed_badge || "Verified Indexed Journal") : (jp.unindexed_badge || "Pending Evaluation")}
                    </span>
                    {journal.qualityGrade && (
                      <span className="journal-tag" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#e2e2e9" }}>
                        {jp.grade || "Quality Grade"}: <strong>{journal.qualityGrade}</strong>
                      </span>
                    )}
                    <span className="journal-tag" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)" }}>
                      <i className="fa-solid fa-location-dot" style={{ marginRight: "0.3rem" }}></i> {journal.country}
                    </span>
                    <span className="journal-tag" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)" }}>
                      <i className="fa-solid fa-calendar-days" style={{ marginRight: "0.3rem" }}></i> {journal.frequency}
                    </span>
                  </div>

                  <h1 style={{ fontSize: "2rem", fontWeight: 700, lineHeight: "1.3", margin: "0 0 1rem", color: "#f8f9fa" }}>
                    {journal.name}
                  </h1>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.8rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    <div>
                      <strong style={{ color: "#e2e2e9" }}>{jp.publisher || "Publisher"}:</strong> {journal.publisherName}
                    </div>
                    {journal.issn && (
                      <div>
                        <strong style={{ color: "#e2e2e9" }}>{jp.issn_print || "Print ISSN"}:</strong> {journal.issn}
                      </div>
                    )}
                    {journal.eissn && (
                      <div>
                        <strong style={{ color: "#e2e2e9" }}>{jp.issn_electronic || "Electronic ISSN"}:</strong> {journal.eissn}
                      </div>
                    )}
                  </div>
                </div>

                {journal.websiteUrl && (
                  <div>
                    <a 
                      href={journal.websiteUrl.startsWith("http") ? journal.websiteUrl : `https://${journal.websiteUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}
                    >
                      <span>{jp.visit_website || "Visit Official Website"}</span>
                      <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.8rem" }}></i>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 2. AJIF Impact Metrics Dashboard */}
            <div className="glass-card" style={{ padding: "2.5rem", background: "linear-gradient(135deg, rgba(212,160,74,0.04), rgba(255,255,255,0.02))" }}>
              <div style={{ marginBottom: "1.8rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.6rem", margin: "0 0 0.4rem" }}>
                  <i className="fa-solid fa-chart-line"></i> {jp.impact_metrics_title || "AJIF Impact Metrics"}
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                  {jp.impact_metrics_desc || "Calculated using 2-year citation window with Africa-weighted regional multiplier"}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                {/* Standard AJIF */}
                <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {jp.standard_ajif || "Standard AJIF Score"}
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-primary)" }}>
                    {journal.latestReport?.standardScore !== undefined ? journal.latestReport.standardScore.toFixed(3) : "0.000"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    2-Year Citation Window
                  </div>
                </div>

                {/* Regional AJIF */}
                <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(212,160,74,0.2)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-primary)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    {jp.regional_ajif || "Regional Weighted Score"}
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#f8f9fa" }}>
                    {journal.latestReport?.regionalScore !== undefined ? journal.latestReport.regionalScore.toFixed(3) : "0.000"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    +15% Africa Open-Access Weight
                  </div>
                </div>

                {/* Citable Articles */}
                <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {jp.citable_articles || "Citable Articles"}
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#e2e2e9" }}>
                    {journal.latestReport?.articleCount ?? journal.articles.length}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    Cataloged Publications
                  </div>
                </div>

                {/* Citations Received */}
                <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {jp.citations_received || "Citations Received"}
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#e2e2e9" }}>
                    {journal.latestReport?.citationCount ?? journal.articles.reduce((acc, a) => acc + a.citationCount, 0)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    Incoming Verified Citations
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Scope & Editorial Card */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#f8f9fa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <i className="fa-solid fa-align-left" style={{ color: "var(--color-primary)" }}></i>
                {jp.scope_title || "Scope & Editorial Focus"}
              </h2>
              <p style={{ color: "var(--color-text-muted)", lineHeight: "1.8", fontSize: "0.95rem", margin: 0 }}>
                {journal.description || "No specific scope statement cataloged for this journal."}
              </p>
            </div>

            {/* 4. Indexed Articles & CrossRef DOIs */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8f9fa", margin: "0 0 0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-newspaper" style={{ color: "var(--color-primary)" }}></i>
                    {jp.articles_title || "Indexed Articles & Publications"}
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    {jp.articles_desc || "Articles cataloged in the indexing repository with verified DOI records and citation counts"}
                  </p>
                </div>
                <span className="journal-tag" style={{ backgroundColor: "rgba(212,160,74,0.1)", color: "var(--color-primary)" }}>
                  {journal.articles.length} {jp.citable_articles || "Articles"}
                </span>
              </div>

              {journal.articles.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "var(--border-radius-sm)" }}>
                  {jp.no_articles || "No articles registered in the citation window yet."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {journal.articles.map(article => (
                    <div 
                      key={article.id} 
                      style={{ 
                        padding: "1.25rem 1.5rem", 
                        background: "rgba(255,255,255,0.02)", 
                        border: "1px solid rgba(255,255,255,0.05)", 
                        borderRadius: "var(--border-radius-sm)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem"
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "250px" }}>
                        <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#f8f9fa", fontWeight: 600, lineHeight: "1.4" }}>
                          {article.title}
                        </h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                          <span>
                            <i className="fa-regular fa-calendar" style={{ marginRight: "0.3rem" }}></i>
                            {new Date(article.publishDate).getFullYear()}
                          </span>
                          {article.doi && (
                            <span style={{ fontFamily: "monospace", color: "var(--color-primary)" }}>
                              DOI: {article.doi}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span 
                          style={{ 
                            padding: "0.3rem 0.8rem", 
                            background: "rgba(212,160,74,0.12)", 
                            border: "1px solid rgba(212,160,74,0.25)", 
                            color: "var(--color-primary)", 
                            borderRadius: "20px", 
                            fontSize: "0.8rem",
                            fontWeight: 600
                          }}
                        >
                          {article.citationCount} {jp.citations || "Citations"}
                        </span>
                        {article.doi && (
                          <a 
                            href={`https://doi.org/${article.doi}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary btn-sm"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}
                          >
                            <span>{jp.view_doi || "View Article / DOI"}</span>
                            <i className="fa-solid fa-up-right-from-square" style={{ fontSize: "0.7rem" }}></i>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Peer Reviews & Community Discussions */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8f9fa", margin: "0 0 0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <i className="fa-solid fa-comments" style={{ color: "var(--color-primary)" }}></i>
                  {jp.reviews_title || "Peer Review & Community Discussions"}
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                  {jp.reviews_desc || "Academic discussions, peer review feedback, and indexing notes from verified researchers"}
                </p>
              </div>

              {/* Existing Comments */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                {journal.comments.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", background: "rgba(255,255,255,0.02)", borderRadius: "var(--border-radius-sm)" }}>
                    {jp.no_reviews || "No discussions recorded yet for this journal. Be the first to post a review!"}
                  </div>
                ) : (
                  journal.comments.map(comment => (
                    <div 
                      key={comment.id} 
                      style={{ 
                        padding: "1.25rem 1.5rem", 
                        background: "rgba(255,255,255,0.02)", 
                        borderLeft: "3px solid var(--color-primary)", 
                        borderRadius: "0 var(--border-radius-sm) var(--border-radius-sm) 0" 
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span style={{ fontWeight: "bold", color: "#f8f9fa" }}>
                          {comment.author.name} <span style={{ fontWeight: "normal", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>({comment.author.institution || "Researcher"})</span>
                        </span>
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                          {new Date(comment.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "#e2e2e9", lineHeight: "1.6" }}>
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Leave a review form */}
              {user ? (
                <form onSubmit={handlePostComment} style={{ background: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", color: "#e2e2e9" }}>
                    {jp.leave_comment || "Leave a Review or Comment"}
                  </h4>
                  <textarea
                    rows={3}
                    value={commentContent}
                    onChange={e => setCommentContent(e.target.value)}
                    placeholder="Share academic observations, editorial feedback, or peer review notes for this journal..."
                    required
                    style={{
                      width: "100%",
                      padding: "0.8rem 1rem",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "var(--border-radius-sm)",
                      color: "#f8f9fa",
                      outline: "none",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                      resize: "vertical"
                    }}
                  />
                  {commentSuccess && (
                    <div style={{ color: "#4ade80", fontSize: "0.85rem", marginBottom: "1rem" }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: "0.4rem" }}></i>
                      {commentSuccess}
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={postingComment} 
                    className="btn btn-primary btn-sm"
                  >
                    {postingComment ? (jp.posting || "Posting...") : (jp.post_comment || "Post Review")}
                  </button>
                </form>
              ) : (
                <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: "0 0 1rem" }}>
                    {jp.must_login || "You must be logged in to participate in peer discussions."}
                  </p>
                  <a href="/login" className="btn btn-secondary btn-sm">
                    {jp.login_btn || "Log In to Participate"}
                  </a>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
