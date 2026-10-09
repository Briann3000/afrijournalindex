"use client";

import React, { useEffect, useState, use, useRef } from "react";
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
  disciplines?: string[];
  primaryDiscipline?: string;
  quartile?: "Q1" | "Q2" | "Q3" | "Q4";
  disciplineRank?: number;
  totalInDiscipline?: number;
  categoryMedian?: number;
  selfCitationRate?: number;
  externalCitationRate?: number;
  integrityScore?: string;
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

  // Modals & Embed state
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const badgeUrl = typeof window !== "undefined" && journal 
    ? `${window.location.origin}/api/badge/${journal.issn || journal.id}.svg`
    : `/api/badge/${journal?.issn || journal?.id || "preview"}.svg`;

  const htmlSnippet = journal 
    ? `<a href="https://afrijournalindex.org/journal/${journal.id}"><img src="https://afrijournalindex.org/api/badge/${journal.issn || journal.id}.svg" alt="${journal.name} - Indexed in AfriJournal Index" /></a>`
    : "";

  const markdownSnippet = journal
    ? `[![Indexed in AfriJournal Index](https://afrijournalindex.org/api/badge/${journal.issn || journal.id}.svg)](https://afrijournalindex.org/journal/${journal.id})`
    : "";

  const quartileColors: Record<string, { bg: string; text: string; border: string }> = {
    Q1: { bg: "rgba(212,160,74,0.18)", text: "#d4a04a", border: "rgba(212,160,74,0.4)" },
    Q2: { bg: "rgba(37,99,235,0.18)", text: "#60a5fa", border: "rgba(37,99,235,0.4)" },
    Q3: { bg: "rgba(5,150,105,0.18)", text: "#34d399", border: "rgba(5,150,105,0.4)" },
    Q4: { bg: "rgba(107,114,128,0.18)", text: "#9ca3af", border: "rgba(107,114,128,0.4)" }
  };

  const currentQuartile = journal?.quartile || "Q2";
  const qStyle = quartileColors[currentQuartile];

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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1rem", alignItems: "center" }}>
                    <span className="journal-tag" style={{ backgroundColor: "rgba(212,160,74,0.15)", color: "var(--color-primary)", border: "1px solid rgba(212,160,74,0.3)", fontWeight: 600 }}>
                      <i className="fa-solid fa-certificate" style={{ marginRight: "0.3rem" }}></i>
                      {journal.isIndexed ? (jp.indexed_badge || "Verified Indexed Journal") : (jp.unindexed_badge || "Pending Evaluation")}
                    </span>

                    {/* Subject Quartile Badge (Q1-Q4) */}
                    <span 
                      style={{ 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "20px", 
                        backgroundColor: qStyle.bg, 
                        color: qStyle.text, 
                        border: `1px solid ${qStyle.border}`,
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        letterSpacing: "0.5px"
                      }}
                    >
                      {journal.quartile || "Q2"} Category Quartile
                    </span>

                    {journal.primaryDiscipline && (
                      <span className="journal-tag" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#e2e2e9" }}>
                        {journal.primaryDiscipline}
                      </span>
                    )}

                    <span className="journal-tag" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)" }}>
                      <i className="fa-solid fa-location-dot" style={{ marginRight: "0.3rem" }}></i> {journal.country}
                    </span>
                  </div>

                  <h1 style={{ fontSize: "2.1rem", fontWeight: 700, lineHeight: "1.3", margin: "0 0 1rem", color: "#f8f9fa" }}>
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

                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", minWidth: "200px" }}>
                  {journal.websiteUrl && (
                    <a 
                      href={journal.websiteUrl.startsWith("http") ? journal.websiteUrl : `https://${journal.websiteUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}
                    >
                      <span>{jp.visit_website || "Visit Official Website"}</span>
                      <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.8rem" }}></i>
                    </a>
                  )}
                  
                  <button 
                    onClick={() => setShowCertificate(true)}
                    className="btn btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", fontSize: "0.85rem" }}
                  >
                    <i className="fa-solid fa-stamp" style={{ color: "var(--color-primary)" }}></i>
                    <span>Official Certificate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. AJIF Impact Metrics & Category Benchmarks */}
            <div className="glass-card" style={{ padding: "2.5rem", background: "linear-gradient(135deg, rgba(212,160,74,0.04), rgba(255,255,255,0.02))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.8rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.6rem", margin: "0 0 0.4rem" }}>
                    <i className="fa-solid fa-chart-line"></i> {jp.impact_metrics_title || "AJIF Impact Metrics"}
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    {jp.impact_metrics_desc || "Calculated using 2-year citation window with Africa-weighted regional multiplier"}
                  </p>
                </div>

                <div style={{ textAlign: "right", background: "rgba(255,255,255,0.03)", padding: "0.6rem 1.2rem", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", display: "block" }}>Discipline Rank</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                    #{journal.disciplineRank || 1} of {journal.totalInDiscipline || 1}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>in {journal.primaryDiscipline}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
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
                    +15% Africa Regional Multiplier
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

              {/* Self-Citation & Integrity Audit Bar */}
              <div style={{ padding: "1.25rem 1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e2e2e9", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="fa-solid fa-shield-halved" style={{ color: "var(--color-primary)" }}></i>
                    Citation Diversity & Integrity Audit
                  </span>
                  <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", background: "rgba(34,197,94,0.15)", color: "#4ade80", borderRadius: "4px", fontWeight: 600 }}>
                    {journal.integrityScore || "High Integrity"}
                  </span>
                </div>

                <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", background: "rgba(255,255,255,0.05)", marginBottom: "0.6rem" }}>
                  <div style={{ width: `${journal.externalCitationRate ?? 95}%`, background: "var(--color-primary)", height: "100%" }} title="External Citations"></div>
                  <div style={{ width: `${journal.selfCitationRate ?? 5}%`, background: "rgba(255,255,255,0.2)", height: "100%" }} title="Journal Self-Citations"></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  <span>External Journal Citations: <strong style={{ color: "#e2e2e9" }}>{journal.externalCitationRate ?? 95}%</strong></span>
                  <span>Self-Citation Rate: <strong style={{ color: "#e2e2e9" }}>{journal.selfCitationRate ?? 5}%</strong> (Audit Threshold: &lt; 25%)</span>
                </div>
              </div>
            </div>

            {/* 3. Embeddable Journal Badge Widget (Publisher Tool) */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8f9fa", margin: "0 0 0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <i className="fa-solid fa-code" style={{ color: "var(--color-primary)" }}></i>
                  Embeddable Indexing Badge
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                  Publishers and editors can embed this live, dynamic SVG badge on their journal website (OJS, WordPress, Drupal) to showcase verified indexation.
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2rem", background: "rgba(255,255,255,0.02)", padding: "1.5rem", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Live Badge Preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Live Badge Preview</span>
                  <div>
                    <img src={badgeUrl} alt="AJIF Index Badge" style={{ height: "26px", display: "block" }} />
                  </div>
                </div>

                {/* Copy Buttons */}
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "0.8rem" }}>
                  <button 
                    onClick={() => copyToClipboard(htmlSnippet, "html")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <i className="fa-regular fa-copy" style={{ marginRight: "0.4rem" }}></i>
                    {copiedType === "html" ? "HTML Copied!" : "Copy HTML Embed"}
                  </button>

                  <button 
                    onClick={() => copyToClipboard(markdownSnippet, "md")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <i className="fa-regular fa-copy" style={{ marginRight: "0.4rem" }}></i>
                    {copiedType === "md" ? "Markdown Copied!" : "Copy Markdown"}
                  </button>

                  <button 
                    onClick={() => copyToClipboard(badgeUrl, "url")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <i className="fa-solid fa-link" style={{ marginRight: "0.4rem" }}></i>
                    {copiedType === "url" ? "URL Copied!" : "Copy SVG URL"}
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Scope & Editorial Card */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "#f8f9fa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <i className="fa-solid fa-align-left" style={{ color: "var(--color-primary)" }}></i>
                {jp.scope_title || "Scope & Editorial Focus"}
              </h2>
              <p style={{ color: "var(--color-text-muted)", lineHeight: "1.8", fontSize: "0.95rem", margin: 0 }}>
                {journal.description || "No specific scope statement cataloged for this journal."}
              </p>
            </div>

            {/* 5. Indexed Articles & CrossRef DOIs */}
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

            {/* 6. Peer Reviews & Community Discussions */}
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

        {/* Official Printable Metric Certificate Modal */}
        {showCertificate && journal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem"
            }}
            onClick={() => setShowCertificate(false)}
          >
            <div 
              style={{
                background: "#0c0f14",
                color: "#f8f9fa",
                width: "100%",
                maxWidth: "540px",
                borderRadius: "10px",
                border: "1px solid rgba(212,160,74,0.35)",
                padding: "2rem 2.2rem",
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8)",
                position: "relative"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowCertificate(false)}
                style={{
                  position: "absolute",
                  top: "1.2rem",
                  right: "1.2rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  fontSize: "1.1rem",
                  cursor: "pointer"
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              {/* Certificate Content Header */}
              <div style={{ textAlign: "center", borderBottom: "1px solid rgba(212,160,74,0.25)", paddingBottom: "1.2rem", marginBottom: "1.4rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-primary)", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.3rem" }}>
                  African Scholarly Indexing & Metric Authority
                </div>
                <h2 style={{ fontSize: "1.35rem", color: "#ffffff", margin: "0 0 0.3rem", fontWeight: 700 }}>
                  Certificate of Indexation & Impact
                </h2>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                  Verification ID: AJIF-{journal.id.substring(0, 8).toUpperCase()}-2026
                </div>
              </div>

              {/* Journal Title & Details */}
              <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 0.3rem" }}>This certifies that</p>
                <h3 style={{ fontSize: "1.15rem", color: "var(--color-primary)", margin: "0 0 0.4rem", fontWeight: 700, lineHeight: "1.4" }}>
                  {journal.name}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#e2e2e9", margin: 0 }}>
                  Published by <strong>{journal.publisherName}</strong> ({journal.country})
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
                  ISSN: {journal.issn || "N/A"} | eISSN: {journal.eissn || "N/A"}
                </p>
              </div>

              {/* Verified Metric Box */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.8rem", background: "rgba(255,255,255,0.02)", padding: "1rem 1.2rem", borderRadius: "6px", border: "1px solid rgba(212,160,74,0.2)", marginBottom: "1.5rem", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Standard AJIF</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-primary)", marginTop: "0.2rem" }}>
                    {journal.latestReport?.standardScore?.toFixed(3) || "0.000"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quartile</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: qStyle.text, marginTop: "0.2rem" }}>
                    {journal.quartile || "Q3"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Regional Score</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>
                    {journal.latestReport?.regionalScore?.toFixed(3) || "0.000"}
                  </div>
                </div>
              </div>

              {/* Footer & Print Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.2rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Verified by AfriJournal Index • {new Date().getFullYear()}
                </div>
                <button 
                  onClick={() => window.print()} 
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", padding: "0.4rem 0.9rem" }}
                >
                  <i className="fa-solid fa-print"></i>
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
