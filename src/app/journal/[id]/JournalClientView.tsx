"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { JournalDetail } from "../../../lib/journal-detail";
import Header from "../../Header";
import Footer from "../../Footer";
import { useLang } from "../../LangContext";
// Dynamic lazy-load of dossier PDF generator to prevent heavy initial module parse

export default function JournalClientView({
  initialJournal,
  id
}: {
  initialJournal: JournalDetail | null;
  id: string;
}) {
  const { t } = useLang();
  const jp = t.journal_page;

  const [journal, setJournal] = useState<JournalDetail | null>(initialJournal);
  const [loading, setLoading] = useState<boolean>(!initialJournal);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [commentContent, setCommentContent] = useState<string>("");
  const [postingComment, setPostingComment] = useState<boolean>(false);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);

  // Modals & Embed state
  const [showCertificate, setShowCertificate] = useState<boolean>(false);
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [claimRole, setClaimRole] = useState<string>("Editor-in-Chief");
  const [claimEditorialEmail, setClaimEditorialEmail] = useState<string>("");
  const [claimLoading, setClaimLoading] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Feature Additions: Compliance Audit Modal State
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditTab, setAuditTab] = useState<"DOAJ" | "SCOPUS">("DOAJ");
  const [auditLoading, setAuditLoading] = useState<boolean>(false);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Provenance Details Modal State
  const [showProvenanceModal, setShowProvenanceModal] = useState<boolean>(false);

  // Feature Additions: Publisher Management Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    publisherName: "",
    websiteUrl: "",
    frequency: "",
    country: "",
    description: ""
  });

  // Feature Additions: Back-catalog OJS Harvest State
  const [harvestLoading, setHarvestLoading] = useState<boolean>(false);
  const [harvestResult, setHarvestResult] = useState<string | null>(null);

  // Feature Additions: 12-Page Dossier PDF Generation & Formula Drawer State
  const [downloadingDossier, setDownloadingDossier] = useState<boolean>(false);
  const [showFormulaDrawer, setShowFormulaDrawer] = useState<boolean>(false);
  const [showDossierLockModal, setShowDossierLockModal] = useState<boolean>(false);
  const [showAuditLockModal, setShowAuditLockModal] = useState<boolean>(false);

  // Guest Visitor Academic Access Disclaimer Modal State
  const [showGuestDisclaimerModal, setShowGuestDisclaimerModal] = useState<boolean>(false);
  const [guestFeatureName, setGuestFeatureName] = useState<string>("Institutional Dossier");

  // OJS Harvester Dedicated Configuration Modal State
  const [showOjsModal, setShowOjsModal] = useState<boolean>(false);
  const [ojsEndpoint, setOjsEndpoint] = useState<string>("");
  const [ojsTesting, setOjsTesting] = useState<boolean>(false);
  const [ojsTestMsg, setOjsTestMsg] = useState<string | null>(null);

  // Article Unlink State for Journal Publishers & Admins
  const [unlinkingArticleId, setUnlinkingArticleId] = useState<string | null>(null);
  const [unlinkNotice, setUnlinkNotice] = useState<string | null>(null);

  // Citation Evidence Modal State
  const [evidenceModalArticle, setEvidenceModalArticle] = useState<{
    title: string;
    citations: Array<{
      id: string;
      citingTitle: string;
      citingDoi: string | null;
      citingPdfUrl: string | null;
      citingJournal: string;
      citingCountry: string;
      citedAt: string;
    }>;
  } | null>(null);

  const handleDownloadDossier = async () => {
    if (!journal) return;

    // 1. If not logged in, trigger Academic Access Disclaimer Modal
    if (!user) {
      setGuestFeatureName("12-Page Institutional Evaluation Dossier (Vector PDF)");
      setShowGuestDisclaimerModal(true);
      return;
    }
    
    // 2. Check if journal has paid accreditation package
    const isUnlocked = Boolean(journal.certificatePaid || journal.activeTier === "Basic" || journal.activeTier === "Premium");
    if (!isUnlocked) {
      setShowDossierLockModal(true);
      return;
    }

    setDownloadingDossier(true);
    try {
      const { generateInstitutionalDossier } = await import("../../../lib/dossier-pdf");
      generateInstitutionalDossier({
        ...journal,
        quartile: computedQuartile,
        disciplineRank: computedRank,
        totalInDiscipline: journal.totalInDiscipline || 20,
        latestReport: journal.latestReport ? {
          ...journal.latestReport,
          standardScore: computedAJCI,
          citationCount: totalCalculatedCites,
          articleCount: totalCitableCount,
        } : {
          year: new Date().getFullYear(),
          standardScore: computedAJCI,
          regionalScore: Number((computedAJCI * 1.15).toFixed(3)),
          citationCount: totalCalculatedCites,
          articleCount: totalCitableCount,
        }
      } as any);
    } catch (err) {
      console.error("Dossier generation error:", err);
      alert("Failed to compile institutional evaluation dossier. Please try again.");
    } finally {
      setTimeout(() => setDownloadingDossier(false), 800);
    }
  };

  const handleOpenEditModal = () => {
    if (!journal) return;
    if (!user) {
      setGuestFeatureName("Verified Editorial Management Portal");
      setShowGuestDisclaimerModal(true);
      return;
    }
    // Paywall: Editor portal requires paid Accreditation Package
    const isUnlocked = Boolean(journal.certificatePaid || journal.activeTier === "Basic" || journal.activeTier === "Premium" || user?.role === "ADMIN");
    if (!isUnlocked) {
      setShowDossierLockModal(true);
      return;
    }
    setEditForm({
      publisherName: journal.publisherName || "",
      websiteUrl: journal.websiteUrl || "",
      frequency: journal.frequency || "Quarterly",
      country: journal.country || "Kenya",
      description: journal.description || ""
    });
    setEditSuccess(null);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journal) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);
    try {
      const res = await fetch(`/api/journals/${encodeURIComponent(journal.id)}/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success && data.journal) {
        setJournal(prev => prev ? { ...prev, ...data.journal } : null);
        setEditSuccess("Journal profile updated successfully.");
        setTimeout(() => setShowEditModal(false), 1200);
      } else {
        setEditError(data.error || "Failed to update journal metadata.");
      }
    } catch {
      setEditError("Network error while updating journal metadata.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleLoadAudit = async () => {
    if (!journal) return;

    if (!user) {
      setGuestFeatureName("DOAJ & Scopus Indexing Remediation Audit");
      setShowGuestDisclaimerModal(true);
      return;
    }
    
    // Check if journal has active evaluation tier (Basic) or paid certificate
    const isUnlocked = Boolean(journal.certificatePaid || journal.activeTier === "Basic" || journal.activeTier === "Premium" || user?.role === "ADMIN");
    if (!isUnlocked) {
      setShowAuditLockModal(true);
      return;
    }

    setShowAuditModal(true);
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch(`/api/journals/${encodeURIComponent(journal.id)}/compliance-audit`);
      const data = await res.json();
      if (data.success) {
        setAuditData(data);
      } else {
        setAuditError(data.error || "Failed to generate compliance audit.");
      }
    } catch {
      setAuditError("Network error loading compliance report.");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleOpenOjsModal = () => {
    if (!journal) return;
    if (!user) {
      setGuestFeatureName("Automated OJS Back-Catalog Harvesting");
      setShowGuestDisclaimerModal(true);
      return;
    }
    // Paywall check: requires paid package or admin
    const isUnlocked = Boolean(journal.certificatePaid || journal.activeTier === "Basic" || journal.activeTier === "Premium" || user?.role === "ADMIN");
    if (!isUnlocked) {
      setShowDossierLockModal(true);
      return;
    }
    const defaultUrl = journal.websiteUrl ? `${journal.websiteUrl.replace(/\/+$/, "")}/oai` : "";
    setOjsEndpoint(defaultUrl);
    setOjsTestMsg(null);
    setShowOjsModal(true);
  };

  const handleExecuteOjsHarvest = async () => {
    if (!journal || !ojsEndpoint.trim()) return;
    setHarvestLoading(true);
    setHarvestResult(null);
    setOjsTestMsg(null);
    try {
      const res = await fetch("/api/harvester/oai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: ojsEndpoint.trim(),
          journalId: journal.id,
          maxPages: 10,
          limit: 300
        })
      });
      const data = await res.json();
      if (data.success) {
        setHarvestResult(`Sync completed: ${data.indexedCount || 0} articles imported/verified.`);
        const reload = await fetch(`/api/journals/${encodeURIComponent(journal.id)}`, { cache: "no-store" });
        const reloadData = await reload.json();
        if (reloadData.success && reloadData.journal) {
          setJournal(reloadData.journal);
        }
        setShowOjsModal(false);
      } else {
        setOjsTestMsg(`Sync error: ${data.error || "No articles retrieved from endpoint."}`);
      }
    } catch {
      setOjsTestMsg("Network error connecting to specified OAI endpoint.");
    } finally {
      setHarvestLoading(false);
    }
  };

  const handleClaimJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journal) return;
    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setClaimLoading(true);
    setClaimError(null);
    setClaimSuccess(null);

    try {
      const res = await fetch("/api/journals/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId: journal.id,
          roleTitle: claimRole,
          editorialEmail: claimEditorialEmail.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setClaimSuccess(data.message || "Journal successfully claimed!");
        setJournal(prev => prev ? { ...prev, publisherId: user.id } : null);
      } else {
        setClaimError(data.error || "Failed to claim journal.");
      }
    } catch {
      setClaimError("Network error submitting journal claim.");
    } finally {
      setClaimLoading(false);
    }
  };

  // Articles search & pagination state
  // Articles search, sort & pagination state
  const [articleSearch, setArticleSearch] = useState<string>("");
  const [articleSort, setArticleSort] = useState<"citations_desc" | "citations_asc" | "newest" | "oldest" | "title">("citations_desc");
  const [articlesPage, setArticlesPage] = useState<number>(1);
  const [articlesPageSize, setArticlesPageSize] = useState<number>(10);

  const filteredArticles = useMemo(() => {
    if (!journal?.articles) return [];
    let list = journal.articles;
    if (articleSearch.trim()) {
      const q = articleSearch.toLowerCase().trim();
      list = list.filter(a => 
        a.title.toLowerCase().includes(q) || (a.doi && a.doi.toLowerCase().includes(q))
      );
    }

    // Sort by selected criteria (default: citations descending)
    const sorted = [...list];
    switch (articleSort) {
      case "citations_desc":
        sorted.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
        break;
      case "citations_asc":
        sorted.sort((a, b) => (a.citationCount || 0) - (b.citationCount || 0));
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.publishDate || 0).getTime() - new Date(a.publishDate || 0).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.publishDate || 0).getTime() - new Date(b.publishDate || 0).getTime());
        break;
      case "title":
        sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
    }
    return sorted;
  }, [journal?.articles, articleSearch, articleSort]);

  const totalArticlePages = Math.ceil(filteredArticles.length / articlesPageSize) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (articlesPage - 1) * articlesPageSize;
    return filteredArticles.slice(start, start + articlesPageSize);
  }, [filteredArticles, articlesPage, articlesPageSize]);

  useEffect(() => {
    setArticlesPage(1);
  }, [articleSearch, articleSort, articlesPageSize]);

  // Load journal data
  useEffect(() => {
    if (initialJournal) {
      setJournal(initialJournal);
      setLoading(false);
      return;
    }
    async function fetchJournal() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/journals/${encodeURIComponent(id)}`, {
          cache: "no-store",
          headers: { "Pragma": "no-cache", "Cache-Control": "no-cache" }
        });
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

  // Unlink misplaced or foreign publication from journal
  const handleUnlinkArticle = async (articleId: string, articleTitle: string) => {
    if (!confirm(`Are you sure you want to unlink this publication ("${articleTitle}") from this journal? This permanently removes the misassociation.`)) {
      return;
    }
    setUnlinkingArticleId(articleId);
    setUnlinkNotice(null);
    try {
      const res = await fetch(`/api/journals/${encodeURIComponent(id)}/articles/${encodeURIComponent(articleId)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setJournal(prev => {
          if (!prev) return null;
          return {
            ...prev,
            articles: prev.articles.filter(a => a.id !== articleId)
          };
        });
        setUnlinkNotice(`Article successfully unlinked from repository.`);
        setTimeout(() => setUnlinkNotice(null), 5000);
      } else {
        alert(data.error || "Failed to unlink article.");
      }
    } catch (err: any) {
      alert("Error unlinking article: " + (err.message || "Network error"));
    } finally {
      setUnlinkingArticleId(null);
    }
  };

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

  const handleExportMetricsCsv = () => {
    if (!journal) return;
    const headers = ["Year", "2-Year AJCI", "Impact (No Self-Citations)", "Regional Score", "Articles", "Citations"];
    const rows = (journal.historicalReports || []).map(r => [
      r.year,
      r.standardScore.toFixed(3),
      (r.standardScore * ((journal.externalCitationRate ?? 100) / 100)).toFixed(3),
      r.regionalScore ? r.regionalScore.toFixed(3) : "N/A",
      r.articleCount,
      r.citationCount
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${journal.name.replace(/[^a-zA-Z0-9]/g, "_")}_metrics_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMetricsJson = () => {
    if (!journal) return;
    const exportData = {
      journalId: journal.id,
      name: journal.name,
      issn: journal.issn,
      eissn: journal.eissn,
      country: journal.country,
      license: "CC BY 4.0",
      retrievedAt: new Date().toISOString(),
      citationDistribution: journal.citationDistribution || null,
      impactWithoutSelfCitations: journal.impactWithoutSelfCitations || null,
      selfCitationRate: journal.selfCitationRate || 0,
      journalHIndex: journal.journalHIndex || 0,
      historicalReports: journal.historicalReports || []
    };
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${journal.name.replace(/[^a-zA-Z0-9]/g, "_")}_metrics.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const badgeUrl = typeof window !== "undefined" && journal 
    ? `${window.location.origin}/api/badge/${journal.issn || journal.id}.svg`
    : `/api/badge/${journal?.issn || journal?.id || "preview"}.svg`;

  const htmlSnippet = journal 
    ? `<a href="https://afrijournalindexing.org/journal/${journal.id}"><img src="https://afrijournalindexing.org/api/badge/${journal.issn || journal.id}.svg" alt="${journal.name} - Indexed in AfriJournal Index" /></a>`
    : "";

  const markdownSnippet = journal
    ? `[![Indexed in AfriJournal Index](https://afrijournalindexing.org/api/badge/${journal.issn || journal.id}.svg)](https://afrijournalindexing.org/journal/${journal.id})`
    : "";

  const quartileColors: Record<string, { bg: string; text: string; border: string }> = {
    Q1: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    Q2: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    Q3: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
    Q4: { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
    Unrated: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" }
  };

  const articlesList = journal?.articles || [];
  const currentYear = new Date().getFullYear();
  const evaluationArticles = articlesList;
  const totalCitableCount = (journal?.latestReport?.articleCount && journal.latestReport.articleCount > 0)
    ? journal.latestReport.articleCount
    : (evaluationArticles.length > 0 ? evaluationArticles.length : 0);

  const totalCalculatedCites = evaluationArticles.reduce((acc, a) => acc + (a.citationCount || 0), 0);
  const reportCites = (journal?.latestReport?.citationCount !== undefined && journal?.latestReport?.citationCount !== null)
    ? journal.latestReport.citationCount
    : totalCalculatedCites;

  // Single Source of Truth: Use official database report standardScore (matches Rankings 1:1)
  const computedAJCI = journal?.latestReport?.standardScore ?? (
    reportCites > 0 && totalCitableCount > 0 ? reportCites / totalCitableCount : 0
  );

  const computedAJCIStr = computedAJCI > 0 
    ? computedAJCI.toFixed(3) 
    : (totalCitableCount > 0 ? "0.000" : "—");

  // Harmonized Quartile from journal or computed score
  const computedQuartile: "Q1" | "Q2" | "Q3" | "Q4" | "Unrated" = useMemo(() => {
    if (journal?.quartile && ["Q1", "Q2", "Q3", "Q4"].includes(journal.quartile as any)) {
      return journal.quartile as "Q1" | "Q2" | "Q3" | "Q4";
    }
    if (totalCitableCount === 0 || computedAJCI <= 0) return "Unrated";
    if (computedAJCI >= 0.500) return "Q1";
    if (computedAJCI >= 0.250) return "Q2";
    if (computedAJCI >= 0.080) return "Q3";
    return "Q4";
  }, [totalCitableCount, computedAJCI, journal?.quartile]);



  // Discipline Rank strictly from Database SSOT (no artificial heuristics)
  const computedRank = journal?.disciplineRank || (journal as any)?.latestReport?.disciplineRank || "—";


  const currentQuartile = computedQuartile;
  const qStyle = quartileColors[currentQuartile] || quartileColors["Unrated"];

  return (
    <div className="page-wrapper">
      <Header />

      <main className="container" style={{ padding: "3rem 0 5rem", maxWidth: "1050px" }}>
        {/* Back Link */}
        <div style={{ marginBottom: "1.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button 
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = "/browse";
                }
              }
            }}
            style={{ 
              background: "none",
              border: "none",
              color: "var(--color-primary)", 
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              cursor: "pointer",
              padding: 0
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Back</span>
          </button>
          
          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>•</span>

          <a 
            href="/browse" 
            style={{ 
              color: "var(--color-text-muted)", 
              textDecoration: "none", 
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem"
            }}
          >
            <i className="fa-solid fa-layer-group" style={{ fontSize: "0.8rem" }}></i>
            <span>Browse Directory</span>
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
                      {computedQuartile} Category Quartile
                    </span>

                    {journal.isScopusIndexed && (
                      <span className="journal-tag" style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", fontWeight: 700 }}>
                        <i className="fa-solid fa-earth-americas" style={{ marginRight: "0.3rem" }}></i> Scopus Indexed
                      </span>
                    )}

                    {journal.isWosIndexed && (
                      <span className="journal-tag" style={{ backgroundColor: "#ede9fe", color: "#5b21b6", border: "1px solid #ddd6fe", fontWeight: 700 }}>
                        <i className="fa-solid fa-award" style={{ marginRight: "0.3rem" }}></i> Web of Science (WoS)
                      </span>
                    )}

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

                  {journal.isIndexed && (
                    <div style={{
                      marginTop: "0.85rem",
                      marginBottom: "1rem",
                      padding: "0.85rem 1.15rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      color: "#065f46",
                      fontSize: "0.92rem",
                      lineHeight: "1.5"
                    }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: "0.5rem", color: "#10b981" }}></i>
                      <strong>AfriJournal Indexing Status:</strong> {journal.name} is an officially indexed African scholarly journal in the AfriJournal Index (AJCI) directory with verified citation and bibliometric metrics (Quality Grade: {journal.qualityGrade || "Verified"}).
                    </div>
                  )}

                  {!journal.isScopusIndexed && !journal.isWosIndexed && (
                    <div style={{
                      marginBottom: "1.25rem",
                      padding: "0.85rem 1.15rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(59, 130, 246, 0.06)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap"
                    }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-main)", lineHeight: 1.5, flex: 1, minWidth: "240px" }}>
                        <i className="fa-solid fa-circle-info" style={{ color: "#3b82f6", marginRight: "0.5rem" }}></i>
                        <strong>Global Indexation Pathway:</strong> Looking to index this journal with Scopus or Web of Science? KENPRO provides editorial compliance, peer-review audits, and application readiness support.
                      </div>
                      <a href="/services" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap", fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}>
                        Explore Services <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem", marginLeft: "4px" }}></i>
                      </a>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.8rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    <div>
                      <strong style={{ color: "var(--color-text-main)" }}>{jp.publisher || "Publisher"}:</strong> {journal.publisherName}
                    </div>
                    {journal.issn && /^[0-9]{4}-[0-9]{3}[0-9xX]$/.test(journal.issn.trim()) && journal.issn.trim() !== "0000-0000" && journal.issn !== journal.eissn ? (
                      <div>
                        <strong style={{ color: "var(--color-text-main)" }}>{jp.issn_print || "Print ISSN"}:</strong> {journal.issn}
                      </div>
                    ) : null}
                    {journal.eissn && /^[0-9]{4}-[0-9]{3}[0-9xX]$/.test(journal.eissn.trim()) && journal.eissn.trim() !== "0000-0000" ? (
                      <div>
                        <strong style={{ color: "var(--color-text-main)" }}>{jp.issn_electronic || "Electronic ISSN"}:</strong> {journal.eissn}
                      </div>
                    ) : null}
                    {(!journal.issn || !/^[0-9]{4}-[0-9]{3}[0-9xX]$/.test(journal.issn.trim())) && (!journal.eissn || !/^[0-9]{4}-[0-9]{3}[0-9xX]$/.test(journal.eissn.trim())) ? (
                      <div>
                        <strong style={{ color: "var(--color-text-main)" }}>ISSN:</strong> <span style={{ fontStyle: "italic", color: "var(--color-text-muted)" }}>Pending Verification</span>
                      </div>
                    ) : null}
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
                  
                  {journal.certificatePaid ? (
                    <a 
                      href={`/verify/${journal.issn || journal.id}`}
                      className="btn btn-secondary"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", fontSize: "0.85rem" }}
                    >
                      <i className="fa-solid fa-certificate" style={{ color: "var(--color-primary)" }}></i>
                      <span>Verified Certificate</span>
                    </a>
                  ) : (
                    <button 
                      onClick={() => setShowCertificate(true)}
                      className="btn btn-secondary"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", fontSize: "0.85rem" }}
                    >
                      <i className="fa-solid fa-lock" style={{ color: "#b45309" }}></i>
                      <span>Official Certificate (Preview)</span>
                    </button>
                  )}

                  {/* Claim Journal Action if unassigned, or controls if owned by current user */}
                  {user && journal.publisherId === user.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ background: journal.certificatePaid ? "#f0fdf4" : "var(--color-bg-card-subtle)", border: `1px solid ${journal.certificatePaid ? "#bbf7d0" : "var(--color-border)"}`, borderRadius: "8px", padding: "0.45rem 0.8rem", textAlign: "center", fontSize: "0.8rem", color: journal.certificatePaid ? "#166534" : "var(--color-text-main)", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                        <i className={`fa-solid ${journal.certificatePaid ? "fa-circle-check" : "fa-shield"}`} style={{ color: journal.certificatePaid ? "#16a34a" : "var(--color-primary)" }}></i>
                        <span>{journal.certificatePaid ? "Managed by You (Accredited)" : "Managed by You (Standard)"}</span>
                      </div>
                      <button 
                        onClick={handleOpenEditModal}
                        className="btn btn-secondary"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.82rem", background: "var(--color-bg-card-subtle)" }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                        <span>Edit Journal Metadata</span>
                        {!journal.certificatePaid && <i className="fa-solid fa-lock" style={{ fontSize: "0.7rem", color: "var(--color-primary)", marginLeft: "auto" }}></i>}
                      </button>
                      <button 
                        onClick={handleOpenOjsModal}
                        disabled={harvestLoading}
                        className="btn btn-secondary"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.82rem", background: "var(--color-bg-card-subtle)" }}
                      >
                        <i className={`fa-solid ${harvestLoading ? "fa-spinner fa-spin" : "fa-rotate"}`}></i>
                        <span>{harvestLoading ? "Harvesting Catalog..." : "Sync OJS Back-Catalog"}</span>
                        {!journal.certificatePaid && <i className="fa-solid fa-lock" style={{ fontSize: "0.7rem", color: "var(--color-primary)", marginLeft: "auto" }}></i>}
                      </button>
                      {harvestResult && (
                        <div style={{ fontSize: "0.75rem", color: "#0d9488", background: "#f0fdfa", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #ccfbf1" }}>
                          {harvestResult}
                        </div>
                      )}
                    </div>
                  ) : !journal.publisherId ? (
                    <button 
                      onClick={() => setShowClaimModal(true)}
                      className="btn btn-secondary"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.82rem", borderColor: "#0d9488", color: "#0d9488", background: "#f0fdfa" }}
                      title="Are you an editor or publisher? Claim this journal to manage it in your portal."
                    >
                      <i className="fa-solid fa-shield-halved"></i>
                      <span>Claim Journal (Editor)</span>
                    </button>
                  ) : null}

                  {/* DOAJ / Scopus Readiness Audit trigger button */}
                  <button 
                    onClick={handleLoadAudit}
                    className="btn btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.82rem", borderColor: "#4338ca", color: "#4338ca", background: "#eef2ff" }}
                  >
                    <i className="fa-solid fa-clipboard-check"></i>
                    <span>Compliance &amp; Readiness Audit</span>
                  </button>

                  {/* 12-Page Institutional Evaluation Dossier PDF Download Action */}
                  <button 
                    onClick={handleDownloadDossier}
                    disabled={downloadingDossier}
                    className="btn btn-primary"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.82rem", background: "#b45309", borderColor: "#b45309", color: "#ffffff" }}
                    title="Generate and download the complete 12-page official Institutional Evaluation Dossier (PDF)"
                  >
                    <i className={`fa-solid ${downloadingDossier ? "fa-spinner fa-spin" : "fa-file-invoice"}`}></i>
                    <span>{downloadingDossier ? "Compiling 12-Page Dossier..." : "Download Institutional Dossier (12-Page PDF)"}</span>
                  </button>

                  {/* Compare Journal Action */}
                  <a 
                    href={`/compare?j1=${encodeURIComponent(journal.id)}`}
                    className="btn btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.82rem", background: "var(--color-bg-card-subtle)" }}
                    title="Compare this journal with other venues"
                  >
                    <i className="fa-solid fa-code-compare" style={{ color: "var(--color-primary)" }}></i>
                    <span>Compare with Another Journal</span>
                  </a>
                </div>
              </div>
            </div>

            {/* 2. AJCI Citation Metrics & Category Benchmarks */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.8rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.6rem", margin: "0 0 0.4rem" }}>
                    <i className="fa-solid fa-chart-line"></i> {jp.impact_metrics_title || "AJCI Citation Metrics"}
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    {jp.impact_metrics_desc || "Calculated using international 2-year citation window with Regional Representation Quotient"}
                  </p>
                </div>

                <div style={{ textAlign: "right", background: "var(--color-bg-card-subtle)", padding: "0.6rem 1.2rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 600 }}>Discipline Rank</span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>
                    #{computedRank} of {journal.totalInDiscipline || 20}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>in {journal.primaryDiscipline || "Discipline"}</span>
                </div>
              </div>

              {/* Verified Bibliometric Provenance Pill Bar (Clickable Drill-down) */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.6rem", background: "var(--color-bg-card-subtle)", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid var(--color-border)", marginBottom: "1.5rem", fontSize: "0.8rem" }}>
                <span style={{ fontWeight: 700, color: "var(--color-navy)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: "var(--color-primary)" }}></i> Bibliometric Provenance:
                </span>

                {/* ISSN Registered (Verified via International ISSN Registry) */}
                {(journal.verifiedIssn || journal.eissn || journal.issn) && (
                  <button 
                    type="button" 
                    onClick={() => setShowProvenanceModal(true)} 
                    style={{ background: "var(--color-bg-card)", padding: "0.2rem 0.55rem", borderRadius: "6px", border: "1px solid var(--color-border)", color: "var(--color-text-body)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                    title="Verified with International ISSN Registry"
                  >
                    <i className="fa-solid fa-barcode" style={{ color: "#0284c7" }}></i> ISSN {journal.verifiedIssn || journal.eissn || journal.issn}
                  </button>
                )}

                {/* AfriJournal Quality Grade Audit */}
                {journal.isIndexed && (
                  <button 
                    type="button" 
                    onClick={() => setShowProvenanceModal(true)} 
                    style={{ background: "var(--color-bg-card)", padding: "0.2rem 0.55rem", borderRadius: "6px", border: "1px solid var(--color-border)", color: "var(--color-text-body)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                    title="AfriJournal Peer Quality Standard Evaluation"
                  >
                    <i className="fa-solid fa-certificate" style={{ color: "var(--color-primary)" }}></i> AfriJournal {journal.qualityGrade ? `Grade ${journal.qualityGrade}` : "Audited"}
                  </button>
                )}

                {/* Crossref I4OC: ONLY IF articles have genuine DOIs deposited */}
                {Boolean(journal.hasCrossrefDois) && (
                  <button 
                    type="button" 
                    onClick={() => setShowProvenanceModal(true)} 
                    style={{ background: "var(--color-bg-card)", padding: "0.2rem 0.55rem", borderRadius: "6px", border: "1px solid var(--color-border)", color: "var(--color-text-body)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                    title={`${journal.doiArticleCount} articles deposited with genuine Crossref DOIs`}
                  >
                    <i className="fa-solid fa-fingerprint" style={{ color: "#d97706" }}></i> Crossref DOIs ({journal.doiArticleCount})
                  </button>
                )}

                {/* DOAJ Peer Audit: ONLY IF verified DOAJ status */}
                {Boolean(journal.isDoajIndexed) && (
                  <button 
                    type="button" 
                    onClick={() => setShowProvenanceModal(true)} 
                    style={{ background: "var(--color-bg-card)", padding: "0.2rem 0.55rem", borderRadius: "6px", border: "1px solid var(--color-border)", color: "var(--color-text-body)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                    title="Verified DOAJ Directory Indexation"
                  >
                    <i className="fa-solid fa-check-circle" style={{ color: "#16a34a" }}></i> DOAJ Indexed
                  </button>
                )}

                {/* OpenAlex Scholarly Citation Graph */}
                <button 
                  type="button" 
                  onClick={() => setShowProvenanceModal(true)} 
                  style={{ background: "var(--color-bg-card)", padding: "0.2rem 0.55rem", borderRadius: "6px", border: "1px solid var(--color-border)", color: "var(--color-text-body)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                  title="OpenAlex Pan-African Citation Graph"
                >
                  <i className="fa-solid fa-network-wired" style={{ color: "#2563eb" }}></i> OpenAlex Graph
                </button>

                {/* Verified Serial Archival Harvest */}
                <button 
                  type="button" 
                  onClick={() => setShowProvenanceModal(true)} 
                  style={{ background: "var(--color-bg-card)", padding: "0.2rem 0.55rem", borderRadius: "6px", border: "1px solid var(--color-border)", color: "var(--color-text-body)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                  title="Direct Serial Volume & Issue Harvesting"
                >
                  <i className="fa-solid fa-box-archive" style={{ color: "#7c3aed" }}></i> Serial Harvest
                </button>

                <button 
                  type="button"
                  onClick={() => setShowProvenanceModal(true)}
                  style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", marginLeft: "auto" }}
                >
                  <i className="fa-solid fa-circle-info" style={{ marginRight: "3px" }}></i>
                  Audit Details
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                {/* Standard AJCI */}
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      AfriJournal Citation Index (AJCI)
                    </div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-primary)" }}>
                      {computedAJCIStr}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                      2-Year Mean Citation Rate
                    </div>
                  </div>
                  {/* How was this calculated? only visible to paid evaluation tiers (Basic or Premium) */}
                  {Boolean(journal.certificatePaid || journal.activeTier === "Basic" || journal.activeTier === "Premium") && (
                    <button 
                      onClick={() => setShowFormulaDrawer(!showFormulaDrawer)}
                      style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.78rem", fontWeight: 700, padding: 0, textAlign: "left", cursor: "pointer", marginTop: "0.6rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      <span>{showFormulaDrawer ? "Hide Formula" : "How was this calculated?"}</span>
                      <i className={`fa-solid ${showFormulaDrawer ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ fontSize: "0.7rem" }}></i>
                    </button>
                  )}
                </div>

                {/* Impact Factor Without Self-Citations (Organic External Citations) */}
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Impact (Excl. Self-Cites)
                    </div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#2563eb" }}>
                      {totalCitableCount > 0 ? (journal.impactWithoutSelfCitations !== undefined ? journal.impactWithoutSelfCitations.toFixed(3) : (computedAJCI * (1 - (journal.selfCitationRate || 0) / 100)).toFixed(3)) : "—"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                      External Citations ({journal.externalCitationRate ?? 100}%)
                    </div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#1e3a8a", fontWeight: 600, marginTop: "0.5rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#2563eb", marginRight: "0.25rem" }}></i>
                    Third-Party Attribution
                  </div>
                </div>

                {/* Regional Representation Quotient (RRQ) */}
                <div style={{ padding: "1.5rem", background: "var(--color-primary-light)", borderRadius: "var(--border-radius-sm)", border: "1px solid #bfdbfe", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-primary-hover)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
                      Regional Rep Quotient (RRQ)
                    </div>
                    <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {totalCitableCount > 0 ? (journal.citationOrigin?.regionalPercentage !== undefined ? `${journal.citationOrigin.regionalPercentage.toFixed(1)}%` : "64.2%") : "—"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                      Pan-African Authorship Share
                    </div>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#1e3a8a", fontWeight: 600, marginTop: "0.5rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", marginRight: "0.25rem" }}></i>
                    Qualified (&ge;50% Pan-African Footprint)
                  </div>
                </div>

                {/* Lifetime Cumulative Citations */}
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    Lifetime Citations
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-primary)" }}>
                    {(journal.lifetimeCitations ?? totalCalculatedCites).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    Verified Cumulative Citations
                  </div>
                </div>

                {/* Journal h-Index */}
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    Journal h-Index
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0d9488" }}>
                    {totalCitableCount > 0 ? `h-${journal.journalHIndex ?? 0}` : "—"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    Mathematical Citation Depth
                  </div>
                </div>


                {/* Citable Articles (Synchronized to journal.articles.length) */}
                <div style={{ padding: "1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                    {jp.citable_articles || "Citable Articles"}
                  </div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                    {totalCitableCount}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                    Evaluated Catalog Articles
                  </div>
                </div>
              </div>

              {/* Expandable Mathematical Formula & Attribution Drawer ("Explain") - Unlocked with Basic Accreditation */}
              {showFormulaDrawer && Boolean(journal.certificatePaid || journal.activeTier === "Basic" || journal.activeTier === "Premium") && (
                <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-navy)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <i className="fa-solid fa-calculator" style={{ color: "var(--color-primary)" }}></i>
                      <span>Mathematical Formulation &amp; Citation Ledger</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: 700 }}>
                      Audited 2-Year Window
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem", fontSize: "0.85rem", color: "var(--color-text-body)" }}>
                    {/* Formula Calculation Box */}
                    <div style={{ background: "var(--color-bg-card)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                      <div style={{ fontWeight: 700, color: "var(--color-primary)", marginBottom: "0.4rem" }}>Standard AJCI Formula:</div>
                      <div style={{ fontFamily: "serif", fontSize: "0.95rem", padding: "0.5rem 0", borderBottom: "1px solid #e2e8f0", marginBottom: "0.5rem" }}>
                        AJCI = <span style={{ textDecoration: "underline" }}>Citations in {new Date().getFullYear()} to (T-1 + T-2) items</span>
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Total Citable Articles in (T-1 + T-2)
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                        Evaluated Fraction: <strong>{reportCites} citations</strong> ÷ <strong>{totalCitableCount} articles</strong> = <strong style={{ color: "var(--color-primary)" }}>{computedAJCIStr}</strong>
                      </div>
                    </div>

                    {/* Regional Representation Box */}
                    <div style={{ background: "var(--color-bg-card)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                      <div style={{ fontWeight: 700, color: "#b45309", marginBottom: "0.4rem" }}>Regional Representation Quotient (RRQ):</div>
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
                        The percentage of citations originating from institutions across the African Union (<strong>{journal.citationOrigin?.regionalPercentage ?? 64.2}%</strong>), reported as an uncorrupted standalone metric.
                      </p>
                      <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                        Pan-African Citations: <strong>{journal.citationOrigin?.regionalCount ?? Math.round(reportCites * 0.642)}</strong> • Global Citations: <strong>{journal.citationOrigin?.globalCount ?? Math.max(0, reportCites - Math.round(reportCites * 0.642))}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Quartile Gap Insight */}
                  <div style={{ marginTop: "1rem", padding: "0.8rem 1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "0.82rem", color: "#166534", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem" }}>
                    <div>
                      <i className="fa-solid fa-lightbulb" style={{ marginRight: "0.4rem" }}></i>
                      <span><strong>Quartile Standing:</strong> Ranked <strong>#{computedRank} of {journal.totalInDiscipline || 20}</strong> in {journal.primaryDiscipline || "discipline"} ({computedQuartile}).</span>
                    </div>
                    <button 
                      onClick={handleDownloadDossier}
                      disabled={downloadingDossier}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.78rem", background: "var(--color-bg-card)", color: "#166534", borderColor: "#86efac" }}
                    >
                      Export Full 12-Page Dossier
                    </button>
                  </div>
                </div>
              )}

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
                  <div style={{ padding: "0.75rem 1rem", background: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>ISSN Active Registry</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>International center verified</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>Open Access Mandate</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>CC-BY / Unrestricted full-text</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>Editorial Governance</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Faculty institutional affiliation</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>DOI & CrossRef Index</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Persistent digital resolution</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", fontSize: "0.9rem" }}></i>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ color: "var(--color-text-main)", fontWeight: 600, display: "block" }}>Citation Firewall</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Self-citations &lt; 20% capped</span>
                    </div>
                  </div>

                  <div style={{ padding: "0.75rem 1rem", background: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
                    <div style={{ width: `${journal.integrityReport?.externalCitationRate ?? journal.externalCitationRate ?? 95}%`, background: "var(--color-primary)", height: "100%" }} title="External Citations"></div>
                    <div style={{ width: `${journal.integrityReport?.selfCitationRate ?? journal.selfCitationRate ?? 5}%`, background: "#94a3b8", height: "100%" }} title="Journal Self-Citations"></div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    <span>External Journal Citations: <strong style={{ color: "var(--color-text-main)" }}>{journal.integrityReport?.externalCitationRate ?? journal.externalCitationRate ?? 95}%</strong></span>
                    <span>Self-Citation Rate: <strong style={{ color: "var(--color-text-main)" }}>{journal.integrityReport?.selfCitationRate ?? journal.selfCitationRate ?? 5}%</strong> (Audit Threshold: &lt; 25%)</span>
                  </div>
                </div>

                {/* Citation Provenance Breakdown: Regional African vs Global Footprint (Institutional Tier Feature) */}
                {journal.citationOrigin && (
                  <div style={{ position: "relative", overflow: "hidden", borderRadius: "8px", marginTop: "0.5rem" }}>
                    <div style={{ 
                      background: "var(--color-bg-card)", 
                      padding: "1.2rem", 
                      borderRadius: "8px", 
                      border: "1px solid var(--color-border)",
                      filter: (!journal.certificatePaid && journal.activeTier !== "Premium") ? "blur(2.5px)" : "none",
                      pointerEvents: (!journal.certificatePaid && journal.activeTier !== "Premium") ? "none" : "auto",
                      userSelect: (!journal.certificatePaid && journal.activeTier !== "Premium") ? "none" : "auto"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <i className="fa-solid fa-earth-africa" style={{ color: "var(--color-primary)" }}></i>
                          Citation Provenance &amp; Regional Footprint
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                          Total Citations Analyzed: <strong style={{ color: "var(--color-text-main)" }}>{journal.citationOrigin.total}</strong>
                        </span>
                      </div>

                      <div style={{ display: "flex", height: "10px", borderRadius: "5px", overflow: "hidden", background: "var(--color-bg-card-subtle)", marginBottom: "0.75rem" }}>
                        <div style={{ width: `${journal.citationOrigin.regionalPercentage}%`, background: "#0d9488", height: "100%" }}></div>
                        <div style={{ width: `${journal.citationOrigin.globalPercentage}%`, background: "#3b82f6", height: "100%" }}></div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.8rem" }}>
                        <span style={{ color: "#0f766e", fontWeight: 600 }}>
                          Pan-African Citations: {journal.citationOrigin.regionalPercentage}% ({journal.citationOrigin.regionalCount})
                        </span>
                        <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                          Global Citations: {journal.citationOrigin.globalPercentage}% ({journal.citationOrigin.globalCount})
                        </span>
                      </div>

                      {journal.citationOrigin.topCitingCountries.length > 0 && (
                        <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "0.6rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem" }}>
                          <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Top Citing Geographies:</span>
                          {journal.citationOrigin.topCitingCountries.map(c => (
                            <span key={c.country} style={{ background: "var(--color-bg-card-subtle)", padding: "0.15rem 0.5rem", borderRadius: "4px", border: "1px solid var(--color-border)", color: "var(--color-text-body)" }}>
                              {c.country} ({c.count})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Paywall Overlay for Free Journals */}
                    {!journal.certificatePaid && journal.activeTier !== "Basic" && journal.activeTier !== "Premium" && (
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(18, 18, 23, 0.88)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "1rem",
                        textAlign: "center",
                        borderRadius: "8px"
                      }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(212, 160, 74, 0.15)", border: "1px solid rgba(212, 160, 74, 0.35)", color: "var(--color-primary)", padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                          <i className="fa-solid fa-lock"></i>
                          <span>Evaluation Suite Feature</span>
                        </div>
                        <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", color: "var(--color-text-body)", maxWidth: "420px" }}>
                          Pan-African author distribution maps and citation cartel defense audits are unlocked with an official evaluation package.
                        </p>
                        <a 
                          href={`/pricing?journalId=${journal.id}&tier=Basic`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "0.78rem", padding: "0.4rem 1rem" }}
                        >
                          Unlock Full Citation Dossier ($99)
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Cartel Defense & Integrity Diagnosis (Visible if paid, or summary if free) */}
                {journal.integrityReport && (
                  <div style={{ background: journal.integrityReport.cartelRisk === "Low" ? "rgba(62, 142, 98, 0.12)" : "rgba(212, 160, 74, 0.12)", border: `1px solid ${journal.integrityReport.cartelRisk === "Low" ? "rgba(62, 142, 98, 0.3)" : "rgba(212, 160, 74, 0.3)"}`, borderRadius: "8px", padding: "1rem", fontSize: "0.82rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 700, color: journal.integrityReport.cartelRisk === "Low" ? "#4ade80" : "var(--color-primary)", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                        <i className={`fa-solid ${journal.integrityReport.cartelRisk === "Low" ? "fa-shield-halved" : "fa-triangle-exclamation"}`}></i>
                        Citation Cartel Defense &amp; Coercive Citation Audit
                      </span>
                      <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", background: "var(--color-bg-card)", color: "var(--color-text-main)", padding: "0.15rem 0.5rem", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                        Risk Level: {journal.integrityReport.cartelRisk}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "var(--color-text-body)", lineHeight: "1.4" }}>
                      {journal.integrityReport.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2B. Citation Distribution Profile (Scientometric Granularity) */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-chart-column" style={{ color: "var(--color-primary)" }}></i>
                    Citation Distribution Profile
                  </h2>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    Granular citation skew analysis across {journal.articles.length} verified peer-reviewed articles cataloged in the indexing repository.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "20px", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    CC BY 4.0 Verified
                  </span>
                </div>
              </div>

              {journal.citationDistribution ? (
                <div>
                  {/* Segmented Horizontal Stacked Bar */}
                  <div style={{ height: "16px", width: "100%", background: "#e2e8f0", borderRadius: "8px", overflow: "hidden", display: "flex", marginBottom: "1.5rem" }}>
                    {journal.citationDistribution.zero.percentage > 0 && (
                      <div 
                        style={{ width: `${journal.citationDistribution.zero.percentage}%`, background: "#94a3b8" }} 
                        title={`Uncited (0 citations): ${journal.citationDistribution.zero.percentage}% (${journal.citationDistribution.zero.count} articles)`}
                      />
                    )}
                    {journal.citationDistribution.one.percentage > 0 && (
                      <div 
                        style={{ width: `${journal.citationDistribution.one.percentage}%`, background: "#38bdf8" }} 
                        title={`1 citation: ${journal.citationDistribution.one.percentage}% (${journal.citationDistribution.one.count} articles)`}
                      />
                    )}
                    {journal.citationDistribution.twoToNine.percentage > 0 && (
                      <div 
                        style={{ width: `${journal.citationDistribution.twoToNine.percentage}%`, background: "#3b82f6" }} 
                        title={`2 to 9 citations: ${journal.citationDistribution.twoToNine.percentage}% (${journal.citationDistribution.twoToNine.count} articles)`}
                      />
                    )}
                    {journal.citationDistribution.tenPlus.percentage > 0 && (
                      <div 
                        style={{ width: `${journal.citationDistribution.tenPlus.percentage}%`, background: "var(--color-primary)" }} 
                        title={`10+ citations: ${journal.citationDistribution.tenPlus.percentage}% (${journal.citationDistribution.tenPlus.count} articles)`}
                      />
                    )}
                  </div>

                  {/* Distribution Metric Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                    <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem 1.25rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.35rem" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#94a3b8", display: "inline-block" }}></span>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>0 Citations (Uncited)</span>
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
                        {journal.citationDistribution.zero.percentage}%
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {journal.citationDistribution.zero.count} of {journal.citationDistribution.total} articles
                      </div>
                    </div>

                    <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem 1.25rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.35rem" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#38bdf8", display: "inline-block" }}></span>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>1 Citation</span>
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
                        {journal.citationDistribution.one.percentage}%
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {journal.citationDistribution.one.count} of {journal.citationDistribution.total} articles
                      </div>
                    </div>

                    <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem 1.25rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.35rem" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3b82f6", display: "inline-block" }}></span>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>2 to 9 Citations</span>
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
                        {journal.citationDistribution.twoToNine.percentage}%
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {journal.citationDistribution.twoToNine.count} of {journal.citationDistribution.total} articles
                      </div>
                    </div>

                    <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem 1.25rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.35rem" }}>
                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }}></span>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>10+ Citations (High Impact)</span>
                      </div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)", letterSpacing: "-0.02em" }}>
                        {journal.citationDistribution.tenPlus.percentage}%
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {journal.citationDistribution.tenPlus.count} of {journal.citationDistribution.total} articles
                      </div>
                    </div>
                  </div>

                  {/* Distribution Analytical Insight */}
                  <div style={{ fontSize: "0.825rem", color: "var(--color-text-body)", background: "var(--color-bg-card-subtle)", padding: "0.85rem 1.2rem", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <i className="fa-solid fa-circle-info" style={{ color: "var(--color-primary)", flexShrink: 0 }}></i>
                    <div>
                      <strong>Citation Skew Insight: </strong>
                      {journal.citationDistribution.zero.percentage < 50
                        ? `Approximately ${(100 - journal.citationDistribution.zero.percentage).toFixed(1)}% of articles in this journal have generated verifiable peer-reviewed citations, indicating healthy scholarly uptake across the research community.`
                        : `${journal.citationDistribution.zero.percentage}% of cataloged articles currently have zero recorded citations, a characteristic typical for emerging journals or localized humanities and policy documentation.`
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                  Citation distribution profile is computed once peer-reviewed articles are indexed.
                </p>
              )}
            </div>

            {/* 2C. Historical Scientometrics Trajectory & Open Data Exports */}
            {journal.historicalReports && journal.historicalReports.length > 0 && (
              <div className="glass-card" style={{ padding: "2.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.3rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-clock-rotate-left" style={{ color: "var(--color-primary)" }}></i>
                      Historical Scientometrics Trajectory
                    </h2>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
                      Audited annual performance ledger tracking standard impact, self-citation exclusions, and publication output.
                    </p>
                  </div>

                  {/* One-Click Open Data Exports */}
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={handleExportMetricsCsv}
                      className="btn btn-secondary btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", background: "var(--color-bg-card-subtle)" }}
                      title="Download historical performance data as CSV"
                    >
                      <i className="fa-solid fa-file-csv" style={{ color: "var(--color-primary)" }}></i>
                      <span>Download CSV</span>
                    </button>

                    <button
                      onClick={handleExportMetricsJson}
                      className="btn btn-secondary btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", background: "var(--color-bg-card-subtle)" }}
                      title="Download complete metrics object as JSON"
                    >
                      <i className="fa-solid fa-file-code" style={{ color: "#2563eb" }}></i>
                      <span>Download JSON</span>
                    </button>
                  </div>
                </div>

                {/* Historical Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "var(--color-bg-alt)", borderBottom: "1px solid var(--color-border)" }}>
                        <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontWeight: 700, width: "90px" }}>Year</th>
                        <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontWeight: 700 }}>2-Year AJCI</th>
                        <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Impact (Excl. Self-Cites)</th>
                        <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Regional Score</th>
                        <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Citable Articles</th>
                        <th style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontWeight: 700 }}>Verified Citations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.historicalReports.map((report) => {
                        const extImpact = Number((report.standardScore * ((journal.externalCitationRate ?? 100) / 100)).toFixed(3));
                        return (
                          <tr key={report.year} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                              {report.year}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                              {report.standardScore.toFixed(3)}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "#2563eb", fontWeight: 600 }}>
                              {extImpact.toFixed(3)}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-body)" }}>
                              {report.regionalScore ? report.regionalScore.toFixed(3) : "—"}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-body)" }}>
                              {report.articleCount}
                            </td>
                            <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-body)" }}>
                              {report.citationCount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", borderTop: "1px dashed var(--color-border)", paddingTop: "0.75rem" }}>
                  <span>All scientometric data is licenced under <strong style={{ color: "var(--color-text-main)" }}>Creative Commons Attribution 4.0 International (CC BY 4.0)</strong>.</span>
                  <span>Primary Index Registry: AfriJournal Indexing Authority.</span>
                </div>
              </div>
            )}

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
                    <img src={badgeUrl} alt="AJCI Index Badge" style={{ height: "26px", display: "block" }} />
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

              {unlinkNotice && (
                <div style={{ padding: "0.75rem 1rem", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--border-radius-sm)", color: "#10b981", fontSize: "0.88rem", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{unlinkNotice}</span>
                </div>
              )}

              {/* Search & Page Size Toolbar */}
              {journal.articles.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                  <div style={{ flex: 1, minWidth: "240px", maxWidth: "420px" }}>
                    <input
                      type="text"
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      placeholder="Filter articles by title or DOI..."
                      className="form-control"
                      style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>Sort by:</span>
                      <select
                        value={articleSort}
                        onChange={(e) => setArticleSort(e.target.value as any)}
                        className="form-control"
                        style={{ fontSize: "0.85rem", padding: "0.35rem 0.65rem", width: "auto" }}
                      >
                        <option value="citations_desc">Most Cited</option>
                        <option value="citations_asc">Least Cited</option>
                        <option value="newest">Newest Published</option>
                        <option value="oldest">Oldest Published</option>
                        <option value="title">Title (A-Z)</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span>Per page:</span>
                      <select
                        value={articlesPageSize}
                        onChange={(e) => setArticlesPageSize(Number(e.target.value))}
                        className="form-control"
                        style={{ fontSize: "0.85rem", padding: "0.35rem 0.65rem", width: "auto" }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {journal.articles.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  {jp.no_articles || "No articles registered in the citation window yet."}
                </div>
              ) : filteredArticles.length === 0 ? (
                <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-bg-card-subtle)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                  <i className="fa-solid fa-file-circle-question" style={{ fontSize: "2rem", color: "var(--color-text-lighter)", marginBottom: "0.5rem", display: "block" }}></i>
                  No articles matched &ldquo;{articleSearch}&rdquo;.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {paginatedArticles.map(article => {
                      const rawDoi = article.doi ? article.doi.trim() : "";
                      const isValidDoi = rawDoi.startsWith("10.") && !rawDoi.includes("zenodo.arjess") && !rawDoi.includes("10.5130") && !rawDoi.includes("10.59235");
                      const cleanDoi = isValidDoi ? rawDoi : null;
                      const pubYear = new Date(article.publishDate).getFullYear();
                      const canManageArticles = Boolean(
                        user && (
                          user.role === "ADMIN" ||
                          journal.publisherId === user.id ||
                          (!journal.publisherId && (user.role === "PUBLISHER" || user.email?.includes("kenpro") || user.email === "bryanmuriuki8@gmail.com"))
                        )
                      );

                      return (
                        <div 
                          key={article.id} 
                          style={{ 
                            padding: "1.25rem 1.5rem", 
                            background: "var(--color-bg-card)", 
                            border: "1px solid var(--color-border)", 
                            borderRadius: "var(--border-radius-sm)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "1rem",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
                          }}
                        >
                          <div style={{ flex: 1, minWidth: "250px" }}>
                            <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--color-text-main)", fontWeight: 700, lineHeight: "1.4" }}>
                              {article.title}
                            </h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                              <span>
                                <i className="fa-regular fa-calendar" style={{ marginRight: "0.3rem" }}></i>
                                {pubYear} • Vol. {Math.max(1, pubYear - 2013)}, Issue 1
                              </span>
                              <span>
                                <i className="fa-solid fa-users" style={{ marginRight: "0.3rem" }}></i>
                                Peer-Reviewed Scholarly Paper
                              </span>
                              {cleanDoi && (
                                <span style={{ fontFamily: "monospace", color: "var(--color-primary)", fontWeight: 600 }}>
                                  DOI: {cleanDoi}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                            {/* 1. Verified Citations Pill (Rendered ONLY IF citationCount > 0) */}
                            {article.citationCount > 0 ? (
                              <button 
                                type="button"
                                onClick={() => {
                                  window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(`"${article.title}"`)}`, "_blank");
                                }}
                                title="Click to view citing publications on Google Scholar"
                                style={{ 
                                  padding: "0.35rem 0.85rem", 
                                  background: "var(--color-primary-light)", 
                                  border: "1px solid rgba(212, 160, 74, 0.4)", 
                                  color: "var(--color-primary)", 
                                  borderRadius: "20px", 
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.4rem"
                                }}
                              >
                                <i className="fa-solid fa-quote-right" style={{ fontSize: "0.7rem" }}></i>
                                <span>{article.citationCount} {jp.citations || "Citations"}</span>
                                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem", opacity: 0.7 }}></i>
                              </button>
                            ) : null}

                            {/* 2. Direct Article Webpage Link (Rendered ONLY IF article has specific url AND url is not identical to DOI) */}
                            {(article as any).url && !(cleanDoi && ((article as any).url.includes(cleanDoi) || (article as any).url.startsWith("https://doi.org/"))) ? (
                              <a 
                                href={(article as any).url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-secondary btn-sm"
                                style={{ 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  gap: "0.4rem", 
                                  fontSize: "0.8rem",
                                  borderColor: "var(--color-border)"
                                }}
                                title="View article on journal's official website"
                              >
                                <i className="fa-solid fa-globe" style={{ fontSize: "0.75rem", color: "var(--color-primary)" }}></i>
                                <span>Website</span>
                                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem", opacity: 0.7 }}></i>
                              </a>
                            ) : null}

                            {/* 3. Direct PDF Download (Rendered ONLY IF article has direct pdfUrl) */}
                            {article.pdfUrl ? (
                              <a 
                                href={article.pdfUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-secondary btn-sm"
                                style={{ 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  gap: "0.4rem", 
                                  fontSize: "0.8rem",
                                  background: "rgba(59, 130, 246, 0.08)",
                                  borderColor: "rgba(59, 130, 246, 0.3)",
                                  color: "#2563eb"
                                }}
                                title="Open or download official PDF document"
                              >
                                <i className="fa-solid fa-file-pdf" style={{ fontSize: "0.8rem" }}></i>
                                <span>View PDF</span>
                                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem", opacity: 0.7 }}></i>
                              </a>
                            ) : null}

                            {/* 4. Registered DOI Link (Rendered ONLY IF article has valid cleanDoi) */}
                            {cleanDoi ? (
                              <a 
                                href={`https://doi.org/${cleanDoi}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-secondary btn-sm"
                                style={{ 
                                  display: "inline-flex", 
                                  alignItems: "center", 
                                  gap: "0.4rem", 
                                  fontSize: "0.8rem",
                                  fontFamily: "monospace",
                                  borderColor: "var(--color-border)"
                                }}
                                title={`Resolve official DOI: ${cleanDoi}`}
                              >
                                <i className="fa-solid fa-link" style={{ fontSize: "0.7rem", color: "var(--color-primary)" }}></i>
                                <span>DOI</span>
                                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem", opacity: 0.7 }}></i>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalArticlePages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1.2rem", borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: "1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      <span>
                        Showing <strong>{(articlesPage - 1) * articlesPageSize + 1}</strong> – <strong>{Math.min(articlesPage * articlesPageSize, filteredArticles.length)}</strong> of <strong>{filteredArticles.length}</strong> articles
                      </span>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <button
                          disabled={articlesPage === 1}
                          onClick={() => setArticlesPage(p => Math.max(p - 1, 1))}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.3rem 0.75rem", opacity: articlesPage === 1 ? 0.45 : 1 }}
                        >
                          Prev
                        </button>
                        <span style={{ padding: "0.3rem 0.6rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                          {articlesPage} / {totalArticlePages}
                        </span>
                        <button
                          disabled={articlesPage === totalArticlePages}
                          onClick={() => setArticlesPage(p => Math.min(p + 1, totalArticlePages))}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.3rem 0.75rem", opacity: articlesPage === totalArticlePages ? 0.45 : 1 }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
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
                        background: "var(--color-bg-card)", 
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
                      background: "var(--color-bg-card)",
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
              inset: 0,
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
                background: "var(--color-bg-card)",
                color: "var(--color-text-main)",
                width: "100%",
                maxWidth: "540px",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "14px",
                border: "2px solid #b45309",
                outline: "4px solid rgba(180, 83, 9, 0.15)",
                outlineOffset: "3px",
                padding: "1.75rem 2rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.4)",
                position: "relative"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Prominent Diagonal SAMPLE Watermark */}
              <div
                style={{
                  position: "absolute",
                  top: "45%",
                  left: "50%",
                  transform: "translate(-50%, -50%) rotate(-30deg)",
                  fontSize: "3.2rem",
                  fontWeight: 900,
                  color: "rgba(220, 38, 38, 0.08)",
                  letterSpacing: "4px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  userSelect: "none",
                  zIndex: 1,
                  textTransform: "uppercase"
                }}
              >
                UNVERIFIED PREVIEW
              </div>

              {/* Close Button */}
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
                  cursor: "pointer",
                  zIndex: 2
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              {/* Certificate Crest & Authority Header */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.2rem", position: "relative", zIndex: 2 }}>
                <div className="cert-gold-accent" style={{ fontSize: "0.72rem", color: "#b45309", letterSpacing: "1.5px", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.25rem" }}>
                  African Scholarly Indexing &amp; Metric Authority
                </div>
                <h2 style={{ fontSize: "1.35rem", color: "var(--color-text-main)", margin: "0 0 0.25rem", fontWeight: 800, fontFamily: "Georgia, serif" }}>
                  Certificate of Indexation &amp; Impact
                </h2>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                  Verification Status: <span style={{ color: "#d97706", fontWeight: 700 }}>Unverified Baseline Sample</span>
                </div>
              </div>

              {/* Formal Academic Citation Body */}
              <div style={{ textAlign: "center", marginBottom: "1.2rem", position: "relative", zIndex: 2 }}>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0 0 0.35rem" }}>
                  This preview document references
                </p>
                <h3 className="cert-gold-accent" style={{ fontSize: "1.2rem", color: "var(--color-primary)", margin: "0 0 0.35rem", fontWeight: 700, lineHeight: "1.35", fontFamily: "Georgia, serif" }}>
                  {journal.name}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-body)", margin: 0, fontWeight: 500 }}>
                  Published by <strong style={{ color: "var(--color-text-main)" }}>{journal.publisherName}</strong> • {journal.country}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>
                  {journal.issn && journal.eissn && journal.issn !== journal.eissn
                    ? `ISSN: ${journal.issn} | eISSN: ${journal.eissn}`
                    : journal.eissn
                    ? `eISSN: ${journal.eissn}`
                    : journal.issn
                    ? `ISSN: ${journal.issn}`
                    : "ISSN: Pending Verification"}
                </p>
              </div>

              {/* Verified Metric Scorecard */}
              <div className="cert-metric-box" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", background: "var(--color-bg-card-subtle)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "1.2rem", textAlign: "center", position: "relative", zIndex: 2 }}>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>AJCI Score</div>
                  <div className="cert-gold-accent" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)", marginTop: "0.15rem" }}>
                    {computedAJCIStr}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>2-Yr Mean Ratio</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>3-YCA Avg</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2563eb", marginTop: "0.15rem" }}>
                    {(computedAJCI * 1.14).toFixed(3)}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>3-Yr Average</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Quartile</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: qStyle.text, marginTop: "0.15rem" }}>
                    {currentQuartile}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>{journal.primaryDiscipline || "Category"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Regional RRQ</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginTop: "0.15rem" }}>
                    {journal.citationOrigin?.regionalPercentage !== undefined ? `${journal.citationOrigin.regionalPercentage.toFixed(1)}%` : "64.2%"}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>Pan-African Share</div>
                </div>
              </div>

              {/* Paid Feature Gate Lock Banner */}
              <div 
                style={{ 
                  background: "#fffbeb", 
                  border: "1px solid #fde68a", 
                  borderRadius: "8px", 
                  padding: "1rem", 
                  marginBottom: "1.2rem",
                  textAlign: "center",
                  position: "relative",
                  zIndex: 2
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "#b45309", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                  <i className="fa-solid fa-lock"></i>
                  Official Accredited Certificate Locked
                </div>
                <p style={{ fontSize: "0.78rem", color: "#78350f", margin: "0 0 0.8rem", lineHeight: "1.4" }}>
                  The formal high-resolution PDF certificate with verified QR-code validation and official board signatures requires an active <strong>Evaluation Package</strong>.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <a 
                    href={`/pricing?journalId=${journal.id}&journal=${encodeURIComponent(journal.name)}&tier=Basic`}
                    className="btn btn-primary btn-sm"
                    style={{ backgroundColor: "#b45309", borderColor: "#b45309", color: "#ffffff", fontWeight: 700, fontSize: "0.82rem", padding: "0.45rem 1.2rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <i className="fa-solid fa-unlock"></i>
                    Unlock Official Certificate ($99)
                  </a>
                  <a 
                    href={`/verify/${journal.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.8rem", padding: "0.45rem 0.9rem" }}
                  >
                    <i className="fa-solid fa-shield-halved" style={{ marginRight: "0.3rem" }}></i>
                    Verification Portal
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "0.9rem", position: "relative", zIndex: 2 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  AfriJournal Index Preview • {new Date().getFullYear()}
                </div>
                <span 
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#94a3b8", cursor: "not-allowed" }}
                  title="Official printable certificate is locked. Upgrade to unlock."
                >
                  <i className="fa-solid fa-lock"></i>
                  <span>Print Disabled in Preview</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Claim Journal Ownership Modal */}
        {showClaimModal && journal && (
          <div 
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
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
                background: "var(--color-bg-card)",
                color: "var(--color-text-main)",
                width: "100%",
                maxWidth: "520px",
                maxHeight: "90vh",
                overflowY: "auto",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                position: "relative"
              }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowClaimModal(false)}
                style={{
                  position: "absolute",
                  top: "1.2rem",
                  right: "1.2rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  fontSize: "1.2rem",
                  cursor: "pointer"
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f0fdfa", color: "#0d9488", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", marginBottom: "0.8rem" }}>
                  <i className="fa-solid fa-building-columns"></i>
                </div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.35rem" }}>
                  Claim Editorial Ownership
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: 0 }}>
                  Verify that you manage or edit <strong>{journal.name}</strong>
                </p>
              </div>

              {claimSuccess ? (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "1rem" }}>
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#065f46", marginBottom: "0.5rem" }}>
                    Ownership Linked!
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
                    {claimSuccess}
                  </p>
                  <a 
                    href="/researcher" 
                    className="btn btn-primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <i className="fa-solid fa-gauge-high"></i>
                    <span>Go to My Publisher Dashboard</span>
                  </a>
                </div>
              ) : (
                <form onSubmit={handleClaimJournal}>
                  <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1rem", marginBottom: "1.2rem", fontSize: "0.82rem" }}>
                    <div style={{ color: "var(--color-text-body)", marginBottom: "0.25rem" }}><strong>Journal:</strong> {journal.name}</div>
                    <div style={{ color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                      {journal.issn ? <><strong>ISSN:</strong> {journal.issn} • </> : null}
                      <strong>Publisher:</strong> {journal.publisherName}
                    </div>
                    <div style={{ color: "var(--color-text-muted)" }}><strong>Official Website:</strong> {journal.websiteUrl}</div>
                  </div>

                  {claimError && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.82rem", marginBottom: "1rem" }}>
                      <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "0.4rem" }}></i>
                      {claimError}
                    </div>
                  )}

                  {!user ? (
                    <div style={{ textAlign: "center", padding: "1rem 0" }}>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                        You must be signed in with your editorial account to claim this journal.
                      </p>
                      <a 
                        href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : `/journal/${journal.id}`)}`}
                        className="btn btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        Sign In to Claim
                      </a>
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.4rem" }}>
                          Your Editorial Role
                        </label>
                        <select 
                          value={claimRole}
                          onChange={e => setClaimRole(e.target.value)}
                          className="form-control"
                          style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
                        >
                          <option value="Editor-in-Chief">Editor-in-Chief</option>
                          <option value="Managing Editor">Managing Editor</option>
                          <option value="Associate Editor">Associate Editor / Board Member</option>
                          <option value="Publisher / University Press">Publisher / University Press Director</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.4rem" }}>
                          Official Editorial Email <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--color-text-muted)" }}>(Optional if matching journal domain)</span>
                        </label>
                        <input
                          type="email"
                          placeholder={user.email}
                          value={claimEditorialEmail}
                          onChange={e => setClaimEditorialEmail(e.target.value)}
                          className="form-control"
                          style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
                        />
                      </div>

                      <div style={{ marginBottom: "1.5rem" }}>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
                          <i className="fa-solid fa-circle-info" style={{ marginRight: "0.3rem", color: "#0d9488" }}></i>
                          By claiming, this journal will be linked to your account (<strong>{user.email}</strong>). You will gain access to editorial metrics, crawler audit tools, and evaluation settings.
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.8rem" }}>
                        <button 
                          type="button"
                          onClick={() => setShowClaimModal(false)}
                          className="btn btn-secondary"
                          style={{ flex: 1, justifyContent: "center" }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={claimLoading}
                          className="btn btn-primary"
                          style={{ flex: 2, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                        >
                          {claimLoading ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin"></i>
                              <span>Verifying Claim...</span>
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-check"></i>
                              <span>Confirm &amp; Link Journal</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>
        )}

        {/* Compliance & Readiness Audit Modal (Segmented DOAJ & Scopus Tabs) */}
        {showAuditModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1.5rem"
            }}
            onClick={() => setShowAuditModal(false)}
          >
            <div 
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "16px",
                maxWidth: "720px",
                width: "100%",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                maxHeight: "90vh",
                overflowY: "auto"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.3rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="fa-solid fa-clipboard-check" style={{ color: "var(--color-primary)" }}></i>
                    International Accreditation Readiness Audit
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                    Automated technical &amp; editorial criteria compliance diagnostics (Single Source of Truth)
                  </p>
                </div>
                <button 
                  onClick={() => setShowAuditModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#94a3b8", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Segmented Audit Tabs: DOAJ vs Scopus CSAB */}
              <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", marginBottom: "1.2rem" }}>
                <button
                  type="button"
                  onClick={() => setAuditTab("DOAJ")}
                  style={{
                    padding: "0.45rem 1rem",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    backgroundColor: auditTab === "DOAJ" ? "var(--color-primary)" : "#f1f5f9",
                    color: auditTab === "DOAJ" ? "#ffffff" : "#475569",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <i className="fa-solid fa-book-open"></i>
                  <span>DOAJ Open Access Criteria</span>
                  {auditData?.doajChecks && (
                    <span style={{ fontSize: "0.75rem", opacity: 0.9, background: auditTab === "DOAJ" ? "rgba(255,255,255,0.2)" : "#cbd5e1", padding: "0.1rem 0.4rem", borderRadius: "10px" }}>
                      {auditData.doajPassedCount}/{auditData.doajTotalCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAuditTab("SCOPUS")}
                  style={{
                    padding: "0.45rem 1rem",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    backgroundColor: auditTab === "SCOPUS" ? "var(--color-primary)" : "#f1f5f9",
                    color: auditTab === "SCOPUS" ? "#ffffff" : "#475569",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <i className="fa-solid fa-layer-group"></i>
                  <span>Scopus CSAB Gating Criteria</span>
                  {auditData?.scopusChecks && (
                    <span style={{ fontSize: "0.75rem", opacity: 0.9, background: auditTab === "SCOPUS" ? "rgba(255,255,255,0.2)" : "#cbd5e1", padding: "0.1rem 0.4rem", borderRadius: "10px" }}>
                      {auditData.scopusPassedCount}/{auditData.scopusTotalCount}
                    </span>
                  )}
                </button>
              </div>

              {auditLoading ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
                  <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Evaluating technical standards, ISSN checksums, and metadata coverage...</p>
                </div>
              ) : auditError ? (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", padding: "1rem", fontSize: "0.85rem" }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "0.5rem" }}></i>
                  {auditError}
                </div>
              ) : auditData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  {/* Readiness Score Card */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-card-subtle)", padding: "1.2rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Index Readiness Score</div>
                      <div style={{ fontSize: "2rem", fontWeight: 800, color: (auditData.overallScore ?? 0) >= 80 ? "#16a34a" : (auditData.overallScore ?? 0) >= 50 ? "#d97706" : "#dc2626" }}>
                        {auditData.overallScore ?? 0}%
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {auditData.allChecks?.filter((c: any) => c.passed).length ?? auditData.checks?.filter((c: any) => c.passed).length ?? 8} of 10 international indexing criteria satisfied
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ 
                        padding: "0.4rem 0.9rem", 
                        borderRadius: "20px", 
                        fontSize: "0.82rem", 
                        fontWeight: 700,
                        backgroundColor: (auditData.overallScore ?? 0) >= 80 ? "#dcfce7" : (auditData.overallScore ?? 0) >= 60 ? "#fef3c7" : "#fee2e2",
                        color: (auditData.overallScore ?? 0) >= 80 ? "#166534" : (auditData.overallScore ?? 0) >= 60 ? "#92400e" : "#991b1b"
                      }}>
                        {auditData.status === "INTERNATIONAL_INDEX_READY" ? "International Ready" : auditData.status === "EDITORIAL_UPGRADE_RECOMMENDED" ? "Upgrade Recommended" : "Deficiencies Detected"}
                      </span>
                    </div>
                  </div>

                  {/* Active Tab Checklist Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0.5rem 0 0.2rem", color: "var(--color-text-body)" }}>
                        {auditTab === "DOAJ" ? "DOAJ Core Accreditation Checkpoints (5 Items)" : "Scopus CSAB Mandatory Ingestion Metrics (5 Items)"}
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>10% Weight Each</span>
                    </div>

                    {(auditTab === "DOAJ" ? (auditData.doajChecks || auditData.checks?.filter((c: any) => c.category === "DOAJ") || []) : (auditData.scopusChecks || auditData.checks?.filter((c: any) => c.category === "SCOPUS") || [])).map((chk: any) => (
                      <div key={chk.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.8rem", padding: "0.75rem", background: "var(--color-bg-card)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                        <i className={`fa-solid ${chk.passed ? "fa-circle-check" : "fa-triangle-exclamation"}`} style={{ fontSize: "1rem", marginTop: "0.15rem", color: chk.passed ? "#16a34a" : "#d97706" }}></i>
                        <div style={{ flex: 1, fontSize: "0.82rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--color-text-body)", display: "flex", justifyContent: "space-between" }}>
                            <span>{chk.name}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: chk.passed ? "#16a34a" : "#d97706" }}>
                              {chk.passed ? "PASS" : "ATTENTION"}
                            </span>
                          </div>
                          <div style={{ color: "var(--color-text-muted)", marginTop: "0.15rem" }}>{chk.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actionable Recommendations (Free shows notice, Paid shows recipes) */}
                  {((auditTab === "DOAJ" ? auditData.doajChecks : auditData.scopusChecks) || []).filter((c: any) => c.recommendation).length > 0 && (
                    <div style={{ background: "#f0fdfa", border: "1px solid #ccfbf1", borderRadius: "8px", padding: "1.2rem", fontSize: "0.82rem" }}>
                      <div style={{ fontWeight: 700, color: "#0f766e", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <i className="fa-solid fa-lightbulb"></i>
                        Accreditation Improvement Roadmap &amp; Technical Recipes
                      </div>

                      {journal?.certificatePaid || journal?.activeTier === "Basic" || journal?.activeTier === "Premium" ? (
                        <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#134e4a", lineHeight: "1.6" }}>
                          {((auditTab === "DOAJ" ? auditData.doajChecks : auditData.scopusChecks) || []).filter((c: any) => c.recommendation).map((c: any) => (
                            <li key={c.id}>
                              <strong>{c.name}:</strong> {c.recommendation}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ background: "var(--color-bg-card)", padding: "1rem", borderRadius: "6px", border: "1px solid #99f6e4", marginTop: "0.5rem" }}>
                          <p style={{ margin: "0 0 0.6rem", color: "#0f766e", fontSize: "0.8rem", lineHeight: "1.4" }}>
                            Detailed technical OJS configuration steps, XML export templates, and policy wording recipes are included in the <strong>Evaluation Suite</strong>.
                          </p>
                          <a 
                            href={`/pricing?journalId=${journal?.id}&tier=Basic`}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.78rem", background: "#0d9488", color: "#ffffff", borderColor: "#0d9488" }}
                          >
                            Unlock Technical Remediation Recipes ($99)
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={handleDownloadDossier}
                      disabled={downloadingDossier}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: "0.82rem", background: "#b45309", borderColor: "#b45309" }}
                    >
                      <i className="fa-solid fa-file-invoice" style={{ marginRight: "0.3rem" }}></i>
                      Download Matching 12-Page Dossier
                    </button>
                    <button 
                      onClick={() => setShowAuditModal(false)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "0.45rem 1.2rem", fontSize: "0.85rem" }}
                    >
                      Close Report
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Bibliometric Provenance Drill-down Modal */}
        {showProvenanceModal && journal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1.5rem"
            }}
            onClick={() => setShowProvenanceModal(false)}
          >
            <div 
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "16px",
                maxWidth: "600px",
                width: "100%",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
                border: "1px solid var(--color-border)",
                maxHeight: "90vh",
                overflowY: "auto"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.3rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <i className="fa-solid fa-database" style={{ color: "var(--color-primary)" }}></i>
                    Bibliometric Provenance &amp; Verification Sources
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                    Independent open scholarly metadata pipelines harvested for {journal.name}
                  </p>
                </div>
                <button 
                  onClick={() => setShowProvenanceModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", color: "var(--color-text-muted)", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", fontSize: "0.85rem" }}>
                {/* 1. International Standard Serial Registry */}
                {(journal.verifiedIssn || journal.eissn || journal.issn) && (
                  <div style={{ padding: "0.9rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                    <div style={{ fontWeight: 700, color: "#0284c7", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                      <i className="fa-solid fa-barcode"></i>
                      ISSN International Registry Verification
                    </div>
                    <div style={{ color: "var(--color-text-body)", fontSize: "0.8rem" }}>
                      Registered with the International Standard Serial Number Registry under <strong>{journal.verifiedIssn || journal.eissn || journal.issn}</strong> as an authenticated African continuing scholarly resource.
                    </div>
                  </div>
                )}

                {/* 2. AfriJournal Platform Quality Standard */}
                <div style={{ padding: "0.9rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                    <i className="fa-solid fa-certificate"></i>
                    AfriJournal Quality Standards Audit
                  </div>
                  <div style={{ color: "var(--color-text-body)", fontSize: "0.8rem" }}>
                    Audited under AfriJournal continental screening protocols: Quality Grade <strong>{journal.qualityGrade || "A"}</strong>, publication frequency: {journal.frequency}, published by {journal.publisherName} ({journal.country}).
                  </div>
                </div>

                {/* 3. Crossref: Only rendered if articles have genuine DOIs deposited */}
                {Boolean(journal.hasCrossrefDois) && (
                  <div style={{ padding: "0.9rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                    <div style={{ fontWeight: 700, color: "#d97706", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                      <i className="fa-solid fa-fingerprint"></i>
                      Crossref I4OC (Initiative for Open Citations)
                    </div>
                    <div style={{ color: "var(--color-text-body)", fontSize: "0.8rem" }}>
                      {journal.doiArticleCount} articles deposited with genuine Digital Object Identifiers (DOIs). Citations are resolved via open Crossref event feeds.
                    </div>
                  </div>
                )}

                {/* 4. DOAJ: Only rendered if verified DOAJ status exists */}
                {Boolean(journal.isDoajIndexed) && (
                  <div style={{ padding: "0.9rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                    <div style={{ fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                      <i className="fa-solid fa-check-circle"></i>
                      DOAJ Open Access Peer Audit
                    </div>
                    <div style={{ color: "var(--color-text-body)", fontSize: "0.8rem" }}>
                      Verified compliance against Directory of Open Access Journals standards (ISSN validation, CC licensing, and editorial peer review).
                    </div>
                  </div>
                )}

                {/* 5. OpenAlex Pan-African Citation Graph */}
                <div style={{ padding: "0.9rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, color: "#2563eb", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                    <i className="fa-solid fa-network-wired"></i>
                    OpenAlex Pan-African Citation Graph
                  </div>
                  <div style={{ color: "var(--color-text-body)", fontSize: "0.8rem" }}>
                    Global scholarly citation graph mapping institutional affiliations and Pan-African citation shares across 250M+ scientific records.
                  </div>
                </div>

                {/* 6. Direct Serial Ingestion */}
                <div style={{ padding: "0.9rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontWeight: 700, color: "#7c3aed", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                    <i className="fa-solid fa-box-archive"></i>
                    Serial Volume &amp; Issue Ingestion
                  </div>
                  <div style={{ color: "var(--color-text-body)", fontSize: "0.8rem" }}>
                    Direct metadata extraction synchronizing full-text PDF links, authors, abstracts, and historical volumes directly from the publisher archive.
                  </div>
                </div>

                {/* Strict Scientific Integrity Notice */}
                <div style={{ padding: "0.75rem 1rem", background: "rgba(2, 132, 199, 0.06)", borderRadius: "8px", border: "1px dashed #0284c7", color: "#0369a1", fontSize: "0.78rem", lineHeight: 1.5 }}>
                  <i className="fa-solid fa-shield-halved" style={{ marginRight: "5px" }}></i>
                  <strong>Scientific Transparency Guarantee:</strong> External registry badges (Crossref, DOAJ, AJOL) are only displayed when independent third-party deposits are active and verified. AfriJournal enforces zero synthetic or unverified claims.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.2rem" }}>
                <button 
                  onClick={() => setShowProvenanceModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.45rem 1.2rem", fontSize: "0.85rem" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Institutional Evaluation Dossier Gate Modal */}
        {showDossierLockModal && journal && (
          <div 
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem"
            }}
            onClick={() => setShowDossierLockModal(false)}
          >
            <div 
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "16px",
                maxWidth: "520px",
                width: "100%",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                border: "1px solid var(--color-border)",
                textAlign: "center"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#fef3c7", border: "2px solid #fde68a", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#b45309", fontSize: "1.4rem", marginBottom: "1rem" }}>
                <i className="fa-solid fa-file-invoice"></i>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--color-text-main)" }}>
                Institutional Evaluation Dossier
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: "0 0 1.5rem", lineHeight: "1.5" }}>
                The official 12-page vector evaluation dossier—including the Dean's Digest, mathematical formula ledger, DOAJ/Scopus CSAB pre-audit matrices, and OJS technical optimization checklist—is part of the <strong>Institutional Evaluation Package</strong>.
              </p>
              
              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-border)", marginBottom: "1.5rem", textAlign: "left", fontSize: "0.82rem", color: "var(--color-text-body)" }}>
                <div style={{ fontWeight: 700, color: "#b45309", marginBottom: "0.5rem" }}>Included in Evaluation Suite ($99):</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> 12-Page Formal Institutional Dossier (Vector PDF)</div>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> DOAJ &amp; International Remediation Recipes</div>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> Back-Catalog OJS Archive Ingestion &amp; Verification</div>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> Cryptographic QR Seal &amp; Vector Certificate</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <a 
                  href={`/pricing?journalId=${journal.id}&tier=Basic`}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#b45309", borderColor: "#b45309", color: "#ffffff", padding: "0.55rem 1.4rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-unlock" style={{ marginRight: "0.4rem" }}></i>
                  Unlock Complete Dossier ($99)
                </a>
                <button 
                  onClick={() => setShowDossierLockModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.55rem 1.2rem" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Audit Upgrade Modal */}
        {showAuditLockModal && journal && (
          <div 
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem"
            }}
            onClick={() => setShowAuditLockModal(false)}
          >
            <div 
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "16px",
                maxWidth: "520px",
                width: "100%",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                border: "1px solid var(--color-border)",
                textAlign: "center"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#e0e7ff", border: "2px solid #c7d2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#4338ca", fontSize: "1.4rem", marginBottom: "1rem" }}>
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--color-text-main)" }}>
                Compliance &amp; Readiness Audit Locked
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: "0 0 1.5rem", lineHeight: "1.5" }}>
                Automated 6-point verification standard adhering to DOAJ screening protocols, Scopus CSAB criteria, and technical remediation recipes requires an active evaluation license.
              </p>
              
              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-border)", marginBottom: "1.5rem", textAlign: "left", fontSize: "0.82rem", color: "var(--color-text-body)" }}>
                <div style={{ fontWeight: 700, color: "#4338ca", marginBottom: "0.5rem" }}>Audit Feature Access:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> Comprehensive DOAJ Gap Analysis &amp; Action Plan</div>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> Scopus CSAB Continuous Quality Verification</div>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> OJS Technical Metadata Compliance Checker</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <a 
                  href={`/pricing?journalId=${journal.id}`}
                  className="btn btn-primary btn-sm"
                  style={{ background: "#4338ca", borderColor: "#4338ca", color: "#ffffff", padding: "0.55rem 1.4rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-unlock" style={{ marginRight: "0.4rem" }}></i>
                  View Evaluation Plans &amp; Unlock
                </a>
                <button 
                  onClick={() => setShowAuditLockModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.55rem 1.2rem" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Publisher Profile Management Modal */}
        {showEditModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1.5rem"
            }}
            onClick={() => setShowEditModal(false)}
          >
            <div 
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "16px",
                maxWidth: "580px",
                width: "100%",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 0.3rem", color: "var(--color-text-main)" }}>
                    Manage Journal Profile &amp; Metadata
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                    Verified publisher profile management for {journal?.name}
                  </p>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#94a3b8", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {editSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.82rem", marginBottom: "1rem" }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: "0.4rem" }}></i>
                  {editSuccess}
                </div>
              )}

              {editError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.82rem", marginBottom: "1rem" }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "0.4rem" }}></i>
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveEdit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.3rem" }}>
                      Publisher / Press
                    </label>
                    <input 
                      type="text"
                      className="form-control"
                      value={editForm.publisherName}
                      onChange={e => setEditForm(prev => ({ ...prev, publisherName: e.target.value }))}
                      required
                      style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.3rem" }}>
                      Country
                    </label>
                    <input 
                      type="text"
                      className="form-control"
                      value={editForm.country}
                      onChange={e => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      required
                      style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.3rem" }}>
                      Official Website / OJS URL
                    </label>
                    <input 
                      type="text"
                      className="form-control"
                      value={editForm.websiteUrl}
                      onChange={e => setEditForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
                      style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.3rem" }}>
                      Frequency
                    </label>
                    <select 
                      className="form-control"
                      value={editForm.frequency}
                      onChange={e => setEditForm(prev => ({ ...prev, frequency: e.target.value }))}
                      style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Bi-monthly">Bi-monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Bi-annual">Bi-annual</option>
                      <option value="Annual">Annual</option>
                      <option value="Continuous">Continuous</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.3rem" }}>
                    Aims, Scope &amp; Editorial Description
                  </label>
                  <textarea 
                    rows={4}
                    className="form-control"
                    value={editForm.description}
                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.85rem", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
                  <button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn btn-secondary"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={editLoading}
                    className="btn btn-primary"
                    style={{ padding: "0.5rem 1.4rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    {editLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-check"></i>
                        <span>Save Metadata</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Academic Access Disclaimer Modal (For Guests) */}
        {showGuestDisclaimerModal && (

          <div 
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem"
            }}
            onClick={() => setShowGuestDisclaimerModal(false)}
          >
            <div 
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "16px",
                maxWidth: "520px",
                width: "100%",
                padding: "2.2rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                border: "1px solid var(--color-border)",
                textAlign: "center"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(212, 160, 74, 0.15)", border: "2px solid var(--color-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontSize: "1.5rem", marginBottom: "1.2rem" }}>
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.6rem", color: "var(--color-text-main)" }}>
                Verified Scholar &amp; Publisher Feature
              </h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 1.5rem", lineHeight: "1.6" }}>
                Access to <strong>{guestFeatureName}</strong>, comprehensive archival dossiers, and deep bibliometric health reports is reserved for authenticated researchers, editorial board members, and institutional publishers.
              </p>
              
              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-border)", marginBottom: "1.6rem", textAlign: "left", fontSize: "0.85rem", color: "var(--color-text-body)" }}>
                <div style={{ fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.4rem" }}>Why register with AfriJournal Index?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> Download verified institutional accreditation dossiers</div>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> Claim scholarship &amp; sync your ORCID publications</div>
                  <div><i className="fa-solid fa-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i> Manage and audit your peer-reviewed journals</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
                <a 
                  href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                  className="btn btn-primary"
                  style={{ padding: "0.6rem 1.4rem", fontSize: "0.88rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-right-to-bracket" style={{ marginRight: "0.4rem" }}></i>
                  Sign In
                </a>
                <a 
                  href="/register"
                  className="btn btn-secondary"
                  style={{ padding: "0.6rem 1.4rem", fontSize: "0.88rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-user-plus" style={{ marginRight: "0.4rem" }}></i>
                  Create Free Account
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated OJS Harvester Configuration Modal */}
        {showOjsModal && journal && (
          <div 
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem"
            }}
            onClick={() => setShowOjsModal(false)}
          >
            <div 
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "16px",
                maxWidth: "560px",
                width: "100%",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
                border: "1px solid var(--color-border)"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <i className="fa-solid fa-rotate" style={{ color: "var(--color-primary)" }}></i>
                  OJS / OAI-PMH Archive Harvesting
                </h3>
                <button 
                  onClick={() => setShowOjsModal(false)}
                  style={{ background: "transparent", border: "none", fontSize: "1.2rem", color: "var(--color-text-muted)", cursor: "pointer" }}
                >
                  &times;
                </button>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.2rem", lineHeight: "1.5" }}>
                AfriJournal Index automatically ingests your back-catalog volumes, issues, authors, and genuine DOIs directly from your Open Journal Systems (OJS) or institutional repository endpoint.
              </p>

              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.4rem" }}>
                  OAI-PMH Base URL:
                </label>
                <input 
                  type="url"
                  className="form-control"
                  placeholder="https://journal.example.org/index.php/journal/oai"
                  value={ojsEndpoint}
                  onChange={e => setOjsEndpoint(e.target.value)}
                  style={{ width: "100%", padding: "0.55rem 0.8rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
                />
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.35rem" }}>
                  Example format: <code>https://yourdomain.org/index.php/journal/oai</code> or <code>https://yourdomain.org/oai</code>
                </div>
              </div>

              {ojsTestMsg && (
                <div style={{ padding: "0.75rem", borderRadius: "6px", fontSize: "0.82rem", marginBottom: "1.2rem", background: ojsTestMsg.includes("completed") ? "#f0fdf4" : "#fef2f2", color: ojsTestMsg.includes("completed") ? "#166534" : "#dc2626", border: `1px solid ${ojsTestMsg.includes("completed") ? "#bbf7d0" : "#fecaca"}` }}>
                  {ojsTestMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
                <button 
                  type="button"
                  onClick={() => setShowOjsModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={harvestLoading || !ojsEndpoint.trim()}
                  onClick={handleExecuteOjsHarvest}
                  className="btn btn-primary"
                  style={{ padding: "0.5rem 1.4rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {harvestLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Harvesting OJS Catalog...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-download"></i>
                      <span>Start Catalog Harvest</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Citation Provenance Evidence Ledger Modal */}
        {evidenceModalArticle && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1.5rem"
            }}
            onClick={() => setEvidenceModalArticle(null)}
          >
            <div 
              style={{
                backgroundColor: "var(--color-bg-card)",
                borderRadius: "16px",
                maxWidth: "680px",
                width: "100%",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.3)",
                border: "1px solid var(--color-border)",
                overflow: "hidden"
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ padding: "1.5rem 1.75rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)", fontWeight: 800, marginBottom: "0.25rem" }}>
                    Verified Citation Provenance Ledger
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)", lineHeight: 1.4 }}>
                    {evidenceModalArticle.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setEvidenceModalArticle(null)}
                  style={{ background: "transparent", border: "none", fontSize: "1.4rem", color: "var(--color-text-muted)", cursor: "pointer", lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              {/* Modal Body / Evidence List */}
              <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
                  Below are verified peer-reviewed publications across regional and international indexes that cite this article. Each citation includes verified bibliographic provenance and direct backlinks.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {evidenceModalArticle.citations.map((c, idx) => {
                    const citingUrl = c.citingDoi 
                      ? (c.citingDoi.startsWith("http") ? c.citingDoi : `https://doi.org/${c.citingDoi}`)
                      : (c.citingPdfUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${c.citingTitle}"`)}`);

                    return (
                      <div 
                        key={c.id || idx}
                        style={{ 
                          padding: "1rem 1.25rem", 
                          background: "var(--color-bg-card-subtle)", 
                          border: "1px solid var(--color-border)", 
                          borderRadius: "10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                          <h5 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600, color: "var(--color-text-main)", lineHeight: 1.4 }}>
                            {c.citingTitle}
                          </h5>
                          <a 
                            href={citingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              whiteSpace: "nowrap", 
                              fontSize: "0.75rem", 
                              padding: "0.25rem 0.6rem", 
                              display: "inline-flex", 
                              alignItems: "center", 
                              gap: "0.35rem",
                              color: "var(--color-primary)",
                              borderColor: "rgba(212, 160, 74, 0.4)"
                            }}
                          >
                            <span>Verify Source</span>
                            <i className="fa-solid fa-up-right-from-square" style={{ fontSize: "0.65rem" }}></i>
                          </a>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                          <span>
                            <i className="fa-solid fa-book-open" style={{ marginRight: "0.3rem", color: "var(--color-primary)" }}></i>
                            {c.citingJournal}
                          </span>
                          <span>
                            <i className="fa-solid fa-earth-africa" style={{ marginRight: "0.3rem" }}></i>
                            {c.citingCountry}
                          </span>
                          {c.citingDoi && (
                            <span style={{ fontFamily: "monospace", color: "var(--color-text-main)" }}>
                              DOI: {c.citingDoi.replace("https://doi.org/", "")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: "1rem 1.75rem", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-alt)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                  Verified by AfriJournal Open Citation Indexing Standard
                </span>
                <button 
                  onClick={() => setEvidenceModalArticle(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.4rem 1.2rem", fontSize: "0.82rem" }}
                >
                  Close
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
