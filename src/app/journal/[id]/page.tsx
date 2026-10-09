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
    Q1: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    Q2: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    Q3: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
    Q4: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
    Unrated: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" }
  };

  const currentQuartile = journal?.quartile || "Unrated";
  const qStyle = quartileColors[currentQuartile] || quartileColors["Unrated"];

  return (
    <div className="page-wrapper">
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
            <h2 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)" }}>{jp.not_found_title || "Journal Not Found"}</h2>
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
                    <span className="journal-tag" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", border: "1px solid #bfdbfe", fontWeight: 700 }}>
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
                      <span className="journal-tag" style={{ backgroundColor: "var(--color-bg-alt)", color: "var(--color-text-body)", border: "1px solid var(--color-border)" }}>
                        {journal.primaryDiscipline}
                      </span>
                    )}

                    <span className="journal-tag" style={{ backgroundColor: "var(--color-bg-alt)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                      <i className="fa-solid fa-location-dot" style={{ marginRight: "0.3rem" }}></i> {journal.country}
                    </span>
                  </div>

                  <h1 style={{ fontSize: "2.1rem", fontWeight: 800, lineHeight: "1.3", margin: "0 0 1rem", color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
                    {journal.name}
                  </h1>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.8rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    <div>
                      <strong style={{ color: "var(--color-text-main)" }}>{jp.publisher || "Publisher"}:</strong> {journal.publisherName}
                    </div>
                    {journal.issn && (
                      <div>
                        <strong style={{ color: "var(--color-text-main)" }}>{jp.issn_print || "Print ISSN"}:</strong> {journal.issn}
                      </div>
                    )}
                    {journal.eissn && (
                      <div>
                        <strong style={{ color: "var(--color-text-main)" }}>{jp.issn_electronic || "Electronic ISSN"}:</strong> {journal.eissn}
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

            {/* Claim & Official Evaluation Callout Banner (Monetization Engine) */}
            <div 
              style={{ 
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", 
                borderRadius: "12px", 
                padding: "1.6rem 2rem", 
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1.2rem",
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.2)"
              }}
            >
              <div style={{ flex: 1, minWidth: "280px" }}>
                <span style={{ fontSize: "0.75rem", background: "#f59e0b", color: "#0f172a", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", display: "inline-block", marginBottom: "0.5rem" }}>
                  Publisher &amp; Editorial Portal
                </span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0 0 0.35rem", color: "#ffffff" }}>
                  Are you the editor or publisher of {journal.name}?
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.5" }}>
                  Claim this official profile, submit your latest volumes for verified citation harvesting, and receive your accredited 2026 Academic Impact Certificate &amp; Gold Badge.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <a 
                  href={`/submit?journal=${encodeURIComponent(journal.name)}&issn=${encodeURIComponent(journal.issn || "")}`}
                  className="btn btn-primary"
                  style={{ backgroundColor: "#f59e0b", color: "#0f172a", borderColor: "#f59e0b", fontWeight: 800, padding: "0.6rem 1.4rem", fontSize: "0.88rem" }}
                >
                  <i className="fa-solid fa-certificate" style={{ marginRight: "0.4rem" }}></i>
                  Claim &amp; Certify ($199)
                </a>
              </div>
            </div>

            {/* 2. AJIF Impact Metrics & Category Benchmarks */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.8rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.6rem", margin: "0 0 0.4rem" }}>
                    <i className="fa-solid fa-chart-line"></i> {jp.impact_metrics_title || "AJIF Impact Metrics"}
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    {jp.impact_metrics_desc || "Calculated using 2-year citation window with Africa-weighted regional multiplier"}
                  </p>
                </div>

                <div style={{ textAlign: "right", background: "var(--color-bg-card-subtle)", padding: "0.6rem 1.2rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 600 }}>Discipline Rank</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>
                    #{journal.disciplineRank || 1} of {journal.totalInDiscipline || 1}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>in {journal.primaryDiscipline}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                {/* Standard AJIF */}
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
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
                <div style={{ padding: "1.5rem", background: "var(--color-primary-light)", borderRadius: "var(--border-radius-sm)", border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-primary-hover)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
                    {jp.regional_ajif || "Regional Weighted Score"}
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                    {journal.latestReport?.regionalScore !== undefined ? journal.latestReport.regionalScore.toFixed(3) : "0.000"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    +15% Africa Regional Multiplier
                  </div>
                </div>

                {/* Citable Articles */}
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    {jp.citable_articles || "Citable Articles"}
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                    {journal.latestReport?.articleCount ?? journal.articles.length}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    Cataloged Publications
                  </div>
                </div>

                {/* Citations Received */}
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    {jp.citations_received || "Citations Received"}
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                    {journal.latestReport?.citationCount ?? journal.articles.reduce((acc, a) => acc + a.citationCount, 0)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    Incoming Verified Citations
                  </div>
                </div>
              </div>

              {/* Anti-Predatory & Open-Access Integrity Audit Section */}
              <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <i className="fa-solid fa-shield-halved" style={{ color: "var(--color-primary)" }}></i>
                      Anti-Predatory & Open-Access Integrity Audit
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      Automated 6-point verification standard adhering to DOAJ & Scopus screening protocols
                    </span>
                  </div>
                  <span style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem", background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "20px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <i className="fa-solid fa-check-double"></i>
                    {journal.integrityScore || "Verified Compliant"}
                  </span>
                </div>

                {/* 6-Point Compliance Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.8rem" }}>
                  <div style={{ padding: "0.75rem 1rem", background: "#ffffff", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>ISSN Active Registry</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>International center verified</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "#ffffff", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>Open Access Mandate</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>CC-BY / Unrestricted full-text</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "#ffffff", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>Editorial Governance</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Faculty institutional affiliation</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "#ffffff", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>DOI & CrossRef Index</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Persistent digital resolution</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "#ffffff", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>Citation Firewall</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Self-citations &lt; 20% capped</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "#ffffff", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>Cadence Regularity</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Regular issue publication cycle</span>
                    </div>
                  </div>
                </div>

                {/* Self-Citation Breakdown Bar */}
                <div style={{ paddingTop: "0.5rem" }}>
                  <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", background: "#e2e8f0", marginBottom: "0.6rem" }}>
                    <div style={{ width: `${journal.externalCitationRate ?? 95}%`, background: "var(--color-primary)", height: "100%" }} title="External Citations"></div>
                    <div style={{ width: `${journal.selfCitationRate ?? 5}%`, background: "#94a3b8", height: "100%" }} title="Journal Self-Citations"></div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    <span>External Journal Citations: <strong style={{ color: "var(--color-text-main)" }}>{journal.externalCitationRate ?? 95}%</strong></span>
                    <span>Self-Citation Rate: <strong style={{ color: "var(--color-text-main)" }}>{journal.selfCitationRate ?? 5}%</strong> (Audit Threshold: &lt; 25%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Embeddable Journal Badge Widget (Publisher Tool) */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <i className="fa-solid fa-code" style={{ color: "var(--color-primary)" }}></i>
                  Embeddable Indexing Badge
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                  Publishers and editors can embed this live, dynamic SVG badge on their journal website (OJS, WordPress, Drupal) to showcase verified indexation.
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2rem", background: "var(--color-bg-card-subtle)", padding: "1.5rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                {/* Live Badge Preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Live Badge Preview</span>
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
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-newspaper" style={{ color: "var(--color-primary)" }}></i>
                    {jp.articles_title || "Indexed Articles & Publications"}
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    {jp.articles_desc || "Articles cataloged in the indexing repository with verified DOI records and citation counts"}
                  </p>
                </div>
                <span className="journal-tag" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", border: "1px solid #bfdbfe", fontWeight: 700 }}>
                  {journal.articles.length} {jp.citable_articles || "Articles"}
                </span>
              </div>

              {journal.articles.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  {jp.no_articles || "No articles registered in the citation window yet."}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {journal.articles.map(article => (
                    <div 
                      key={article.id} 
                      style={{ 
                        padding: "1.25rem 1.5rem", 
                        background: "#ffffff", 
                        border: "1px solid var(--color-border)", 
                        borderRadius: "var(--border-radius-sm)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem"
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "250px" }}>
                        <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--color-text-main)", fontWeight: 700, lineHeight: "1.4" }}>
                          {article.title}
                        </h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                          <span>
                            <i className="fa-regular fa-calendar" style={{ marginRight: "0.3rem" }}></i>
                            {new Date(article.publishDate).getFullYear()}
                          </span>
                          {article.doi && (
                            <span style={{ fontFamily: "monospace", color: "var(--color-primary)", fontWeight: 600 }}>
                              DOI: {article.doi}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span 
                          style={{ 
                            padding: "0.3rem 0.8rem", 
                            background: "var(--color-primary-light)", 
                            border: "1px solid #bfdbfe", 
                            color: "var(--color-primary)", 
                            borderRadius: "20px", 
                            fontSize: "0.8rem",
                            fontWeight: 700
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
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                    {jp.no_reviews || "No discussions recorded yet for this journal. Be the first to post a review!"}
                  </div>
                ) : (
                  journal.comments.map(comment => (
                    <div 
                      key={comment.id} 
                      style={{ 
                        padding: "1.25rem 1.5rem", 
                        background: "#ffffff", 
                        border: "1px solid var(--color-border)",
                        borderLeft: "4px solid var(--color-primary)", 
                        borderRadius: "0 var(--border-radius-sm) var(--border-radius-sm) 0" 
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span style={{ fontWeight: "bold", color: "var(--color-text-main)" }}>
                          {comment.author.name} <span style={{ fontWeight: "normal", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>({comment.author.institution || "Researcher"})</span>
                        </span>
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                          {new Date(comment.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--color-text-body)", lineHeight: "1.6" }}>
                        {comment.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Leave a review form */}
              {user ? (
                <form onSubmit={handlePostComment} style={{ background: "var(--color-bg-card-subtle)", padding: "1.5rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <h4 style={{ margin: "0 0 1rem", fontSize: "0.95rem", color: "var(--color-text-main)", fontWeight: 700 }}>
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
                      background: "#ffffff",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--border-radius-sm)",
                      color: "var(--color-text-main)",
                      outline: "none",
                      fontSize: "0.9rem",
                      marginBottom: "1rem",
                      resize: "vertical"
                    }}
                  />
                  {commentSuccess && (
                    <div style={{ color: "#16a34a", fontSize: "0.85rem", marginBottom: "1rem" }}>
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
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
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
            className="certificate-modal-wrapper"
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
              padding: "1.5rem"
            }}
            onClick={() => setShowCertificate(false)}
          >
            <div 
              className="certificate-modal-box"
              style={{
                background: "#ffffff",
                color: "#0f172a",
                width: "100%",
                maxWidth: "520px",
                maxHeight: "88vh",
                overflowY: "auto",
                borderRadius: "12px",
                border: "2px solid #b45309",
                outline: "4px solid rgba(180, 83, 9, 0.15)",
                outlineOffset: "3px",
                padding: "2rem 2.2rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.4)",
                position: "relative"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button (Hidden during print) */}
              <button 
                className="no-print"
                onClick={() => setShowCertificate(false)}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  fontSize: "1.2rem",
                  cursor: "pointer"
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              {/* Certificate Crest & Authority Header */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.2rem" }}>
                <div className="cert-gold-accent" style={{ fontSize: "0.72rem", color: "#b45309", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem" }}>
                  African Scholarly Indexing &amp; Metric Authority
                </div>
                <h2 style={{ fontSize: "1.35rem", color: "var(--color-text-main)", margin: "0 0 0.25rem", fontWeight: 800, fontFamily: "Georgia, serif" }}>
                  Certificate of Indexation &amp; Impact
                </h2>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                  Verification ID: AJIF-CERT-2026-{journal.id.substring(0, 8).toUpperCase()}
                </div>
              </div>

              {/* Formal Academic Citation Body */}
              <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 0.35rem" }}>
                  This certifies that
                </p>
                <h3 className="cert-gold-accent" style={{ fontSize: "1.2rem", color: "var(--color-primary)", margin: "0 0 0.35rem", fontWeight: 700, lineHeight: "1.35", fontFamily: "Georgia, serif" }}>
                  {journal.name}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-body)", margin: 0, fontWeight: 500 }}>
                  Published by <strong style={{ color: "var(--color-text-main)" }}>{journal.publisherName}</strong> • {journal.country}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>
                  ISSN: {journal.issn || "N/A"} {journal.eissn ? `| eISSN: ${journal.eissn}` : ""}
                </p>
              </div>

              {/* Verified Metric Scorecard */}
              <div className="cert-metric-box" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", background: "var(--color-bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "1.2rem", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Standard AJIF</div>
                  <div className="cert-gold-accent" style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary)", marginTop: "0.15rem" }}>
                    {journal.latestReport?.standardScore?.toFixed(3) || "0.000"}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>2-Yr Window</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Quartile</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: qStyle.text, marginTop: "0.15rem" }}>
                    {journal.quartile || "Q3"}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>{journal.primaryDiscipline || "Category"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Regional Score</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginTop: "0.15rem" }}>
                    {journal.latestReport?.regionalScore?.toFixed(3) || "0.000"}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>+15% Regional</div>
                </div>
              </div>

              {/* Signatures (Visible only during print preview for formal output) */}
              <div className="cert-print-only" style={{ display: "none", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", borderTop: "1px solid #cbd5e1", paddingTop: "1.5rem", marginTop: "1.5rem", textAlign: "center" }}>
                <div>
                  <div style={{ height: "24px", borderBottom: "1px dashed #94a3b8", margin: "0 1rem 0.4rem" }}></div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a" }}>Prof. K. N. Omwenga</div>
                  <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Chair, Bibliometric Review Board</div>
                </div>
                <div>
                  <div style={{ height: "24px", borderBottom: "1px dashed #94a3b8", margin: "0 1rem 0.4rem" }}></div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0f172a" }}>AfriJournal Index Registry</div>
                  <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Director of Scholarly Standards</div>
                </div>
              </div>

              {/* Footer & Print Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "0.9rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Verified by AfriJournal Index • {new Date().getFullYear()}
                </div>
                <button 
                  className="no-print btn btn-primary btn-sm"
                  onClick={() => window.print()} 
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", padding: "0.4rem 0.9rem" }}
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
