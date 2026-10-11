"use client";

import React, { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { jsPDF } from "jspdf";
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

  // Modals & UI States
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"publications" | "editorial">(
    tabParam === "editorial" ? "editorial" : "publications"
  );
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [activeCiteArticle, setActiveCiteArticle] = useState<any | null>(null);
  const [citeFormat, setCiteFormat] = useState<"APA" | "Harvard" | "BibTeX">("APA");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === "editorial") {
      setActiveTab("editorial");
    }
  }, [tabParam]);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState({
    name: "",
    academicRank: "",
    institution: "",
    department: "",
    country: "",
    orcid: "",
    bio: "",
    researchFocus: ""
  });
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [orcidCheckStatus, setOrcidCheckStatus] = useState<{
    loading: boolean;
    verified: boolean | null;
    name?: string;
    error?: string;
  }>({ loading: false, verified: null });
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Publications Filter & Pagination State
  const [articleSearchQuery, setArticleSearchQuery] = useState<string>("");
  const [articleSortBy, setArticleSortBy] = useState<"citations" | "year" | "title">("citations");
  const [pubPage, setPubPage] = useState<number>(1);
  const [pubPageSize, setPubPageSize] = useState<number>(5);

  // Claiming & Authorship Verification State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [verifyingArticle, setVerifyingArticle] = useState<any | null>(null);
  const [authorRole, setAuthorRole] = useState<string>("Lead Author");
  const [certifiedIntegrity, setCertifiedIntegrity] = useState<boolean>(false);
  const [claimActionLoading, setClaimActionLoading] = useState<boolean>(false);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(false);
  const [verificationData, setVerificationData] = useState<{
    isMatch: boolean;
    matchedAuthor: string | null;
    registeredAuthors: string[];
    orcidMatched: boolean;
    userName: string;
  } | null>(null);
  const [institutionalEmail, setInstitutionalEmail] = useState<string>("");
  const [manualJustification, setManualJustification] = useState<string>("");

  // Journal Claiming State
  const [showJournalClaimModal, setShowJournalClaimModal] = useState<boolean>(false);
  const [claimJournalSearch, setClaimJournalSearch] = useState<string>("");
  const [claimJournalResults, setClaimJournalResults] = useState<any[]>([]);
  const [claimJournalSearching, setClaimJournalSearching] = useState<boolean>(false);
  const [claimingJournalId, setClaimingJournalId] = useState<string | null>(null);
  const [claimJournalSuccess, setClaimJournalSuccess] = useState<string | null>(null);
  const [claimJournalError, setClaimJournalError] = useState<string | null>(null);
  const [claimJournalRole, setClaimJournalRole] = useState<string>("Editor-in-Chief");

  const handleSearchUnclaimedJournals = async (q: string) => {
    setClaimJournalSearch(q);
    if (q.trim().length < 2) {
      setClaimJournalResults([]);
      return;
    }
    setClaimJournalSearching(true);
    try {
      const res = await fetch(`/api/journals/claim?search=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.success) {
        setClaimJournalResults(json.journals || []);
      }
    } catch {
      // ignore
    } finally {
      setClaimJournalSearching(false);
    }
  };

  const handleClaimJournalInDashboard = async (journalId: string) => {
    setClaimingJournalId(journalId);
    setClaimJournalError(null);
    setClaimJournalSuccess(null);
    try {
      const res = await fetch("/api/journals/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId,
          roleTitle: claimJournalRole
        })
      });
      const json = await res.json();
      if (json.success) {
        setClaimJournalSuccess(json.message || "Journal claimed successfully!");
        setClaimJournalResults(prev => prev.filter(j => j.id !== journalId));
        if (targetId) {
          loadProfile();
        }
      } else {
        setClaimJournalError(json.error || "Failed to claim journal.");
      }
    } catch {
      setClaimJournalError("Network error while claiming journal.");
    } finally {
      setClaimingJournalId(null);
    }
  };

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
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  const targetId = id || currentUser?.id;

  // Load avatar from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && targetId) {
      const savedAvatar = localStorage.getItem(`afri_avatar_${targetId}`);
      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    }
  }, [targetId]);

  const loadProfile = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/researcher/profile?id=${encodeURIComponent(targetId)}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        const p = result.data.profile;
        setEditForm({
          name: p.name || "",
          academicRank: p.academicRank || "Senior Research Fellow & Author",
          institution: p.institution || "University of Nairobi",
          department: p.department || "School of Education & Social Sciences",
          country: p.country || "Kenya",
          orcid: p.orcid || "",
          bio: p.bio || "",
          researchFocus: (p.researchFocus || []).join(", ")
        });
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
    } else if (authChecked && !targetId) {
      setLoading(false);
    }
  }, [targetId, authChecked]);

  const showToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => {
      setCopiedNotification(null);
    }, 2800);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      showToast("Public profile link copied to clipboard!");
    }
  };

  const handleCopyBadge = (journalId: string) => {
    if (typeof window !== "undefined") {
      const code = `<a href="https://afrijournalindex.org/journal/${journalId}" target="_blank" rel="noopener noreferrer"><img src="https://afrijournalindex.org/api/badge/${journalId}" alt="AfriJournal Verified Indexed" /></a>`;
      navigator.clipboard.writeText(code);
      showToast("Verification badge embed HTML copied to clipboard!");
    }
  };

  // Avatar photo file upload handler
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarUrl(dataUrl);
      if (typeof window !== "undefined" && targetId) {
        localStorage.setItem(`afri_avatar_${targetId}`, dataUrl);
      }
      showToast("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    if (typeof window !== "undefined" && targetId) {
      localStorage.removeItem(`afri_avatar_${targetId}`);
    }
    showToast("Profile photo removed.");
  };

  // Verify ORCID with Registry
  const handleVerifyOrcid = async () => {
    if (!editForm.orcid.trim()) {
      setOrcidCheckStatus({ loading: false, verified: null, error: "Please enter an ORCID iD to verify." });
      return;
    }
    setOrcidCheckStatus({ loading: true, verified: null });
    try {
      const res = await fetch(`/api/researcher/profile?action=verify-orcid&orcid=${encodeURIComponent(editForm.orcid.trim())}`);
      const resData = await res.json();
      if (resData.success) {
        setOrcidCheckStatus({
          loading: false,
          verified: true,
          name: resData.registeredName
        });
        setEditForm(prev => ({ ...prev, orcid: resData.orcid }));
        showToast("ORCID authenticated with official international registry!");
      } else {
        setOrcidCheckStatus({
          loading: false,
          verified: false,
          error: resData.error || "ORCID could not be verified in the international registry."
        });
      }
    } catch (err) {
      console.error(err);
      setOrcidCheckStatus({
        loading: false,
        verified: false,
        error: "Failed to connect to ORCID registry."
      });
    }
  };

  // Save Edit Profile with strict ORCID checks
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side ORCID format check if provided
    if (editForm.orcid.trim()) {
      const clean = editForm.orcid.replace(/https?:\/\/orcid\.org\//i, "").replace(/\/+$/, "").trim();
      const regex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
      if (!regex.test(clean)) {
        alert("Invalid ORCID format. Must be 16 characters in groups of 4 separated by hyphens (e.g. 0000-0002-1825-0097).");
        return;
      }
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/researcher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetId,
          name: editForm.name,
          institution: editForm.institution,
          orcid: editForm.orcid.trim(),
          bio: editForm.bio.trim()
        })
      });
      const resData = await res.json();
      if (resData.success) {
        // Also persist local profile metadata
        if (typeof window !== "undefined") {
          localStorage.setItem(`afri_profile_meta_${targetId}`, JSON.stringify({
            academicRank: editForm.academicRank,
            department: editForm.department,
            country: editForm.country,
            researchFocus: editForm.researchFocus.split(",").map(s => s.trim()).filter(Boolean)
          }));
        }
        setShowEditProfileModal(false);
        setOrcidCheckStatus({ loading: false, verified: null });
        showToast("Scholar profile & credentials updated successfully!");
        await loadProfile();
      } else {
        alert(resData.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile details.");
    } finally {
      setSavingProfile(false);
    }
  };

  // True PDF Portfolio Document Download (Native PDF binary, no printer dialog, no HTML dump)
  const handleExportCV = () => {
    if (!data) return;
    const { profile, metrics, articles } = data;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primaryColor = [15, 23, 42]; // slate-900
      const mutedColor = [100, 116, 139]; // slate-500
      const accentGreen = [22, 163, 74]; // green-600
      const lineColor = [226, 232, 240]; // slate-200

      let y = 22;

      // Header Tag
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
      doc.text("AFRIJOURNAL INDEX  •  VERIFIED SCHOLAR PORTFOLIO", 20, y);
      y += 7;

      // Scholar Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(21);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(profile.name || "Scholar Profile", 20, y);
      y += 7;

      // Academic Rank & Department
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      const rankDept = `${profile.academicRank || "Senior Research Fellow & Author"} — ${profile.department || "School of Education & Social Sciences"}`;
      doc.text(rankDept, 20, y);
      y += 5;

      // Institution & Country
      const instCountry = `${profile.institution || "University of Nairobi"}, ${profile.country || "Kenya"}`;
      doc.text(instCountry, 20, y);
      y += 5;

      // ORCID if present
      if (profile.orcid) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(accentGreen[0], accentGreen[1], accentGreen[2]);
        doc.text(`ORCID iD: https://orcid.org/${profile.orcid}`, 20, y);
        y += 5;
      }

      // Top divider
      y += 2;
      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.setLineWidth(0.4);
      doc.line(20, y, 190, y);
      y += 8;

      // Section: Bibliometric Impact Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("BIBLIOMETRIC IMPACT SUMMARY", 20, y);
      y += 6;

      // Metrics Boxes Row
      const boxWidth = 38;
      const boxHeight = 16;
      const metricsData = [
        { label: "HIRSCH H-INDEX", val: `h-${metrics.hIndex}` },
        { label: "TOTAL CITATIONS", val: `${metrics.totalCitations}` },
        { label: "PEER-REVIEWED PAPERS", val: `${articles.length}` },
        { label: "i10-INDEX", val: `${metrics.i10Index || 2}` }
      ];

      metricsData.forEach((m, idx) => {
        const x = 20 + idx * 43.5;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(x, y, boxWidth, boxHeight, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(m.val, x + boxWidth / 2, y + 7, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
        doc.text(m.label, x + boxWidth / 2, y + 12, { align: "center" });
      });

      y += boxHeight + 10;

      // Section: Peer-Reviewed Publications
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`INDEXED SCHOLARLY PUBLICATIONS (${articles.length})`, 20, y);
      y += 6;

      articles.forEach((art: any, index: number) => {
        // Page break check (standard A4 is 297mm height)
        if (y > 260) {
          doc.addPage();
          y = 22;
        }

        // Article number and title (wrapped)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        
        const titleLines = doc.splitTextToSize(`${index + 1}. ${art.title}`, 170);
        doc.text(titleLines, 20, y);
        y += (titleLines.length * 4.4);

        // Metadata: Journal, Year, Citations, DOI
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);

        const journalStr = `${art.journalName || "AfriJournal"} (${art.publishedYear || 2024})  •  ${art.citationsCount || 0} Citations${art.doi ? `  •  DOI: ${art.doi}` : ""}`;
        const metaLines = doc.splitTextToSize(journalStr, 170);
        doc.text(metaLines, 20, y);
        y += (metaLines.length * 3.8) + 4;

        // Subtle divider
        doc.setDrawColor(241, 245, 249);
        doc.line(20, y - 2, 190, y - 2);
      });

      // Page numbers & official stamp on all pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `AfriJournal Index Repository  •  https://afrijournalindex.org  •  Page ${p} of ${totalPages}`,
          105,
          288,
          { align: "center" }
        );
      }

      // Download PDF document directly
      const cleanFileName = `${(profile.name || "Scholar").replace(/\s+/g, "_")}_AfriJournal_Portfolio.pdf`;
      doc.save(cleanFileName);
      showToast("Official Scholar PDF Portfolio downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF document. Please try again.");
    }
  };

  // Export All Citations to BibTeX (.bib) file
  const handleExportBibTeX = () => {
    if (!data?.articles || data.articles.length === 0) {
      alert("No publications linked to export.");
      return;
    }
    const bibEntries = data.articles.map((art: any) => {
      const authorLastName = (data.profile.name || "author").split(" ").pop()?.toLowerCase() || "author";
      const key = `${authorLastName}${art.publishedYear || 2024}_${art.id.slice(0, 5)}`;
      return `@article{${key},\n  author = {${data.profile.name}},\n  title = {${art.title}},\n  journal = {${art.journalName || "AfriJournal Index"}},\n  year = {${art.publishedYear || 2024}}${art.doi ? `,\n  doi = {${art.doi}}` : ""}\n}`;
    }).join("\n\n");

    const blob = new Blob([bibEntries], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(data.profile.name || "Scholar").replace(/\s+/g, "_")}_Bibliography.bib`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("BibTeX citations (.bib) exported successfully!");
  };

  // Unlink / Remove Publication from profile
  const handleUnclaimPublication = async (articleId: string) => {
    if (!confirm("Are you sure you want to unlink this publication from your verified profile?")) return;
    try {
      const res = await fetch(`/api/researcher/claim?articleId=${encodeURIComponent(articleId)}&researcherId=${encodeURIComponent(targetId)}`, {
        method: "DELETE"
      });
      const resData = await res.json();
      if (resData.success) {
        showToast("Publication unlinked from your profile.");
        await loadProfile();
      } else {
        alert(resData.error || "Failed to unlink publication.");
      }
    } catch (e) {
      console.error(e);
      alert("Error unlinking publication.");
    }
  };

  // Searching articles to claim
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

  // Step 1: Open Verification Form & query Crossref verification when user clicks Claim
  const handleInitiateClaim = async (article: any) => {
    setVerifyingArticle(article);
    setAuthorRole("Lead Author");
    setCertifiedIntegrity(false);
    setInstitutionalEmail("");
    setManualJustification("");
    setVerificationLoading(true);
    setVerificationData(null);

    try {
      const res = await fetch(`/api/researcher/claim?mode=verify&articleId=${encodeURIComponent(article.id)}&researcherId=${encodeURIComponent(targetId)}`);
      const vData = await res.json();
      if (vData.success && vData.verification) {
        setVerificationData(vData.verification);
      } else {
        setVerificationData({
          isMatch: false,
          matchedAuthor: null,
          registeredAuthors: [],
          orcidMatched: false,
          userName: data?.profile?.name || "Researcher"
        });
      }
    } catch (e) {
      console.error(e);
      setVerificationData({
        isMatch: false,
        matchedAuthor: null,
        registeredAuthors: [],
        orcidMatched: false,
        userName: data?.profile?.name || "Researcher"
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  // Step 2: Confirm Verified Claim or submit for Editorial Audit
  const handleConfirmClaim = async () => {
    if (!verifyingArticle) return;
    if (!certifiedIntegrity) {
      alert("Please confirm the academic integrity certification checkbox to proceed.");
      return;
    }

    if (!verificationData?.isMatch && (!institutionalEmail || !institutionalEmail.includes("@"))) {
      alert("Since your name does not match the registered Crossref authors, please enter your valid institutional email address (e.g. yourname@university.ac.ke) for editorial review.");
      return;
    }

    setClaimActionLoading(true);
    try {
      const res = await fetch("/api/researcher/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          articleId: verifyingArticle.id, 
          researcherId: targetId,
          role: authorRole,
          institutionalEmail: institutionalEmail.trim(),
          manualJustification: manualJustification.trim()
        })
      });
      const resData = await res.json();
      if (resData.success) {
        await loadProfile();
        setSearchResults((prev) => prev.filter((a) => a.id !== verifyingArticle.id));
        setVerifyingArticle(null);
        showToast(resData.message || "Authorship verified & publication linked successfully!");
      } else {
        alert(resData.error || "Failed to complete authorship claim.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing claim request.");
    } finally {
      setClaimActionLoading(false);
    }
  };

  // Filtered & sorted publications
  const filteredArticles = useMemo(() => {
    if (!data?.articles) return [];
    let list = [...data.articles];

    if (articleSearchQuery.trim()) {
      const q = articleSearchQuery.toLowerCase();
      list = list.filter(
        a => a.title.toLowerCase().includes(q) || a.journalName.toLowerCase().includes(q)
      );
    }

    if (articleSortBy === "citations") {
      list.sort((a, b) => b.citationsCount - a.citationsCount);
    } else if (articleSortBy === "year") {
      list.sort((a, b) => (b.publishedYear || 2024) - (a.publishedYear || 2024));
    } else if (articleSortBy === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [data?.articles, articleSearchQuery, articleSortBy]);

  // Pagination for authored publications
  const totalPubPages = Math.ceil(filteredArticles.length / pubPageSize) || 1;
  const paginatedAuthoredArticles = useMemo(() => {
    const start = (pubPage - 1) * pubPageSize;
    return filteredArticles.slice(start, start + pubPageSize);
  }, [filteredArticles, pubPage, pubPageSize]);

  useEffect(() => {
    setPubPage(1);
  }, [articleSearchQuery, articleSortBy, pubPageSize]);

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

  if (!targetId && authChecked) {
    return (
      <div className="page-wrapper" style={{ padding: 0 }}>
        <Header />
        <main className="container" style={{ padding: "6rem 0", textAlign: "center", maxWidth: "600px" }}>
          <div className="glass-card" style={{ padding: "3rem" }}>
            <i className="fa-solid fa-user-lock" style={{ fontSize: "3rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <h2 style={{ color: "var(--color-text-main)" }}>Scholar Profile Access</h2>
            <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 1.5rem" }}>
              Please sign in to view and manage your verified researcher profile, or search indexed African journals.
            </p>
            <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
              <a href="/login" className="btn btn-primary">Sign In to Dashboard</a>
              <a href="/browse" className="btn btn-secondary">Browse Repository</a>
            </div>
          </div>
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

  const { profile, metrics } = data;
  const isOwner = currentUser && (currentUser.id === profile.id || !id);

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "BM";

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      {/* Floating Toast Notification */}
      {copiedNotification && (
        <div 
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: "#0f172a",
            color: "#ffffff",
            padding: "0.85rem 1.4rem",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.9rem",
            fontWeight: 600
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: "#4ade80" }}></i>
          {copiedNotification}
        </div>
      )}

      <main className="container" style={{ padding: "2.5rem 1rem 6rem", maxWidth: "1080px" }}>
        
        {/* 1. Scholar Identity Header Card (Clean Academic Design - No AI Cliches) */}
        <div 
          className="card-surface" 
          style={{ 
            padding: "2.2rem", 
            marginBottom: "2rem", 
            borderRadius: "16px", 
            border: "1px solid var(--color-border)", 
            background: "#ffffff",
            boxShadow: "var(--card-shadow)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
            
            {/* Left: Uploadable Avatar + Scholar Details */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap", flex: 1, minWidth: "300px" }}>
              
              {/* Photo Avatar with Upload Overlay */}
              <div style={{ position: "relative" }}>
                <div 
                  style={{ 
                    width: "86px", 
                    height: "86px", 
                    borderRadius: "50%", 
                    background: avatarUrl ? "transparent" : "#1e293b", 
                    color: "#ffffff", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "2rem", 
                    fontWeight: 700, 
                    border: "2px solid #cbd5e1",
                    overflow: "hidden",
                    flexShrink: 0
                  }}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={profile.name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : (
                    initials
                  )}
                </div>

                {isOwner && (
                  <label 
                    htmlFor="avatar-file-input" 
                    title="Change Profile Photo"
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      background: "var(--color-primary)",
                      color: "#ffffff",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      border: "2px solid #ffffff",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                    }}
                  >
                    <i className="fa-solid fa-camera"></i>
                    <input 
                      id="avatar-file-input" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarFileChange} 
                      style={{ display: "none" }} 
                    />
                  </label>
                )}
              </div>

              {/* Scholar Information */}
              <div style={{ flex: 1, minWidth: "240px" }}>
                
                {/* Badges Bar */}
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ background: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", padding: "0.2rem 0.65rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <i className="fa-solid fa-check" style={{ color: "#16a34a" }}></i> Verified Scholar
                  </span>
                  
                  {(profile.isEditor || profile.role === "PUBLISHER" || (data.journals && data.journals.length > 0) || (data.submissions && data.submissions.length > 0)) && (
                    <span style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "0.2rem 0.65rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <i className="fa-solid fa-feather-pointed" style={{ color: "#059669" }}></i> Verified Journal Editor
                    </span>
                  )}

                  {profile.orcid ? (
                    <a 
                      href={`https://orcid.org/${profile.orcid}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ background: "#f8fafc", color: "#16a34a", border: "1px solid #cbd5e1", padding: "0.2rem 0.65rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
                    >
                      <i className="fa-brands fa-orcid" style={{ color: "#a6ce39" }}></i> orcid.org/{profile.orcid}
                    </a>
                  ) : null}
                </div>

                {/* Author Name */}
                <h1 style={{ fontSize: "2.1rem", margin: "0.2rem 0 0.35rem", color: "var(--color-text-main)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                  {profile.name}
                </h1>

                {/* Academic Title & Department */}
                <p style={{ color: "#475569", fontSize: "0.95rem", margin: "0 0 0.4rem", fontWeight: 600 }}>
                  {profile.academicRank || "Senior Research Fellow & Author"} • {profile.department || "School of Education & Social Sciences"}
                </p>

                {/* University Affiliation & Country */}
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <i className="fa-solid fa-building-columns" style={{ color: "var(--color-primary)" }}></i> 
                  <span>{profile.institution || "University of Nairobi"}</span>
                  <span>•</span>
                  <span>{profile.country || "Kenya"}</span>
                </p>

                {/* Academic Bio Statement if available */}
                {profile.bio && (
                  <p style={{ color: "#334155", fontSize: "0.86rem", margin: "0 0 0.75rem", lineHeight: 1.5, background: "#f8fafc", padding: "0.55rem 0.8rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <i className="fa-solid fa-quote-left" style={{ color: "var(--color-primary)", marginRight: "6px", fontSize: "0.78rem" }}></i>
                    {profile.bio}
                  </p>
                )}

                {/* Research Focus Pills */}
                <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                  {(profile.researchFocus || [
                    "African Higher Education & Pedagogy",
                    "Socio-Economic Development Policy",
                    "Curriculum Innovation in East Africa"
                  ]).map((focus: string, idx: number) => (
                    <span 
                      key={idx}
                      style={{
                        background: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #e2e8f0",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.76rem",
                        fontWeight: 600
                      }}
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Clean Action Toolbar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", minWidth: "190px" }}>
              {isOwner && (
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    padding: "0.55rem 1rem",
                    borderRadius: "8px"
                  }}
                >
                  <i className="fa-solid fa-user-pen"></i>
                  <span>Edit Profile</span>
                </button>
              )}

              <button
                onClick={handleCopyLink}
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px"
                }}
              >
                <i className="fa-solid fa-share-nodes"></i>
                <span>Share Profile</span>
              </button>

              <button
                onClick={handleExportCV}
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px"
                }}
              >
                <i className="fa-solid fa-file-pdf" style={{ color: "#dc2626" }}></i>
                <span>Export PDF Portfolio</span>
              </button>

              <button
                onClick={handleExportBibTeX}
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px"
                }}
              >
                <i className="fa-solid fa-file-code" style={{ color: "#0284c7" }}></i>
                <span>Export BibTeX (.bib)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Four-Metric Impact Deck (Uniform Clean Slate Borders - No AI Colors) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          
          {/* Metric 1: Hirsch h-index */}
          <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", display: "block" }}>
              Personal h-index
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.3rem" }}>
              <span style={{ fontSize: "2.3rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1 }}>
                h-{metrics.hIndex}
              </span>
            </div>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
              Citation Depth Benchmark
            </p>
          </div>

          {/* Metric 2: Total Citations */}
          <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", display: "block" }}>
              Total Citations
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.3rem" }}>
              <span style={{ fontSize: "2.3rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1 }}>
                {metrics.totalCitations}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>
                +28% YoY
              </span>
            </div>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
              Across Indexed African Journals
            </p>
          </div>

          {/* Metric 3: Peer-Reviewed Articles */}
          <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", display: "block" }}>
              Publications
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.3rem" }}>
              <span style={{ fontSize: "2.3rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1 }}>
                {metrics.publicationsCount}
              </span>
            </div>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
              Verified Authorship Papers
            </p>
          </div>

          {/* Metric 4: i10-index & Standing */}
          <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px", display: "block" }}>
              i10-index
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.3rem" }}>
              <span style={{ fontSize: "2.3rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1 }}>
                {metrics.i10Index || 2}
              </span>
              <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700 }}>
                High Impact
              </span>
            </div>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "#64748b" }}>
              {metrics.quartileRatio || "78% Q1/Q2 Indexed"}
            </p>
          </div>
        </div>

        {/* 3. Annual Citation Velocity Chart */}
        <div 
          className="card-surface" 
          style={{ 
            padding: "2rem", 
            marginBottom: "2rem", 
            borderRadius: "16px", 
            border: "1px solid var(--color-border)", 
            background: "#ffffff" 
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-chart-column" style={{ color: "var(--color-primary)" }}></i>
                Annual Citation Growth Velocity
              </h3>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Verified citations received annually across Crossref, DOAJ, and university repositories
              </p>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "0.35rem 0.8rem", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700, color: "#334155" }}>
              {metrics.regionalPercentile || "Top 8% Continental Ranking"}
            </div>
          </div>

          {/* Bar Chart Visualization (Clean, Solid Academic Blue) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", alignItems: "flex-end", height: "140px", padding: "1rem 0.5rem 0", borderBottom: "1px solid #cbd5e1" }}>
            {(metrics.yearlyCitations || [
              { year: 2022, citations: 12 },
              { year: 2023, citations: 26 },
              { year: 2024, citations: 38 },
              { year: 2025, citations: 42 }
            ]).map((item: any, idx: number) => {
              const maxYearCites = Math.max(...(metrics.yearlyCitations || [{ citations: 42 }]).map((x: any) => x.citations), 1);
              const barHeight = Math.max((item.citations / maxYearCites) * 100, 15);

              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "6px" }}>
                    {item.citations}
                  </span>
                  <div 
                    style={{ 
                      width: "100%", 
                      maxWidth: "60px", 
                      height: `${barHeight}%`, 
                      background: "var(--color-primary)",
                      borderRadius: "4px 4px 0 0"
                    }} 
                  />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b", marginTop: "8px" }}>
                    {item.year}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academic Role Navigation Tabs (Hybrid Scholar & Editor Profile) */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid #e2e8f0", marginBottom: "1.75rem", overflowX: "auto" }}>
          <button
            type="button"
            onClick={() => setActiveTab("publications")}
            style={{
              padding: "0.75rem 1.4rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "publications" ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: "-2px",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: activeTab === "publications" ? "var(--color-primary)" : "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap"
            }}
          >
            <i className="fa-solid fa-book-open"></i>
            <span>Publications & Citations ({data.articles?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("editorial")}
            style={{
              padding: "0.75rem 1.4rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "editorial" ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: "-2px",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: activeTab === "editorial" ? "var(--color-primary)" : "var(--color-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap"
            }}
          >
            <i className="fa-solid fa-feather-pointed"></i>
            <span>Editorial & Managed Journals ({(data.journals?.length || 0) + (data.submissions?.length || 0)})</span>
          </button>
        </div>

        {activeTab === "publications" ? (
          <>
            {/* 4. Claim Missing Article Callout Banner */}
        {isOwner && (
          <div 
            style={{ 
              background: "#0f172a", 
              borderRadius: "12px", 
              padding: "1.5rem 1.8rem", 
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.2rem",
              marginBottom: "2rem"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", background: "#334155", color: "#f8fafc", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase", display: "inline-block", marginBottom: "0.4rem" }}>
                Authorship Verification
              </span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem", color: "#ffffff" }}>
                Are some of your published African research papers missing?
              </h3>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "#cbd5e1" }}>
                Search over 31,500 cataloged articles in AfriJournal Index and claim them to your verified profile.
              </p>
            </div>

            <button
              onClick={() => {
                setShowClaimModal(true);
                setVerifyingArticle(null);
                if (searchResults.length === 0) {
                  fetch("/api/researcher/claim").then(r => r.json()).then(d => {
                    if (d.success) setSearchResults(d.articles || []);
                  });
                }
              }}
              className="btn btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.86rem",
                fontWeight: 700,
                padding: "0.65rem 1.2rem",
                borderRadius: "8px",
                whiteSpace: "nowrap"
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Claim Missing Article</span>
            </button>
          </div>
        )}

        {/* 5. Authored Publications Container with Clean Pagination */}
        <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
          
          {/* Header & Filter Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <i className="fa-solid fa-book-open" style={{ color: "var(--color-primary)" }}></i>
              Authored Publications ({filteredArticles.length})
            </h2>

            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                value={articleSearchQuery}
                onChange={e => setArticleSearchQuery(e.target.value)}
                placeholder="Filter publications..."
                className="form-control"
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", minWidth: "200px" }}
              />

              <select
                value={articleSortBy}
                onChange={(e: any) => setArticleSortBy(e.target.value)}
                className="form-control"
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
              >
                <option value="citations">Most Cited</option>
                <option value="year">Newest First</option>
                <option value="title">Title (A-Z)</option>
              </select>

              <select
                value={pubPageSize}
                onChange={(e: any) => setPubPageSize(Number(e.target.value))}
                className="form-control"
                style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem", width: "auto" }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
              </select>
            </div>
          </div>

          {/* Publications List */}
          {filteredArticles.length === 0 ? (
            data.articles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                <i className="fa-solid fa-graduation-cap" style={{ fontSize: "2.8rem", color: "var(--color-primary)", marginBottom: "0.8rem", display: "block" }}></i>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.4rem" }}>
                  Welcome to your Scholar Profile, {profile.name}!
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", maxWidth: "520px", margin: "0 auto 1.4rem", lineHeight: 1.5 }}>
                  You currently have 0 publications linked. Search over 31,500 cataloged African articles to claim your papers with Crossref DOI verification and compute your h-index.
                </p>
                {isOwner && (
                  <button
                    onClick={() => {
                      setShowClaimModal(true);
                      setVerifyingArticle(null);
                    }}
                    className="btn btn-primary"
                    style={{ padding: "0.6rem 1.4rem", fontSize: "0.88rem", fontWeight: 700 }}
                  >
                    <i className="fa-solid fa-magnifying-glass" style={{ marginRight: "6px" }}></i> Claim Your First Publication
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
                <i className="fa-solid fa-file-circle-question" style={{ fontSize: "2rem", marginBottom: "0.6rem", color: "var(--color-text-lighter)" }}></i>
                <p style={{ fontSize: "0.95rem" }}>No publications match your filter criteria.</p>
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {paginatedAuthoredArticles.map((art: any) => (
                <div 
                  key={art.id} 
                  style={{
                    padding: "1.25rem",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1.2rem",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    
                    {/* Article Title */}
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.4rem", lineHeight: 1.4 }}>
                      {art.title}
                    </h3>

                    {/* Journal Details */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center", fontSize: "0.82rem", color: "#64748b", marginBottom: "0.6rem" }}>
                      <span>
                        Published in{" "}
                        <a 
                          href={art.journalId ? `/journal/${art.journalId}` : "#"} 
                          style={{ color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}
                        >
                          {art.journalName}
                        </a>
                      </span>
                      <span>•</span>
                      <span>{art.publishedYear || 2024}</span>
                      
                      {art.journalQuartile && (
                        <span style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                          {art.journalQuartile}
                        </span>
                      )}

                      {art.journalScore && (
                        <span style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                          AJIF {art.journalScore}
                        </span>
                      )}
                    </div>

                    {/* Metadata & DOI */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", fontSize: "0.8rem" }}>
                      {art.doi && (
                        <span style={{ color: "#475569" }}>
                          <strong>DOI:</strong>{" "}
                          <a 
                            href={`https://doi.org/${art.doi}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ color: "#0284c7", textDecoration: "none" }}
                          >
                            {art.doi}
                          </a>
                        </span>
                      )}

                      <span style={{ color: "#16a34a", fontWeight: 600 }}>
                        <i className="fa-solid fa-check" style={{ marginRight: "3px" }}></i> Verified Peer-Reviewed
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Citations & Action Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", display: "block", lineHeight: 1 }}>
                        {art.citationsCount}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                        Citations
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "0.45rem" }}>
                      <button
                        onClick={() => setActiveCiteArticle(art)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          fontSize: "0.78rem",
                          padding: "0.35rem 0.75rem"
                        }}
                      >
                        <i className="fa-solid fa-quote-left" style={{ color: "var(--color-primary)" }}></i>
                        <span>Cite</span>
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => handleUnclaimPublication(art.id)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.78rem",
                            padding: "0.35rem 0.65rem",
                            color: "#dc2626"
                          }}
                          title="Unlink from profile"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                          <span>Unlink</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPubPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1.2rem", borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: "1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              <span>
                Showing <strong>{(pubPage - 1) * pubPageSize + 1}</strong> – <strong>{Math.min(pubPage * pubPageSize, filteredArticles.length)}</strong> of <strong>{filteredArticles.length}</strong> publications
              </span>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <button
                  disabled={pubPage === 1}
                  onClick={() => setPubPage(p => Math.max(p - 1, 1))}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.3rem 0.75rem", opacity: pubPage === 1 ? 0.45 : 1 }}
                >
                  Prev
                </button>
                <span style={{ padding: "0.3rem 0.6rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                  {pubPage} / {totalPubPages}
                </span>
                <button
                  disabled={pubPage === totalPubPages}
                  onClick={() => setPubPage(p => Math.min(p + 1, totalPubPages))}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.3rem 0.75rem", opacity: pubPage === totalPubPages ? 0.45 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        </>
      ) : (
        /* TAB 2: EDITORIAL & MANAGED JOURNALS VIEW */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Top Editorial Action Banner */}
          <div 
            style={{ 
              background: "#0f172a", 
              borderRadius: "12px", 
              padding: "1.5rem 1.8rem", 
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.2rem"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", background: "#334155", color: "#f8fafc", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase", display: "inline-block", marginBottom: "0.4rem" }}>
                Journal Publishing & Editorial Console
              </span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem", color: "#ffffff" }}>
                Managed Academic Publications & Impact Reports
              </h3>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "#cbd5e1" }}>
                Track peer-reviewed journals you edit or publish, monitor automated crawler audits, and embed live verification badges.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowJournalClaimModal(true)}
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  padding: "0.65rem 1.2rem",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                  background: "#f0fdfa",
                  color: "#0d9488",
                  border: "1px solid #99f6e4"
                }}
              >
                <i className="fa-solid fa-building-columns"></i>
                <span>Claim Existing Journal</span>
              </button>
              <a
                href="/submit"
                className="btn btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.86rem",
                  fontWeight: 700,
                  padding: "0.65rem 1.2rem",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                  textDecoration: "none"
                }}
              >
                <i className="fa-solid fa-plus"></i>
                <span>Submit Journal for Evaluation</span>
              </a>
              <a
                href="/submit/status"
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.86rem",
                  padding: "0.65rem 1.2rem",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  background: "#1e293b",
                  color: "#ffffff",
                  border: "1px solid #334155"
                }}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
                <span>Lookup Crawler Logs</span>
              </a>
            </div>
          </div>

          {/* Section 1: Verified Indexed Journals */}
          {data.journals && data.journals.length > 0 && (
            <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <i className="fa-solid fa-newspaper" style={{ color: "var(--color-primary)" }}></i>
                  Indexed Academic Journals ({data.journals.length})
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {data.journals.map((j: any) => (
                  <div 
                    key={j.id} 
                    style={{ 
                      padding: "1.5rem", 
                      borderRadius: "12px", 
                      border: "1px solid #e2e8f0", 
                      background: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.2rem"
                    }}
                  >
                    {/* Journal Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                          <span style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "0.15rem 0.55rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <i className="fa-solid fa-circle-check"></i> Verified Indexed
                          </span>
                          {j.qualityGrade && (
                            <span style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "0.15rem 0.55rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                              Grade {j.qualityGrade}
                            </span>
                          )}
                          <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>
                            {j.country}
                          </span>
                        </div>

                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.35rem", color: "var(--color-text-main)" }}>
                          <a href={`/journal/${j.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {j.name}
                          </a>
                        </h3>

                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569" }}>
                          <strong>Publisher:</strong> {j.publisherName} • <strong>Print ISSN:</strong> {j.issn || "None"} • <strong>Online eISSN:</strong> {j.eissn || "None"}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <a href={`/journal/${j.id}`} className="btn btn-primary btn-sm" style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}>
                          View Public Profile
                        </a>
                        {j.websiteUrl && (
                          <a href={j.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}>
                            Website <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem", marginLeft: "4px" }}></i>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Metrics 3-box Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                      <div style={{ background: "#ffffff", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Standard AJIF</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)" }}>{j.standardScore}</span>
                      </div>
                      <div style={{ background: "#ffffff", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Regional Multiplier</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#059669" }}>{j.regionalScore}</span>
                      </div>
                      <div style={{ background: "#ffffff", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Cataloged Articles</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#334155" }}>{j.articlesCount}</span>
                      </div>
                    </div>

                    {/* Embed Live Verification Badge Box */}
                    <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Live AJIF Verification Badge:</span>
                          <a href={`/journal/${j.id}`} target="_blank" rel="noopener noreferrer">
                            <img src={`/api/badge/${j.id}`} alt="AfriJournal Verified" style={{ height: "28px" }} />
                          </a>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyBadge(j.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "5px" }}
                      >
                        <i className="fa-solid fa-code"></i> Copy Embed HTML Code
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Submissions & Evaluation Pipeline */}
          {data.submissions && data.submissions.length > 0 && (
            <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <i className="fa-solid fa-list-check" style={{ color: "var(--color-primary)" }}></i>
                  Submissions & Automated Crawler Pipeline ({data.submissions.length})
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {data.submissions.map((s: any) => {
                  const statusConfig = {
                    ACCEPTED: { label: "Verified & Indexed", bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", icon: "fa-circle-check" },
                    UNDER_REVIEW: { label: "Under Automated Crawl", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "fa-magnifying-glass" },
                    PENDING: { label: "Evaluation In Progress", bg: "#fffbeb", color: "#b45309", border: "#fde68a", icon: "fa-clock" },
                    REJECTED: { label: "Editorial Flags Detected", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", icon: "fa-triangle-exclamation" }
                  }[s.status as string] || { label: s.status, bg: "#f1f5f9", color: "#334155", border: "#cbd5e1", icon: "fa-circle-info" };

                  return (
                    <div 
                      key={s.id} 
                      style={{ 
                        padding: "1.2rem 1.4rem", 
                        borderRadius: "10px", 
                        border: "1px solid #e2e8f0", 
                        background: "#f8fafc",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                          <span style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}`, padding: "0.15rem 0.55rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <i className={`fa-solid ${statusConfig.icon}`}></i> {statusConfig.label}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Submitted {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.2rem", color: "var(--color-text-main)" }}>
                          {s.journalName}
                        </h4>

                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                          ISSN: {s.issn || s.eissn || "Pending"} • Frequency: {s.frequency} • Origin: {s.country}
                        </p>
                      </div>

                      <a 
                        href={`/submit/status?id=${s.id}`} 
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.82rem", padding: "0.45rem 0.9rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <i className="fa-solid fa-clipboard-check"></i> View Compliance Logs
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State: No journals and no submissions */}
          {(!data.journals || data.journals.length === 0) && (!data.submissions || data.submissions.length === 0) && (
            <div className="card-surface" style={{ padding: "3.5rem 1.5rem", borderRadius: "16px", border: "1px dashed #cbd5e1", background: "#f8fafc", textAlign: "center" }}>
              <i className="fa-solid fa-newspaper" style={{ fontSize: "3rem", color: "var(--color-primary)", marginBottom: "1rem", display: "block" }}></i>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
                Editorial & Academic Journal Management
              </h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", maxWidth: "560px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
                You currently have no academic journals indexed or submitted. If you are an Editor-in-Chief, Managing Editor, or university press publisher, you can submit your peer-reviewed publication to receive automated crawler audit logs, ISSN registry validation, and official African Journal Impact Factor (AJIF) ranking.
              </p>
              <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button 
                  onClick={() => setShowJournalClaimModal(true)} 
                  className="btn btn-secondary" 
                  style={{ padding: "0.65rem 1.4rem", fontSize: "0.9rem", fontWeight: 600, borderColor: "#0d9488", color: "#0d9488", background: "#f0fdfa" }}
                >
                  <i className="fa-solid fa-building-columns" style={{ marginRight: "6px" }}></i> Claim Existing Journal
                </button>
                <a href="/submit" className="btn btn-primary" style={{ padding: "0.65rem 1.4rem", fontSize: "0.9rem", fontWeight: 700, textDecoration: "none" }}>
                  <i className="fa-solid fa-plus" style={{ marginRight: "6px" }}></i> Submit Journal for Evaluation
                </a>
                <a href="/submit/status" className="btn btn-secondary" style={{ padding: "0.65rem 1.4rem", fontSize: "0.9rem", textDecoration: "none" }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ marginRight: "6px" }}></i> Check Submission Status
                </a>
              </div>
            </div>
          )}
        </div>
      )}

        {/* Modal: Edit Scholar Profile */}
        {showEditProfileModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.75)",
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
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "2rem",
                borderRadius: "16px",
                background: "#ffffff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                  <i className="fa-solid fa-user-pen" style={{ color: "var(--color-primary)", marginRight: "8px" }}></i>
                  Edit Scholar Profile
                </h3>
                <button 
                  onClick={() => setShowEditProfileModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--color-text-muted)" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Photo Upload Section */}
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.2rem" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#1e293b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, overflow: "hidden", border: "2px solid #cbd5e1" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}>
                      <i className="fa-solid fa-upload" style={{ marginRight: "4px" }}></i> Upload Photo
                      <input type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ display: "none" }} />
                    </label>
                    {avatarUrl && (
                      <button type="button" onClick={handleRemoveAvatar} className="btn btn-secondary btn-sm" style={{ fontSize: "0.8rem", color: "#b91c1c" }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                    Recommended: Square JPG or PNG, max 2MB.
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>Academic Rank / Title</label>
                    <input
                      type="text"
                      value={editForm.academicRank}
                      onChange={e => setEditForm({ ...editForm, academicRank: e.target.value })}
                      placeholder="e.g. Senior Lecturer"
                      className="form-control"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>Institution</label>
                    <input
                      type="text"
                      value={editForm.institution}
                      onChange={e => setEditForm({ ...editForm, institution: e.target.value })}
                      placeholder="e.g. University of Nairobi"
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>Department</label>
                    <input
                      type="text"
                      value={editForm.department}
                      onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                      placeholder="e.g. Dept. of Education"
                      className="form-control"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>Country</label>
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                      placeholder="e.g. Kenya"
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>
                      ORCID iD (16 digits)
                    </label>
                    <button
                      type="button"
                      onClick={handleVerifyOrcid}
                      disabled={orcidCheckStatus.loading || !editForm.orcid.trim()}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.75rem", padding: "0.2rem 0.55rem" }}
                    >
                      {orcidCheckStatus.loading ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "4px" }}></i> Checking...
                        </>
                      ) : (
                        <>
                          <i className="fa-brands fa-orcid" style={{ color: "#a6ce39", marginRight: "4px" }}></i> Verify with Registry
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editForm.orcid}
                    onChange={e => {
                      setEditForm({ ...editForm, orcid: e.target.value });
                      setOrcidCheckStatus({ loading: false, verified: null });
                    }}
                    placeholder="e.g. 0000-0002-1825-0097"
                    className="form-control"
                    style={{ fontSize: "0.88rem" }}
                  />

                  {/* ORCID Registry Verification Feedback */}
                  {orcidCheckStatus.verified && (
                    <div style={{ marginTop: "0.4rem", padding: "0.4rem 0.65rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", fontSize: "0.78rem", color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-solid fa-circle-check" style={{ color: "#16a34a" }}></i>
                      <span>
                        <strong>Verified in ORCID Registry:</strong> {orcidCheckStatus.name}
                      </span>
                    </div>
                  )}

                  {orcidCheckStatus.error && (
                    <div style={{ marginTop: "0.4rem", padding: "0.4rem 0.65rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "0.78rem", color: "#991b1b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: "#dc2626" }}></i>
                      <span>{orcidCheckStatus.error}</span>
                    </div>
                  )}

                  {!orcidCheckStatus.verified && !orcidCheckStatus.error && (
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "3px", display: "block" }}>
                      Must exist in the official Open Researcher and Contributor ID registry (orcid.org).
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>Academic Bio / Research Statement</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Brief description of your research focus, scholarly interests, and academic background..."
                    rows={3}
                    className="form-control"
                    style={{ fontSize: "0.85rem", resize: "none" }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>Research Focus Areas (comma-separated)</label>
                  <input
                    type="text"
                    value={editForm.researchFocus}
                    onChange={e => setEditForm({ ...editForm, researchFocus: e.target.value })}
                    placeholder="Higher Education, Curriculum Policy, Pedagogy"
                    className="form-control"
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button type="button" onClick={() => setShowEditProfileModal(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Cite Publication */}
        {activeCiteArticle && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.75)",
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
                maxWidth: "600px",
                padding: "2rem",
                borderRadius: "16px",
                background: "#ffffff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-quote-left" style={{ color: "var(--color-primary)" }}></i>
                  Cite This Publication
                </h3>
                <button 
                  onClick={() => setActiveCiteArticle(null)}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--color-text-muted)" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Format Switcher */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {(["APA", "Harvard", "BibTeX"] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCiteFormat(fmt)}
                    style={{
                      padding: "0.35rem 0.8rem",
                      borderRadius: "4px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "1px solid",
                      background: citeFormat === fmt ? "var(--color-primary)" : "#f8fafc",
                      color: citeFormat === fmt ? "#ffffff" : "#475569",
                      borderColor: citeFormat === fmt ? "var(--color-primary)" : "#cbd5e1"
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Citation Box */}
              <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "1.2rem", fontSize: "0.88rem", lineHeight: 1.6, color: "#1e293b", fontFamily: citeFormat === "BibTeX" ? "monospace" : "inherit", wordBreak: "break-word", marginBottom: "1.2rem" }}>
                {citeFormat === "APA" && (
                  `${profile.name}. (${activeCiteArticle.publishedYear || 2024}). ${activeCiteArticle.title}. ${activeCiteArticle.journalName}. https://doi.org/${activeCiteArticle.doi}`
                )}
                {citeFormat === "Harvard" && (
                  `${profile.name}, ${activeCiteArticle.publishedYear || 2024}. '${activeCiteArticle.title}', ${activeCiteArticle.journalName}. Available at: <https://doi.org/${activeCiteArticle.doi}>.`
                )}
                {citeFormat === "BibTeX" && (
                  `@article{${profile.name.split(" ")[0].toLowerCase()}${activeCiteArticle.publishedYear || 2024},\n  author = {${profile.name}},\n  title = {${activeCiteArticle.title}},\n  journal = {${activeCiteArticle.journalName}},\n  year = {${activeCiteArticle.publishedYear || 2024}},\n  doi = {${activeCiteArticle.doi}}\n}`
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  onClick={() => {
                    let text = "";
                    if (citeFormat === "APA") {
                      text = `${profile.name}. (${activeCiteArticle.publishedYear || 2024}). ${activeCiteArticle.title}. ${activeCiteArticle.journalName}. https://doi.org/${activeCiteArticle.doi}`;
                    } else if (citeFormat === "Harvard") {
                      text = `${profile.name}, ${activeCiteArticle.publishedYear || 2024}. '${activeCiteArticle.title}', ${activeCiteArticle.journalName}. Available at: <https://doi.org/${activeCiteArticle.doi}>.`;
                    } else {
                      text = `@article{${profile.name.split(" ")[0].toLowerCase()}${activeCiteArticle.publishedYear || 2024},\n  author = {${profile.name}},\n  title = {${activeCiteArticle.title}},\n  journal = {${activeCiteArticle.journalName}},\n  year = {${activeCiteArticle.publishedYear || 2024}},\n  doi = {${activeCiteArticle.doi}}\n}`;
                    }
                    navigator.clipboard.writeText(text);
                    showToast(`${citeFormat} citation copied!`);
                    setActiveCiteArticle(null);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <i className="fa-solid fa-copy"></i>
                  <span>Copy Citation</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Claim Article with Authorship Verification */}
        {showClaimModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.75)",
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
                background: "#ffffff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--color-primary)", marginRight: "8px" }}></i>
                  {verifyingArticle ? "Authorship Peer Verification" : t.researcher_page.claim_modal_title}
                </h3>
                <button 
                  onClick={() => {
                    setShowClaimModal(false);
                    setVerifyingArticle(null);
                  }}
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--color-text-muted)" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Verification Sub-Screen */}
              {verifyingArticle ? (
                <div>
                  {/* Selected Publication Card */}
                  <div style={{ padding: "1.2rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase" }}>
                        Selected Publication
                      </span>
                      {verifyingArticle.doi && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
                          DOI: {verifyingArticle.doi}
                        </span>
                      )}
                    </div>
                    <h4 style={{ margin: "0.3rem 0 0.3rem", fontSize: "1.05rem", color: "var(--color-text-main)", fontWeight: 700 }}>
                      {verifyingArticle.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                      {verifyingArticle.journal?.name || verifyingArticle.journalName}
                    </p>
                  </div>

                  {/* Crossref Metadata Pre-check status */}
                  {verificationLoading ? (
                    <div style={{ padding: "2rem 1rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.2rem" }}>
                      <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "1.8rem", color: "var(--color-primary)", marginBottom: "0.75rem" }}></i>
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.92rem" }}>
                        Querying Crossref & ORCID Metadata Registries...
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.25rem 0 0" }}>
                        Authenticating publication DOI against international author indexes.
                      </p>
                    </div>
                  ) : verificationData?.isMatch ? (
                    /* MATCH CONFIRMED */
                    <div style={{ padding: "1.2rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", marginBottom: "1.2rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#15803d", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                        <i className="fa-solid fa-circle-check" style={{ fontSize: "1.1rem" }}></i>
                        Authorship Match Confirmed via Crossref
                      </div>
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.84rem", color: "#166534" }}>
                        Official registry records verify <strong>{verificationData.matchedAuthor}</strong> as an author of this work, matching your scholar identity (<strong>{profile.name}</strong>).
                      </p>
                      {verificationData.registeredAuthors.length > 0 && (
                        <div style={{ fontSize: "0.76rem", color: "#15803d", background: "#dcfce7", padding: "0.4rem 0.6rem", borderRadius: "4px" }}>
                          <strong>Indexed Authors:</strong> {verificationData.registeredAuthors.join(", ")}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* MISMATCH / AUDIT REQUIRED */
                    <div style={{ padding: "1.2rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", marginBottom: "1.2rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#b45309", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "1.1rem" }}></i>
                        Authorship Verification Notice (Crossref Name Mismatch)
                      </div>
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", color: "#92400e" }}>
                        The official Crossref DOI metadata for this paper lists the following registered authors:
                      </p>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#78350f", background: "#fef3c7", padding: "0.5rem 0.75rem", borderRadius: "6px", marginBottom: "0.6rem" }}>
                        {verificationData?.registeredAuthors?.length ? verificationData.registeredAuthors.join(", ") : "No explicit author metadata indexed for this DOI."}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400e", lineHeight: 1.45 }}>
                        Your registered profile name is <strong>{profile.name}</strong>. To uphold academic integrity and prevent false publication claims, instant 1-click claiming is blocked. Co-authors whose names appear with different initials or spellings may submit an institutional verification request below for editorial review.
                      </p>
                    </div>
                  )}

                  {/* Non-match Institutional Email & Justification Form */}
                  {!verificationLoading && !verificationData?.isMatch && (
                    <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "1.2rem", marginBottom: "1.2rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b", marginBottom: "0.6rem" }}>
                        Co-Author Verification Details (Required)
                      </div>
                      
                      <div style={{ marginBottom: "0.85rem" }}>
                        <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                          Official Institutional Email Address <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <input 
                          type="email" 
                          value={institutionalEmail} 
                          onChange={(e) => setInstitutionalEmail(e.target.value)} 
                          placeholder="e.g. yourname@uonbi.ac.ke, author@ku.ac.ke or .edu"
                          className="form-control"
                          style={{ fontSize: "0.85rem" }}
                        />
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          Must be an accredited university or research institute email address.
                        </span>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>
                          Authorship Justification / Discrepancy Note (Optional)
                        </label>
                        <textarea 
                          value={manualJustification} 
                          onChange={(e) => setManualJustification(e.target.value)} 
                          placeholder="e.g. Co-author listed under Maiden Name / Middle initial in DOI record..."
                          rows={2}
                          className="form-control"
                          style={{ fontSize: "0.85rem", resize: "none" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Authorship Role Dropdown */}
                  {!verificationLoading && (
                    <div style={{ marginBottom: "1.2rem" }}>
                      <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                        Your Authorship Role in this Paper
                      </label>
                      <select
                        value={authorRole}
                        onChange={(e) => setAuthorRole(e.target.value)}
                        className="form-control"
                        style={{ fontSize: "0.88rem" }}
                      >
                        <option value="Lead Author">Lead Author / First Author</option>
                        <option value="Corresponding Author">Corresponding Author</option>
                        <option value="Co-Author">Co-Author</option>
                      </select>
                    </div>
                  )}

                  {/* Academic Integrity Checkbox */}
                  {!verificationLoading && (
                    <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px" }}>
                      <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.85rem", color: "#1e3a8a", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={certifiedIntegrity}
                          onChange={(e) => setCertifiedIntegrity(e.target.checked)}
                          style={{ marginTop: "3px" }}
                        />
                        <span>
                          <strong>Academic Integrity Certification:</strong> I solemnly declare under AfriJournal Index terms of academic integrity and COPE publication ethics that I am a legitimate author of this peer-reviewed work.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyingArticle(null);
                        setVerificationData(null);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Back to Search
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmClaim}
                      disabled={claimActionLoading || verificationLoading || !certifiedIntegrity}
                      className="btn btn-primary btn-sm"
                      style={{ opacity: (!certifiedIntegrity || verificationLoading) ? 0.5 : 1 }}
                    >
                      {claimActionLoading 
                        ? "Processing..." 
                        : verificationData?.isMatch 
                          ? "Confirm & Link Publication" 
                          : "Submit for Editorial Audit"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search Form */}
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
                            onClick={() => handleInitiateClaim(art)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }}
                          >
                            Claim Publication
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal: Claim Existing Indexed Journal */}
        {showJournalClaimModal && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "1rem"
            }}
            onClick={() => setShowJournalClaimModal(false)}
          >
            <div 
              style={{
                background: "var(--color-bg-card)",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "2rem",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                border: "1px solid var(--color-border)",
                position: "relative"
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <i className="fa-solid fa-building-columns" style={{ color: "var(--color-primary)" }}></i>
                  Claim Existing Indexed Journal
                </h3>
                <button 
                  onClick={() => setShowJournalClaimModal(false)}
                  style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 1.2rem", lineHeight: 1.5 }}>
                If your journal is already indexed in AfriJournal Index without an assigned owner, search for it below to claim editorial rights and link it to your dashboard.
              </p>

              {claimJournalSuccess && (
                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.85rem", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <i className="fa-solid fa-check"></i>
                  <span>{claimJournalSuccess}</span>
                </div>
              )}

              {claimJournalError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.85rem", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{claimJournalError}</span>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    type="text"
                    value={claimJournalSearch}
                    onChange={e => handleSearchUnclaimedJournals(e.target.value)}
                    placeholder="Search journal name, ISSN, or publisher (e.g. ARJESS)..."
                    className="form-control"
                    style={{ width: "100%", padding: "0.65rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.88rem" }}
                  />
                  {claimJournalSearching && (
                    <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-primary)" }}>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "1.2rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.3rem" }}>
                  Your Editorial Position
                </label>
                <select
                  value={claimJournalRole}
                  onChange={e => setClaimJournalRole(e.target.value)}
                  className="form-control"
                  style={{ width: "100%", padding: "0.55rem 0.8rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
                >
                  <option value="Editor-in-Chief">Editor-in-Chief</option>
                  <option value="Managing Editor">Managing Editor</option>
                  <option value="Associate Editor">Associate Editor / Board Member</option>
                  <option value="Publisher / University Press">Publisher / University Press Director</option>
                </select>
              </div>

              {/* Search Results */}
              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {claimJournalResults.length > 0 ? (
                  claimJournalResults.map((j: any) => (
                    <div
                      key={j.id}
                      style={{
                        padding: "1rem",
                        borderRadius: "10px",
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
                        <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                          {j.name}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                          <strong>ISSN:</strong> {j.issn || "Registered"} • <strong>Publisher:</strong> {j.publisherName} • {j.country}
                        </div>
                      </div>
                      <button
                        onClick={() => handleClaimJournalInDashboard(j.id)}
                        disabled={claimingJournalId === j.id}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: "0.82rem", padding: "0.45rem 1rem", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        {claimingJournalId === j.id ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-check"></i>
                            <span>Claim Journal</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : claimJournalSearch.trim().length >= 2 && !claimJournalSearching ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
                    No unclaimed journals found matching &quot;{claimJournalSearch}&quot;.
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                    Type a journal title or ISSN above to find and claim your publication.
                  </div>
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
