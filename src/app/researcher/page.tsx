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
  const [activeTab, setActiveTab] = useState<"publications" | "editorial" | "library">(
    tabParam === "editorial" ? "editorial" : tabParam === "library" ? "library" : "publications"
  );
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState<boolean>(false);
  const [activeCiteArticle, setActiveCiteArticle] = useState<any | null>(null);
  const [citeFormat, setCiteFormat] = useState<"APA" | "Harvard" | "Chicago" | "Vancouver" | "BibTeX" | "RIS">("APA");
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Batch Export and Library Bookmarks
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([]);
  const [savedLibraryIds, setSavedLibraryIds] = useState<string[]>([]);
  const [savedLibraryArticles, setSavedLibraryArticles] = useState<any[]>([]);

  useEffect(() => {
    if (tabParam === "editorial") {
      setActiveTab("editorial");
    } else if (tabParam === "library") {
      setActiveTab("library");
    }
  }, [tabParam]);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

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
  const [suggestedWorks, setSuggestedWorks] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
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
  const [coAuthorsExpanded, setCoAuthorsExpanded] = useState<boolean>(false);
  const [coAuthorsCardMinimized, setCoAuthorsCardMinimized] = useState<boolean>(false);

  // Profile Claiming States
  const claimParam = searchParams.get("claim") === "true";
  const otpParam = searchParams.get("otp") || "";
  const [showClaimProfileModal, setShowClaimProfileModal] = useState<boolean>(claimParam || Boolean(otpParam));
  const [claimTab, setClaimTab] = useState<"email" | "orcid">("email");
  const [claimEmailInput, setClaimEmailInput] = useState<string>("");
  const [claimOtpInput, setClaimOtpInput] = useState<string>(otpParam);
  const [claimPasswordInput, setClaimPasswordInput] = useState<string>("");
  const [claimOrcidInput, setClaimOrcidInput] = useState<string>("");
  const [claimStep, setClaimStep] = useState<"request" | "verify">(otpParam ? "verify" : "request");
  const [claimLoading, setClaimLoading] = useState<boolean>(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);
  const [showScholarCertModal, setShowScholarCertModal] = useState<boolean>(false);

  const handlePayScholarVerification = () => {
    const IntaSendClass = typeof window !== "undefined" ? (window as any).IntaSend : null;
    if (IntaSendClass) {
      const publicKey = process.env.NEXT_PUBLIC_INTASEND_PUBLIC_KEY || "ISPubKey_sandbox_d137df7d-95cf-4df5-91db-7ff72a15f02f";
      const isLive = process.env.NEXT_PUBLIC_INTASEND_IS_LIVE === "true";
      const intasend = new IntaSendClass({
        publicAPIKey: publicKey,
        live: isLive
      });
      intasend.on("COMPLETE", async () => {
        alert("Payment received! Your Verified AfriScholar ID attestation has been confirmed.");
        setShowScholarCertModal(false);
      });
      intasend.on("FAILED", () => {
        alert("Transaction could not be completed. Please check your payment details.");
      });
      intasend.run({
        amount: 2500,
        currency: "KES",
        title: "Verified AfriScholar ID Certification",
        description: `Official ASID Certification & Attestation for ${profile?.name || "African Scholar"}`,
        api_ref: `ASID_${targetId}`
      });
    } else {
      alert("Payment gateway is initializing. Please try again in a few seconds.");
    }
  };

  useEffect(() => {
    if (claimParam || otpParam) {
      setShowClaimProfileModal(true);
      if (otpParam) {
        setClaimOtpInput(otpParam);
        setClaimStep("verify");
      }
    }
  }, [claimParam, otpParam]);

  const handleRequestClaimOtp = async () => {
    if (!targetId) return;
    setClaimLoading(true);
    setClaimErrorMessage(null);
    setClaimSuccessMessage(null);
    try {
      const res = await fetch("/api/scholars/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_otp",
          scholarId: targetId,
          email: claimEmailInput.trim() || undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        setClaimStep("verify");
        setClaimSuccessMessage(json.message);
      } else {
        setClaimErrorMessage(json.error || "Failed to send verification code.");
      }
    } catch {
      setClaimErrorMessage("Network error requesting verification code.");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleVerifyClaimOtp = async () => {
    if (!targetId) return;
    setClaimLoading(true);
    setClaimErrorMessage(null);
    try {
      const res = await fetch("/api/scholars/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          scholarId: targetId,
          otp: claimOtpInput.trim(),
          newPassword: claimPasswordInput
        })
      });
      const json = await res.json();
      if (json.success) {
        setClaimSuccessMessage("Profile verified and claimed successfully!");
        setTimeout(() => {
          window.location.href = `/researcher?id=${targetId}`;
        }, 1200);
      } else {
        setClaimErrorMessage(json.error || "Failed to verify code.");
      }
    } catch {
      setClaimErrorMessage("Network error verifying code.");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleClaimViaOrcid = async () => {
    if (!targetId) return;
    setClaimLoading(true);
    setClaimErrorMessage(null);
    try {
      const res = await fetch("/api/scholars/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim_orcid",
          scholarId: targetId,
          orcid: claimOrcidInput.trim(),
          newPassword: claimPasswordInput
        })
      });
      const json = await res.json();
      if (json.success) {
        setClaimSuccessMessage("Profile verified and claimed successfully via official ORCID registry!");
        setTimeout(() => {
          window.location.href = `/researcher?id=${targetId}`;
        }, 1200);
      } else {
        setClaimErrorMessage(json.error || "ORCID verification failed.");
      }
    } catch {
      setClaimErrorMessage("Network error verifying ORCID.");
    } finally {
      setClaimLoading(false);
    }
  };

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

  // Load OpenAlex suggested publications when claim modal opens
  useEffect(() => {
    if (showClaimModal && targetId && suggestedWorks.length === 0) {
      setLoadingSuggestions(true);
      fetch(`/api/researcher/claim?mode=suggested&researcherId=${encodeURIComponent(targetId)}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success && Array.isArray(resData.suggestions)) {
            setSuggestedWorks(resData.suggestions);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSuggestions(false));
    }
  }, [showClaimModal, targetId, suggestedWorks.length]);

  // Load avatar and follow state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLib = localStorage.getItem("afri_library_bookmarks");
        if (savedLib) setSavedLibraryIds(JSON.parse(savedLib));
        const savedMeta = localStorage.getItem("afri_saved_articles_meta");
        if (savedMeta) setSavedLibraryArticles(JSON.parse(savedMeta));
      } catch {}
      if (targetId) {
        const savedAvatar = localStorage.getItem(`afri_avatar_${targetId}`);
        if (savedAvatar) {
          setAvatarUrl(savedAvatar);
        }
        const savedFollow = localStorage.getItem(`afri_follow_${targetId}`);
        setIsFollowing(savedFollow === "true");
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
          academicRank: p.academicRank || "",
          institution: p.institution || "",
          department: p.department || "",
          country: p.country || "",
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

  const handleToggleFollow = () => {
    if (!currentUser) {
      setShowLoginPromptModal(true);
      return;
    }
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    if (typeof window !== "undefined" && targetId) {
      if (nextState) {
        localStorage.setItem(`afri_follow_${targetId}`, "true");
        showToast(`You are now following ${data?.profile?.name || "this scholar"}!`);
      } else {
        localStorage.removeItem(`afri_follow_${targetId}`);
        showToast(`Unfollowed ${data?.profile?.name || "this scholar"}.`);
      }
    }
  };

  const handleToggleSaveToLibrary = (art: any) => {
    if (!currentUser) {
      setShowLoginPromptModal(true);
      return;
    }
    const isSaved = savedLibraryIds.includes(art.id);
    const updatedIds = isSaved 
      ? savedLibraryIds.filter(id => id !== art.id) 
      : [...savedLibraryIds, art.id];
    setSavedLibraryIds(updatedIds);

    const updatedArticles = isSaved
      ? savedLibraryArticles.filter(a => a.id !== art.id)
      : [...savedLibraryArticles, art];
    setSavedLibraryArticles(updatedArticles);

    if (typeof window !== "undefined") {
      localStorage.setItem("afri_library_bookmarks", JSON.stringify(updatedIds));
      localStorage.setItem("afri_saved_articles_meta", JSON.stringify(updatedArticles));
    }
    showToast(isSaved ? "Publication removed from your Reading Library." : "Publication saved to your Reading Library (★)!");
  };

  const handleToggleSelectArticle = (artId: string) => {
    setSelectedArticleIds(prev => 
      prev.includes(artId) ? prev.filter(id => id !== artId) : [...prev, artId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticleIds(filteredArticles.map(a => a.id));
    } else {
      setSelectedArticleIds([]);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBatchExport = (fmt: "bib" | "ris" | "csv") => {
    const targetArticles = filteredArticles.filter(a => selectedArticleIds.includes(a.id));
    const exportList = targetArticles.length > 0 ? targetArticles : filteredArticles;

    if (exportList.length === 0) {
      alert("No publications selected for export.");
      return;
    }

    const scholarName = data?.profile?.name || "Scholar";
    const authorLastName = scholarName.split(" ").pop()?.toLowerCase() || "author";

    if (fmt === "bib") {
      const content = exportList.map(art => {
        const key = `${authorLastName}${art.publishedYear || 2024}_${art.id.slice(0, 5)}`;
        return `@article{${key},\n  author = {${scholarName}},\n  title = {${art.title}},\n  journal = {${art.journalName || "AfriJournal Index"}},\n  year = {${art.publishedYear || 2024}}${art.doi ? `,\n  doi = {${art.doi}}` : ""}\n}`;
      }).join("\n\n");
      downloadFile(content, `${scholarName.replace(/\s+/g, "_")}_Export.bib`, "text/plain");
      showToast(`${exportList.length} citation(s) exported to BibTeX (.bib)!`);
    } else if (fmt === "ris") {
      const content = exportList.map(art => {
        let ris = `TY  - JOUR\n`;
        ris += `TI  - ${art.title}\n`;
        ris += `AU  - ${scholarName}\n`;
        ris += `JO  - ${art.journalName || "AfriJournal Index"}\n`;
        ris += `PY  - ${art.publishedYear || 2024}\n`;
        if (art.doi) ris += `DO  - ${art.doi}\n`;
        ris += `ER  - \n`;
        return ris;
      }).join("\n");
      downloadFile(content, `${scholarName.replace(/\s+/g, "_")}_Export.ris`, "application/x-research-info-systems");
      showToast(`${exportList.length} citation(s) exported to RIS / EndNote!`);
    } else if (fmt === "csv") {
      const header = ["Title", "Author", "Journal", "Year", "DOI", "Citations"].map(h => `"${h}"`).join(",");
      const rows = exportList.map(art => [
        `"${(art.title || "").replace(/"/g, '""')}"`,
        `"${scholarName.replace(/"/g, '""')}"`,
        `"${(art.journalName || "").replace(/"/g, '""')}"`,
        art.publishedYear || 2024,
        `"${art.doi || ""}"`,
        art.citationsCount || 0
      ].join(",")).join("\n");
      downloadFile(`${header}\n${rows}`, `${scholarName.replace(/\s+/g, "_")}_Export.csv`, "text/csv");
      showToast(`${exportList.length} publication(s) exported to CSV!`);
    }
  };

  const handleCopyBadge = (journalId: string) => {
    if (typeof window !== "undefined") {
      const code = `<a href="https://afrijournalindexing.org/journal/${journalId}" target="_blank" rel="noopener noreferrer"><img src="https://afrijournalindexing.org/api/badge/${journalId}" alt="AfriJournal Verified Indexed" /></a>`;
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
          bio: editForm.bio.trim(),
          researchFocus: editForm.researchFocus
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
          `AfriJournal Index Repository  •  https://afrijournalindexing.org  •  Page ${p} of ${totalPages}`,
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

  // Unlink / Disassociate Journal from publisher account
  const handleUnlinkJournal = async (journalId: string, journalName: string) => {
    if (!confirm(`Are you sure you want to unlink and release management of "${journalName}"?`)) return;
    try {
      const res = await fetch("/api/journals/claim", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalId })
      });
      const resData = await res.json();
      if (resData.success) {
        showToast(`"${journalName}" has been unlinked successfully.`);
        await loadProfile();
      } else {
        alert(resData.error || "Failed to unlink journal.");
      }
    } catch (e) {
      console.error(e);
      alert("Error unlinking journal.");
    }
  };

  // Searching articles to claim
  const handleSearchArticles = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await fetch(`/api/researcher/claim?query=${encodeURIComponent(searchQuery.trim())}&researcherId=${encodeURIComponent(targetId || "")}`);
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
      const verifyParam = article.isExternal && article.doi
        ? `doi=${encodeURIComponent(article.doi)}`
        : `articleId=${encodeURIComponent(article.id)}`;
      const res = await fetch(`/api/researcher/claim?mode=verify&${verifyParam}&researcherId=${encodeURIComponent(targetId)}`);
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
          doi: verifyingArticle.doi || undefined,
          researcherId: targetId,
          role: authorRole,
          institutionalEmail: institutionalEmail.trim(),
          manualJustification: manualJustification.trim(),
          externalMetadata: verifyingArticle.isExternal ? {
            title: verifyingArticle.title,
            journalName: verifyingArticle.journalName,
            publishDate: verifyingArticle.publishDate,
            citationCount: verifyingArticle.citationCount,
            url: verifyingArticle.url
          } : undefined
        })
      });
      const resData = await res.json();
      if (resData.success) {
        await loadProfile();
        setSearchResults((prev) => prev.filter((a) => a.id !== verifyingArticle.id));
        setSuggestedWorks((prev) => prev.filter((a) => a.id !== verifyingArticle.id && a.doi !== verifyingArticle.doi));
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
  const isOwner = Boolean(currentUser && (currentUser.id === profile.id || !id || currentUser.role === "ADMIN"));

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
        
        {/* Unclaimed Profile Notice Banner */}
        {!profile.isClaimed && (
          <div style={{
            background: "linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(249, 115, 22, 0.04))",
            border: "1px solid rgba(234, 88, 12, 0.25)",
            padding: "1rem 1.35rem",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            gap: "1rem",
            flexWrap: "wrap"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "260px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(234, 88, 12, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <i className="fa-solid fa-key" style={{ color: "#ea580c", fontSize: "1.1rem" }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#9a3412" }}>
                  Unclaimed Scholar Profile
                </div>
                <div style={{ fontSize: "0.84rem", color: "#c2410c", marginTop: "2px" }}>
                  Are you <strong>{profile.name}</strong>? This profile has been curated from verified academic registries. Claim your profile to edit affiliations, manage works, and access your dashboard.
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowClaimProfileModal(true)}
              className="btn btn-sm"
              style={{
                background: "#ea580c",
                color: "#ffffff",
                fontWeight: 700,
                padding: "0.55rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.85rem"
              }}
            >
              <i className="fa-solid fa-check-to-slot"></i> Claim Profile
            </button>
          </div>
        )}

        {/* 1. Scholar Identity Header Card (Clean Academic Design - No AI Cliches) */}
        <div 
          className="card-surface" 
          style={{ 
            padding: "2.2rem", 
            marginBottom: "2rem", 
            borderRadius: "16px", 
            border: "1px solid var(--color-border)", 
            background: "var(--color-bg-card)",
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
                  <span style={{ background: "var(--color-bg-card-subtle)", color: "var(--color-text-body)", border: "1px solid var(--color-border)", padding: "0.2rem 0.65rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <i className="fa-solid fa-check" style={{ color: "#16a34a" }}></i> Verified Scholar
                  </span>
                  
                  {profile.isInstitutionalVerified && (
                    <span 
                      title={`Verified Institutional Affiliation: ${profile.verifiedDomain || profile.institution}`}
                      style={{ 
                        background: "#f0fdf4", 
                        color: "#15803d", 
                        border: "1px solid #bbf7d0", 
                        padding: "0.2rem 0.65rem", 
                        borderRadius: "4px", 
                        fontSize: "0.78rem", 
                        fontWeight: 700, 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "5px" 
                      }}
                    >
                      <i className="fa-solid fa-building-circle-check" style={{ color: "#16a34a" }}></i>
                      Verified at {profile.verifiedDomain || profile.institution}
                    </span>
                  )}

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
                      style={{ background: "var(--color-bg-card-subtle)", color: "#16a34a", border: "1px solid var(--color-border)", padding: "0.2rem 0.65rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
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
                {(profile.academicRank || profile.department) && (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", margin: "0 0 0.4rem", fontWeight: 600 }}>
                    {profile.academicRank ? profile.academicRank : ""}{profile.academicRank && profile.department ? ` • ${profile.department}` : (profile.department || "")}
                  </p>
                )}

                {/* University Affiliation & Country */}
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <i className="fa-solid fa-building-columns" style={{ color: "var(--color-primary)" }}></i> 
                  <span style={{ fontWeight: 600 }}>{profile.institution || "Affiliation Unspecified"}</span>
                  {profile.country && profile.country !== "International Collaborator" && (
                    <>
                      <span>•</span>
                      <span>{profile.country}</span>
                    </>
                  )}
                  {profile.isDiaspora && (
                    <span style={{ background: "rgba(139, 92, 246, 0.12)", color: "#7c3aed", border: "1px solid rgba(139, 92, 246, 0.25)", padding: "0.15rem 0.55rem", borderRadius: "999px", fontSize: "0.74rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <i className="fa-solid fa-earth-africa"></i> {profile.originCountry && profile.originCountry !== "African Diaspora" ? `${profile.originCountry} (Diaspora)` : "African Diaspora"}
                    </span>
                  )}
                </p>

                {/* Academic Bio Statement if available */}
                {profile.bio && (
                  <p style={{ color: "var(--color-text-body)", fontSize: "0.86rem", margin: "0 0 0.75rem", lineHeight: 1.5, background: "var(--color-bg-card-subtle)", padding: "0.55rem 0.8rem", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                    <i className="fa-solid fa-quote-left" style={{ color: "var(--color-primary)", marginRight: "6px", fontSize: "0.78rem" }}></i>
                    {profile.bio}
                  </p>
                )}

                {/* Disciplinary Research Focus Pills (Clickable Tags for Continental Discovery) */}
                <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {(profile.researchFocus || [
                    "African Higher Education & Pedagogy",
                    "Socio-Economic Development Policy",
                    "Regional Scientometrics & Innovation"
                  ]).map((focus: string, idx: number) => (
                    <a 
                      key={idx}
                      href={`/scholars?interest=${encodeURIComponent(focus)}`}
                      title={`Find African researchers in ${focus}`}
                      style={{
                        background: "var(--color-bg-card-subtle)",
                        color: "var(--color-text-body)",
                        border: "1px solid var(--color-border)",
                        padding: "0.22rem 0.65rem",
                        borderRadius: "5px",
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>#</span>
                      {focus}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Clean Action Toolbar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", minWidth: "190px" }}>
              {!profile.isClaimed && (
                <button
                  onClick={() => setShowClaimProfileModal(true)}
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    padding: "0.55rem 1rem",
                    borderRadius: "8px",
                    background: "#ea580c",
                    borderColor: "#ea580c",
                    color: "#ffffff"
                  }}
                >
                  <i className="fa-solid fa-key"></i>
                  <span>Claim Profile</span>
                </button>
              )}

              {isOwner ? (
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
              ) : (
                <button
                  onClick={handleToggleFollow}
                  className={isFollowing ? "btn btn-secondary" : "btn btn-primary"}
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
                  <i className={isFollowing ? "fa-solid fa-bell-slash" : "fa-solid fa-bell"}></i>
                  <span>{isFollowing ? "Following Scholar" : "Follow Scholar"}</span>
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

              <a
                href={profile.googleScholarUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(profile.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px",
                  color: "#4285F4",
                  fontWeight: 600
                }}
                title="Search and verify citations on Google Scholar"
              >
                <i className="fa-brands fa-google" style={{ color: "#4285F4" }}></i>
                <span>Google Scholar</span>
              </a>

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

        {/* 2. Google Scholar Style Scientometrics & Impact Card (Authentic Data - Dual Matrix & Annual Velocity) */}
        <div 
          className="card-surface" 
          style={{ 
            padding: "1.75rem 2rem", 
            marginBottom: "2rem", 
            borderRadius: "16px", 
            border: "1px solid var(--color-border)", 
            background: "var(--color-bg-card)",
            boxShadow: "var(--card-shadow)"
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
            
            {/* Left: Google Scholar Dual-Window Matrix (All vs Since 5 Years) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-square-poll-vertical" style={{ color: "var(--color-primary)" }}></i>
                  Citation Indices
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                  Standard Scientometrics
                </span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)", textAlign: "left" }}>
                    <th style={{ padding: "0.6rem 0.5rem", color: "var(--color-text-muted)", fontWeight: 600 }}></th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "var(--color-text-main)", fontWeight: 700, textAlign: "right" }}>All</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "var(--color-primary)", fontWeight: 700, textAlign: "right" }}>
                      Since {metrics.indicesMatrix?.startYear || (new Date().getFullYear() - 5)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-main)", fontWeight: 600 }}>Citations</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {metrics.indicesMatrix?.citations?.all ?? metrics.totalCitations}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 800, color: "var(--color-primary)" }}>
                      {metrics.indicesMatrix?.citations?.since5Yr ?? 0}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-main)", fontWeight: 600 }}>h-index</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {metrics.indicesMatrix?.hIndex?.all ?? metrics.hIndex}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 800, color: "var(--color-primary)" }}>
                      {metrics.indicesMatrix?.hIndex?.since5Yr ?? 0}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-main)", fontWeight: 600 }}>i10-index</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {metrics.indicesMatrix?.i10Index?.all ?? metrics.i10Index}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 800, color: "var(--color-primary)" }}>
                      {metrics.indicesMatrix?.i10Index?.since5Yr ?? 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Authentic Annual Citation Growth Velocity Chart */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-chart-column" style={{ color: "var(--color-primary)" }}></i>
                  Annual Citation Growth
                </h3>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                  Verified Citations / Year
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", height: "130px", padding: "0.75rem 0.5rem 0", borderBottom: "1px solid var(--color-border)" }}>
                {(metrics.yearlyCitations || []).map((item: any, idx: number) => {
                  const maxYearCites = Math.max(...(metrics.yearlyCitations || [{ citations: 1 }]).map((x: any) => x.citations), 1);
                  const barHeight = Math.max((item.citations / maxYearCites) * 100, item.citations > 0 ? 15 : 6);

                  return (
                    <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: item.citations > 0 ? "var(--color-text-main)" : "var(--color-text-muted)", marginBottom: "4px" }}>
                        {item.citations}
                      </span>
                      <div 
                        title={`${item.citations} verified citations in ${item.year}`}
                        style={{ 
                          width: "100%", 
                          maxWidth: "46px", 
                          height: `${barHeight}%`, 
                          background: item.citations > 0 ? "var(--color-primary)" : "var(--color-border)",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 0.3s ease"
                        }} 
                      />
                      <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--color-text-muted)", marginTop: "6px" }}>
                        {item.year}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom Bar: Citation Provenance (Exaly feature) */}
          <div 
            style={{ 
              marginTop: "1.75rem", 
              paddingTop: "1.2rem", 
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              fontSize: "0.85rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <i className="fa-solid fa-earth-africa" style={{ color: "var(--color-primary)" }}></i>
              <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                Continental Provenance:
              </span>
              <span style={{ color: "var(--color-text-body)" }}>
                {metrics.provenance?.africanPercent ?? 100}% African Regional Citations ({metrics.provenance?.africanCount ?? metrics.totalCitations}) • {100 - (metrics.provenance?.africanPercent ?? 100)}% International Literature ({metrics.provenance?.globalCount ?? 0})
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", padding: "0.25rem 0.65rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-body)" }}>
                {metrics.publicationsCount} Indexed Works
              </span>
              <span style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", padding: "0.25rem 0.65rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, color: "#16a34a" }}>
                Authentic Data
              </span>
            </div>
          </div>
        </div>

        {/* 3. Compact Co-Authors & Academic Collaborators Card */}
        <div 
          className="card-surface" 
          style={{ 
            padding: "0.9rem 1.4rem", 
            marginBottom: "1.25rem", 
            borderRadius: "12px", 
            border: "1px solid var(--color-border)", 
            background: "var(--color-bg-card)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa-solid fa-users" style={{ color: "var(--color-primary)", fontSize: "0.95rem" }}></i>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                Co-Authors & Academic Collaborators
              </h3>
              {data.coAuthors && data.coAuthors.length > 0 && (
                <span style={{ background: "rgba(2, 132, 199, 0.1)", color: "var(--color-primary)", padding: "0.1rem 0.5rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700 }}>
                  {data.coAuthors.length}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {data.coAuthors && data.coAuthors.length > 4 && (
                <button
                  type="button"
                  onClick={() => setCoAuthorsExpanded(!coAuthorsExpanded)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "2px 6px"
                  }}
                >
                  {coAuthorsExpanded ? "Show Less (4)" : `View All (${data.coAuthors.length})`}
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setCoAuthorsCardMinimized(!coAuthorsCardMinimized)}
                style={{
                  background: "var(--color-bg-card-subtle)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  padding: "0.2rem 0.55rem",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  cursor: "pointer"
                }}
                title={coAuthorsCardMinimized ? "Expand card" : "Minimize card"}
              >
                <i className={`fa-solid ${coAuthorsCardMinimized ? "fa-chevron-down" : "fa-chevron-up"}`} style={{ marginRight: "4px" }}></i>
                {coAuthorsCardMinimized ? "Expand" : "Collapse"}
              </button>

              <a 
                href="/scholars" 
                style={{ fontSize: "0.78rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <span>Directory</span>
                <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem" }}></i>
              </a>
            </div>
          </div>

          {!coAuthorsCardMinimized && (
            <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
              {data.coAuthors && data.coAuthors.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.65rem" }}>
                  {(coAuthorsExpanded ? data.coAuthors : data.coAuthors.slice(0, 4)).map((co: any) => {
                    const initials = co.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <div 
                        key={co.id}
                        style={{
                          padding: "0.55rem 0.75rem",
                          borderRadius: "8px",
                          background: "var(--color-bg-card-subtle)",
                          border: "1px solid var(--color-border)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.65rem"
                        }}
                      >
                        <div 
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--color-primary), #0284c7)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            flexShrink: 0
                          }}
                        >
                          {initials}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <a 
                            href={`/researcher?id=${co.id}`}
                            style={{ color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.84rem", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {co.name}
                          </a>
                          <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {co.institution}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "var(--color-primary)", fontWeight: 600 }}>
                            {co.sharedArticlesCount} co-authored paper{co.sharedArticlesCount !== 1 ? "s" : ""}
                          </div>
                        </div>

                        <a
                          href={`/researcher?id=${co.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem", flexShrink: 0 }}
                          title="View Profile"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "0.65rem 0.9rem", background: "var(--color-bg-card-subtle)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    No verified co-authors registered on AfriJournal Index yet.
                  </div>
                  <a href="/scholars" style={{ fontSize: "0.76rem", color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}>
                    Browse African Scholars →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Academic Role Navigation Tabs (Hybrid Scholar & Editor Profile) */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid var(--color-border)", marginBottom: "1.75rem", overflowX: "auto" }}>
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

          {currentUser && isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              style={{
                padding: "0.75rem 1.4rem",
                background: "none",
                border: "none",
                borderBottom: activeTab === "library" ? "2px solid #eab308" : "2px solid transparent",
                marginBottom: "-2px",
                fontWeight: 700,
                fontSize: "0.95rem",
                color: activeTab === "library" ? "#eab308" : "var(--color-text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap"
              }}
            >
              <i className="fa-solid fa-star" style={{ color: "#eab308" }}></i>
              <span>Reading Library ({savedLibraryArticles.length || savedLibraryIds.length})</span>
            </button>
          )}
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
        <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
          
          {/* Header & Filter Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <input
                type="checkbox"
                id="select-all-articles"
                checked={filteredArticles.length > 0 && selectedArticleIds.length === filteredArticles.length}
                onChange={e => handleSelectAll(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--color-primary)" }}
                title="Select all publications for batch export"
              />
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <i className="fa-solid fa-book-open" style={{ color: "var(--color-primary)" }}></i>
                Authored Publications ({filteredArticles.length})
              </h2>
            </div>

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

          {/* Sticky Batch Export Action Bar when articles are selected */}
          {selectedArticleIds.length > 0 && (
            <div 
              style={{ 
                background: "#0f172a", 
                color: "#ffffff", 
                padding: "0.75rem 1.25rem", 
                borderRadius: "8px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "1.25rem", 
                flexWrap: "wrap", 
                gap: "0.8rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.88rem", fontWeight: 700 }}>
                <i className="fa-solid fa-circle-check" style={{ color: "#4ade80" }}></i>
                <span>{selectedArticleIds.length} publication{selectedArticleIds.length > 1 ? "s" : ""} selected</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <button 
                  onClick={() => handleBatchExport("bib")} 
                  className="btn btn-secondary btn-sm" 
                  style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontSize: "0.78rem" }}
                  title="Export BibTeX for LaTeX / Overleaf"
                >
                  <i className="fa-solid fa-file-code" style={{ color: "#38bdf8", marginRight: "4px" }}></i> BibTeX (.bib)
                </button>
                <button 
                  onClick={() => handleBatchExport("ris")} 
                  className="btn btn-secondary btn-sm" 
                  style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontSize: "0.78rem" }}
                  title="Export RIS for Zotero, Mendeley & EndNote"
                >
                  <i className="fa-solid fa-file-lines" style={{ color: "#fbbf24", marginRight: "4px" }}></i> RIS / EndNote
                </button>
                <button 
                  onClick={() => handleBatchExport("csv")} 
                  className="btn btn-secondary btn-sm" 
                  style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", fontSize: "0.78rem" }}
                  title="Export CSV spreadsheet"
                >
                  <i className="fa-solid fa-file-csv" style={{ color: "#4ade80", marginRight: "4px" }}></i> CSV
                </button>
                <button 
                  onClick={() => setSelectedArticleIds([])} 
                  className="btn btn-secondary btn-sm" 
                  style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", fontSize: "0.78rem" }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Publications List */}
          {filteredArticles.length === 0 ? (
            data.articles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
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
                    background: "var(--color-bg-card-subtle)",
                    border: selectedArticleIds.includes(art.id) ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1.2rem",
                    flexWrap: "wrap",
                    transition: "border-color 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start", flex: 1, minWidth: "260px" }}>
                    <input
                      type="checkbox"
                      checked={selectedArticleIds.includes(art.id)}
                      onChange={() => handleToggleSelectArticle(art.id)}
                      style={{ marginTop: "4px", width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--color-primary)" }}
                      title="Select publication for export"
                    />

                    <div style={{ flex: 1 }}>
                      {/* Article Title */}
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.4rem", lineHeight: 1.4 }}>
                        {art.title}
                      </h3>

                      {/* Journal Details */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.6rem" }}>
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
                          <span style={{ background: "var(--color-bg-card-subtle)", color: "var(--color-text-body)", border: "1px solid var(--color-border)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                            {art.journalQuartile}
                          </span>
                        )}

                        {art.journalScore && (
                          <span style={{ background: "var(--color-bg-card-subtle)", color: "var(--color-text-body)", border: "1px solid var(--color-border)", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                            AJCI {art.journalScore}
                          </span>
                        )}
                      </div>

                      {/* Metadata & DOI */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", alignItems: "center", fontSize: "0.8rem" }}>
                        {art.doi && (
                          <span style={{ color: "var(--color-text-muted)" }}>
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
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
                    {/* Direct External Citation Link to Google Scholar */}
                    {art.citationsCount > 0 ? (
                      <a
                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(art.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View citing literature and citation metrics on Google Scholar"
                        style={{
                          textAlign: "right",
                          textDecoration: "none",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          transition: "opacity 0.15s ease",
                          display: "block"
                        }}
                      >
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)", display: "block", lineHeight: 1 }}>
                          {art.citationsCount.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                          Citations <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem", color: "#4285F4" }}></i>
                        </span>
                      </a>
                    ) : (
                      <div style={{ textAlign: "right", padding: "2px 6px" }}>
                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-lighter)", display: "block", lineHeight: 1 }}>
                          0
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-lighter)", textTransform: "uppercase", fontWeight: 600 }}>
                          Citations
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSaveToLibrary(art)}
                        className="btn btn-secondary btn-sm"
                        title={currentUser ? (savedLibraryIds.includes(art.id) ? "Saved in Reading Library (Click to remove)" : "Save to Reading Library") : "Sign in to save to Reading Library"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.35rem 0.55rem",
                          color: currentUser && savedLibraryIds.includes(art.id) ? "#eab308" : "var(--color-text-muted)"
                        }}
                      >
                        <i className={currentUser && savedLibraryIds.includes(art.id) ? "fa-solid fa-star" : "fa-regular fa-star"}></i>
                      </button>

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
      ) : activeTab === "library" ? (
        !currentUser ? (
          <div className="card-surface" style={{ textAlign: "center", padding: "4rem 2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(234, 179, 8, 0.12)", color: "#eab308", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 1.2rem" }}>
              <i className="fa-solid fa-lock"></i>
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
              Sign In to View Your Reading Library
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", maxWidth: "480px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
              Your Reading Library is a private workspace for literature management, citation export, and personal bookmarks.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <a href="/login" className="btn btn-primary" style={{ padding: "0.6rem 1.4rem", fontWeight: 700 }}>
                <i className="fa-solid fa-right-to-bracket" style={{ marginRight: "6px" }}></i>
                Sign In
              </a>
              <a href="/register" className="btn btn-secondary" style={{ padding: "0.6rem 1.4rem" }}>
                Create Free Account
              </a>
            </div>
          </div>
        ) : (
        /* TAB 3: READING LIBRARY VIEW */
        <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-star" style={{ color: "#eab308" }}></i>
                  My Reading Library
                </h2>
                <span style={{ background: "rgba(234, 179, 8, 0.12)", color: "#ca8a04", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 700 }}>
                  {savedLibraryArticles.length} publication{savedLibraryArticles.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0.35rem 0 0" }}>
                Saved research articles bookmarked for literature reviews, reference lists, and bibliographic exports.
              </p>
            </div>

            {savedLibraryArticles.length > 0 && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <button 
                  onClick={() => handleBatchExport("bib")} 
                  className="btn btn-secondary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem" }}
                  title="Export BibTeX for LaTeX / Overleaf"
                >
                  <i className="fa-solid fa-file-code" style={{ color: "var(--color-primary)" }}></i>
                  <span>BibTeX (.bib)</span>
                </button>
                <button 
                  onClick={() => handleBatchExport("ris")} 
                  className="btn btn-secondary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem" }}
                  title="Export RIS for Zotero, Mendeley & EndNote"
                >
                  <i className="fa-solid fa-file-lines" style={{ color: "#eab308" }}></i>
                  <span>RIS / EndNote</span>
                </button>
                <button 
                  onClick={() => handleBatchExport("csv")} 
                  className="btn btn-secondary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "0.8rem" }}
                  title="Export CSV spreadsheet"
                >
                  <i className="fa-solid fa-file-csv" style={{ color: "#16a34a" }}></i>
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>

          {savedLibraryArticles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", background: "var(--color-bg-card-subtle)", borderRadius: "12px", border: "1px dashed var(--color-border)" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(234, 179, 8, 0.1)", color: "#eab308", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", margin: "0 auto 1rem" }}>
                <i className="fa-solid fa-star"></i>
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.4rem" }}>
                Your Reading Library is Empty
              </h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", maxWidth: "480px", margin: "0 auto 1.4rem", lineHeight: 1.5 }}>
                Bookmark publications by clicking the Star (★) icon next to any paper across the African journal index to save them here for quick referencing.
              </p>
              <a href="/browse" className="btn btn-primary" style={{ padding: "0.55rem 1.25rem", fontSize: "0.85rem", fontWeight: 700 }}>
                <i className="fa-solid fa-magnifying-glass" style={{ marginRight: "6px" }}></i> Browse Indexed Publications
              </a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {savedLibraryArticles.map((art: any) => (
                <div 
                  key={art.id} 
                  style={{
                    padding: "1.25rem",
                    borderRadius: "8px",
                    background: "var(--color-bg-card-subtle)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1.2rem",
                    flexWrap: "wrap"
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.4rem", lineHeight: 1.4 }}>
                      {art.title}
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center", fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                      <span>Published in <strong style={{ color: "var(--color-primary)" }}>{art.journalName || "Indexed Journal"}</strong></span>
                      <span>•</span>
                      <span>{art.publishedYear || 2024}</span>
                    </div>
                    {art.doi && (
                      <div style={{ fontSize: "0.8rem" }}>
                        <a 
                          href={`https://doi.org/${art.doi}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: "#0284c7", textDecoration: "none" }}
                        >
                          https://doi.org/{art.doi}
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
                    {art.citationsCount > 0 ? (
                      <a
                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(art.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View citations on Google Scholar"
                        style={{
                          textDecoration: "none",
                          textAlign: "right",
                          display: "block",
                          padding: "2px 6px",
                          borderRadius: "6px"
                        }}
                      >
                        <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-primary)", display: "block", lineHeight: 1 }}>
                          {art.citationsCount.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                          Citations <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.65rem", color: "#4285F4" }}></i>
                        </span>
                      </a>
                    ) : (
                      <div style={{ textAlign: "right", padding: "2px 6px" }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-lighter)", display: "block", lineHeight: 1 }}>
                          0
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-lighter)", textTransform: "uppercase", fontWeight: 600 }}>
                          Citations
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSaveToLibrary(art)}
                        className="btn btn-secondary btn-sm"
                        title="Remove from Reading Library"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.35rem 0.55rem",
                          color: "#eab308"
                        }}
                      >
                        <i className="fa-solid fa-star"></i>
                      </button>

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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )
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
            <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
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
                      border: "1px solid var(--color-border)", 
                      background: "var(--color-bg-card-subtle)",
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
                          <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>
                            {j.country}
                          </span>
                        </div>

                        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.35rem", color: "var(--color-text-main)" }}>
                          <a href={`/journal/${j.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {j.name}
                          </a>
                        </h3>

                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                          <strong>Publisher:</strong> {j.publisherName} • <strong>Print ISSN:</strong> {j.issn || "None"} • <strong>Online eISSN:</strong> {j.eissn || "None"}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        <a href={`/journal/${j.id}`} className="btn btn-primary btn-sm" style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}>
                          View Public Profile
                        </a>
                        {j.websiteUrl && (
                          <a href={j.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem" }}>
                            Website <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.7rem", marginLeft: "4px" }}></i>
                          </a>
                        )}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleUnlinkJournal(j.id, j.name)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.82rem", padding: "0.4rem 0.85rem", color: "#ef4444", borderColor: "#fca5a5" }}
                            title="Unlink and release editorial management of this journal"
                          >
                            <i className="fa-solid fa-link-slash" style={{ marginRight: "4px" }}></i>
                            Unlink Journal
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metrics 3-box Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                      <div style={{ background: "var(--color-bg-card)", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Standard AJCI</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)" }}>{j.standardScore}</span>
                      </div>
                      <div style={{ background: "var(--color-bg-card)", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Regional Multiplier</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#059669" }}>{j.regionalScore}</span>
                      </div>
                      <div style={{ background: "var(--color-bg-card)", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>Cataloged Articles</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-body)" }}>{j.articlesCount}</span>
                      </div>
                    </div>

                    {/* Embed Live Verification Badge Box */}
                    <div style={{ background: "var(--color-bg-card)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <div>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>Live AJCI Verification Badge:</span>
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
            <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
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
                  }[s.status as string] || { label: s.status, bg: "#f1f5f9", color: "var(--color-text-body)", border: "#cbd5e1", icon: "fa-circle-info" };

                  return (
                    <div 
                      key={s.id} 
                      style={{ 
                        padding: "1.2rem 1.4rem", 
                        borderRadius: "10px", 
                        border: "1px solid var(--color-border)", 
                        background: "var(--color-bg-card-subtle)",
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
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            Submitted {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.2rem", color: "var(--color-text-main)" }}>
                          {s.journalName}
                        </h4>

                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
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
            <div className="card-surface" style={{ padding: "3.5rem 1.5rem", borderRadius: "16px", border: "1px dashed #cbd5e1", background: "var(--color-bg-card-subtle)", textAlign: "center" }}>
              <i className="fa-solid fa-newspaper" style={{ fontSize: "3rem", color: "var(--color-primary)", marginBottom: "1rem", display: "block" }}></i>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
                Editorial & Academic Journal Management
              </h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", maxWidth: "560px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
                You currently have no academic journals indexed or submitted. If you are an Editor-in-Chief, Managing Editor, or university press publisher, you can submit your peer-reviewed publication to receive automated crawler audit logs, ISSN registry validation, and official AfriJournal Citation Index (AJCI) ranking.
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
                background: "var(--color-bg-card)"
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
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", padding: "1rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "1.2rem" }}>
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
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
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
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "3px", display: "block" }}>
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
                maxWidth: "640px",
                padding: "2rem",
                borderRadius: "16px",
                background: "var(--color-bg-card)",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)"
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
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                {(["APA", "Harvard", "Chicago", "Vancouver", "BibTeX", "RIS"] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCiteFormat(fmt)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "1px solid",
                      background: citeFormat === fmt ? "var(--color-primary)" : "var(--color-bg-card-subtle)",
                      color: citeFormat === fmt ? "#ffffff" : "var(--color-text-main)",
                      borderColor: citeFormat === fmt ? "var(--color-primary)" : "var(--color-border)"
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              {/* Citation Box */}
              <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1.2rem", fontSize: "0.88rem", lineHeight: 1.6, color: "var(--color-text-body)", fontFamily: citeFormat === "BibTeX" || citeFormat === "RIS" ? "monospace" : "inherit", whiteSpace: citeFormat === "BibTeX" || citeFormat === "RIS" ? "pre-wrap" : "normal", wordBreak: "break-word", marginBottom: "1.2rem", maxHeight: "200px", overflowY: "auto" }}>
                {citeFormat === "APA" && (
                  `${profile.name}. (${activeCiteArticle.publishedYear || 2024}). ${activeCiteArticle.title}. ${activeCiteArticle.journalName}.${activeCiteArticle.doi ? ` https://doi.org/${activeCiteArticle.doi}` : ""}`
                )}
                {citeFormat === "Harvard" && (
                  `${profile.name}, ${activeCiteArticle.publishedYear || 2024}. '${activeCiteArticle.title}', ${activeCiteArticle.journalName}.${activeCiteArticle.doi ? ` Available at: <https://doi.org/${activeCiteArticle.doi}>.` : ""}`
                )}
                {citeFormat === "Chicago" && (
                  `${profile.name}. ${activeCiteArticle.publishedYear || 2024}. "${activeCiteArticle.title}." ${activeCiteArticle.journalName}.${activeCiteArticle.doi ? ` https://doi.org/${activeCiteArticle.doi}.` : ""}`
                )}
                {citeFormat === "Vancouver" && (
                  `${profile.name}. ${activeCiteArticle.title}. ${activeCiteArticle.journalName}. ${activeCiteArticle.publishedYear || 2024};${activeCiteArticle.doi ? ` Available from: https://doi.org/${activeCiteArticle.doi}` : ""}`
                )}
                {citeFormat === "BibTeX" && (
                  `@article{${profile.name.split(" ")[0].toLowerCase()}${activeCiteArticle.publishedYear || 2024},\n  author = {${profile.name}},\n  title = {${activeCiteArticle.title}},\n  journal = {${activeCiteArticle.journalName}},\n  year = {${activeCiteArticle.publishedYear || 2024}}${activeCiteArticle.doi ? `,\n  doi = {${activeCiteArticle.doi}}` : ""}\n}`
                )}
                {citeFormat === "RIS" && (
                  `TY  - JOUR\nTI  - ${activeCiteArticle.title}\nAU  - ${profile.name}\nJO  - ${activeCiteArticle.journalName}\nPY  - ${activeCiteArticle.publishedYear || 2024}\n${activeCiteArticle.doi ? `DO  - ${activeCiteArticle.doi}\n` : ""}ER  - `
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                {(citeFormat === "BibTeX" || citeFormat === "RIS") && (
                  <button
                    onClick={() => {
                      if (citeFormat === "BibTeX") {
                        const content = `@article{${profile.name.split(" ")[0].toLowerCase()}${activeCiteArticle.publishedYear || 2024},\n  author = {${profile.name}},\n  title = {${activeCiteArticle.title}},\n  journal = {${activeCiteArticle.journalName}},\n  year = {${activeCiteArticle.publishedYear || 2024}}${activeCiteArticle.doi ? `,\n  doi = {${activeCiteArticle.doi}}` : ""}\n}`;
                        downloadFile(content, `citation_${activeCiteArticle.id || "export"}.bib`, "text/plain");
                      } else {
                        const content = `TY  - JOUR\nTI  - ${activeCiteArticle.title}\nAU  - ${profile.name}\nJO  - ${activeCiteArticle.journalName}\nPY  - ${activeCiteArticle.publishedYear || 2024}\n${activeCiteArticle.doi ? `DO  - ${activeCiteArticle.doi}\n` : ""}ER  - `;
                        downloadFile(content, `citation_${activeCiteArticle.id || "export"}.ris`, "application/x-research-info-systems");
                      }
                      showToast(`Downloaded citation as .${citeFormat.toLowerCase()}!`);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <i className="fa-solid fa-download"></i>
                    <span>Download .{citeFormat.toLowerCase()}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    let text = "";
                    if (citeFormat === "APA") {
                      text = `${profile.name}. (${activeCiteArticle.publishedYear || 2024}). ${activeCiteArticle.title}. ${activeCiteArticle.journalName}.${activeCiteArticle.doi ? ` https://doi.org/${activeCiteArticle.doi}` : ""}`;
                    } else if (citeFormat === "Harvard") {
                      text = `${profile.name}, ${activeCiteArticle.publishedYear || 2024}. '${activeCiteArticle.title}', ${activeCiteArticle.journalName}.${activeCiteArticle.doi ? ` Available at: <https://doi.org/${activeCiteArticle.doi}>.` : ""}`;
                    } else if (citeFormat === "Chicago") {
                      text = `${profile.name}. ${activeCiteArticle.publishedYear || 2024}. "${activeCiteArticle.title}." ${activeCiteArticle.journalName}.${activeCiteArticle.doi ? ` https://doi.org/${activeCiteArticle.doi}.` : ""}`;
                    } else if (citeFormat === "Vancouver") {
                      text = `${profile.name}. ${activeCiteArticle.title}. ${activeCiteArticle.journalName}. ${activeCiteArticle.publishedYear || 2024};${activeCiteArticle.doi ? ` Available from: https://doi.org/${activeCiteArticle.doi}` : ""}`;
                    } else if (citeFormat === "BibTeX") {
                      text = `@article{${profile.name.split(" ")[0].toLowerCase()}${activeCiteArticle.publishedYear || 2024},\n  author = {${profile.name}},\n  title = {${activeCiteArticle.title}},\n  journal = {${activeCiteArticle.journalName}},\n  year = {${activeCiteArticle.publishedYear || 2024}}${activeCiteArticle.doi ? `,\n  doi = {${activeCiteArticle.doi}}` : ""}\n}`;
                    } else {
                      text = `TY  - JOUR\nTI  - ${activeCiteArticle.title}\nAU  - ${profile.name}\nJO  - ${activeCiteArticle.journalName}\nPY  - ${activeCiteArticle.publishedYear || 2024}\n${activeCiteArticle.doi ? `DO  - ${activeCiteArticle.doi}\n` : ""}ER  - `;
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


        {/* Modal: Sign In Required to Save Articles */}
        {showLoginPromptModal && (
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
                maxWidth: "460px",
                padding: "2rem",
                borderRadius: "16px",
                background: "var(--color-bg-card)",
                textAlign: "center",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
              }}
            >
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(234, 179, 8, 0.12)", color: "#eab308", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 1.2rem" }}>
                <i className="fa-solid fa-star"></i>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
                Sign In to Save Publications
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
                Your personal Reading Library allows you to organize literature, export multi-style bibliographies, and track African research across sessions.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <a 
                  href="/login" 
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "0.65rem 1rem", fontSize: "0.9rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-right-to-bracket" style={{ marginRight: "6px" }}></i>
                  Sign In to Continue
                </a>
                <a 
                  href="/register" 
                  className="btn btn-secondary"
                  style={{ width: "100%", justifyContent: "center", padding: "0.6rem 1rem", fontSize: "0.85rem" }}
                >
                  Create Free Researcher Account
                </a>
                <button
                  type="button"
                  onClick={() => setShowLoginPromptModal(false)}
                  style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "0.82rem", cursor: "pointer", marginTop: "0.4rem" }}
                >
                  Dismiss
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
                background: "var(--color-bg-card)"
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
                  <div style={{ padding: "1.2rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "1.2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "0.72rem", background: "var(--color-bg-card-subtle)", color: "var(--color-text-body)", border: "1px solid var(--color-border)", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 700, textTransform: "uppercase" }}>
                        Selected Publication
                      </span>
                      {verifyingArticle.doi && (
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
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
                    <div style={{ padding: "2rem 1rem", textAlign: "center", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "1.2rem" }}>
                      <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "1.8rem", color: "var(--color-primary)", marginBottom: "0.75rem" }}></i>
                      <div style={{ fontWeight: 600, color: "var(--color-text-body)", fontSize: "0.92rem" }}>
                        Querying Crossref & ORCID Metadata Registries...
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0" }}>
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
                    <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1.2rem", marginBottom: "1.2rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--color-text-body)", marginBottom: "0.6rem" }}>
                        Co-Author Verification Details (Required)
                      </div>
                      
                      <div style={{ marginBottom: "0.85rem" }}>
                        <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-body)" }}>
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
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                          Must be an accredited university or research institute email address.
                        </span>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-body)" }}>
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
                  <form onSubmit={handleSearchArticles} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search papers by title, author, or enter DOI (e.g. 10.xxxx/...)"
                      className="form-control"
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: "0 1.2rem", whiteSpace: "nowrap" }} disabled={searching}>
                      {searching ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "6px" }}></i>
                          Searching...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-magnifying-glass" style={{ marginRight: "6px" }}></i>
                          Search Repositories
                        </>
                      )}
                    </button>
                  </form>

                  {/* OpenAlex Suggested Publications (if any and not actively searching) */}
                  {searchResults.length === 0 && !searching && suggestedWorks.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#d97706" }}></i>
                          Suggested Publications from OpenAlex Registry ({suggestedWorks.length})
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Matched to your scholar profile
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "320px", overflowY: "auto", paddingRight: "4px" }}>
                        {suggestedWorks.map(sug => (
                          <div
                            key={sug.id}
                            style={{
                              padding: "0.9rem",
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
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <span style={{ fontSize: "0.68rem", background: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                  External (OpenAlex)
                                </span>
                                {sug.citationCount > 0 && (
                                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                                    • {sug.citationCount} {sug.citationCount === 1 ? "citation" : "citations"}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.88rem", lineHeight: 1.35 }}>
                                {sug.title}
                              </div>
                              <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                                {sug.journalName || "Academic Publication"}{sug.doi ? ` • DOI: ${sug.doi}` : ""}
                              </div>
                            </div>
                            {sug.isAlreadyClaimed ? (
                              <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", padding: "0.3rem 0.6rem" }}>
                                <i className="fa-solid fa-circle-check"></i> Already Linked
                              </span>
                            ) : (
                              <button
                                onClick={() => handleInitiateClaim(sug)}
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }}
                              >
                                Claim Publication
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Results List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {searchResults.length === 0 ? (
                      suggestedWorks.length === 0 && (
                        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
                          {searching ? t.researcher_page.searching : t.researcher_page.no_articles_found}
                        </p>
                      )
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
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                              {art.isExternal ? (
                                <span style={{ fontSize: "0.68rem", background: "rgba(245, 158, 11, 0.12)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                  External Publication (Crossref)
                                </span>
                              ) : (
                                <span style={{ fontSize: "0.68rem", background: "rgba(34, 197, 94, 0.12)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                  AJI Indexed Repository
                                </span>
                              )}
                              {art.citationCount > 0 && (
                                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                                  • {art.citationCount} {art.citationCount === 1 ? "citation" : "citations"}
                                </span>
                              )}
                            </div>
                            <div style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.92rem" }}>
                              {art.title}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                              {art.journalName || art.journal?.name}{art.doi ? ` • DOI: ${art.doi}` : ""}
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

        {/* Claim Scholar Profile Modal */}
        {showClaimProfileModal && (
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
              zIndex: 9999,
              padding: "1rem"
            }}
            onClick={() => setShowClaimProfileModal(false)}
          >
            <div 
              className="card-surface" 
              onClick={e => e.stopPropagation()} 
              style={{ 
                width: "100%",
                maxWidth: "580px", 
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "2rem", 
                borderRadius: "16px",
                background: "var(--color-bg-card)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                border: "1px solid var(--color-border)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-key" style={{ color: "#ea580c", fontSize: "1.2rem" }}></i>
                    <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                      Claim Researcher Profile
                    </h3>
                  </div>
                  <p style={{ margin: "0.3rem 0 0", fontSize: "0.86rem", color: "var(--color-text-muted)" }}>
                    Verify your identity to claim <strong>{profile.name}</strong> ({profile.institution || "African Academic Institution"}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClaimProfileModal(false)}
                  style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--color-text-muted)" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Authentication Notice if not signed in */}
              {!currentUser && (
                <div style={{ padding: "1.1rem 1.25rem", borderRadius: "10px", background: "rgba(2, 132, 199, 0.06)", border: "1px solid rgba(2, 132, 199, 0.2)", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.35rem" }}>
                    <i className="fa-solid fa-user-lock" style={{ color: "var(--color-primary)", fontSize: "0.95rem" }}></i>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                      Account Authentication
                    </span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "0 0 0.85rem", lineHeight: 1.45 }}>
                    Already have an AfriJournal account? Sign in to claim this profile directly. New scholar? Verify your email OTP or ORCID below to claim and activate your account.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a 
                      href={`/login?redirect=${encodeURIComponent(`/researcher?id=${targetId}&claim=true`)}`} 
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <i className="fa-solid fa-right-to-bracket"></i> Sign In to Account
                    </a>
                    <a 
                      href={`/register?role=researcher&claimId=${encodeURIComponent(targetId)}`} 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <i className="fa-solid fa-user-plus"></i> Register
                    </a>
                  </div>
                </div>
              )}

              {/* Claim Verification Method Tabs */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => { setClaimTab("email"); setClaimErrorMessage(null); setClaimSuccessMessage(null); }}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    borderRadius: "8px",
                    border: "none",
                    background: claimTab === "email" ? "var(--color-primary)" : "var(--color-bg-card-subtle)",
                    color: claimTab === "email" ? "#ffffff" : "var(--color-text-muted)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fa-solid fa-envelope"></i>
                  <span>Institutional Email OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setClaimTab("orcid"); setClaimErrorMessage(null); setClaimSuccessMessage(null); }}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    borderRadius: "8px",
                    border: "none",
                    background: claimTab === "orcid" ? "#a6ce39" : "var(--color-bg-card-subtle)",
                    color: claimTab === "orcid" ? "#1e293b" : "var(--color-text-muted)",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fa-brands fa-orcid"></i>
                  <span>Official ORCID Registry</span>
                </button>
              </div>

              {/* Status Notifications */}
              {claimSuccessMessage && (
                <div style={{ background: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.3)", color: "#16a34a", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{claimSuccessMessage}</span>
                </div>
              )}

              {claimErrorMessage && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>{claimErrorMessage}</span>
                </div>
              )}

              {/* TAB 1: Institutional Email OTP */}
              {claimTab === "email" && (
                <div>
                  {claimStep === "request" ? (
                    <div>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-body)", lineHeight: 1.5, marginBottom: "1.2rem" }}>
                        We will send a 6-digit one-time code to your registered academic email address or an official university email matching your institution.
                      </p>
                      <div style={{ marginBottom: "1.2rem" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                          Academic Email Address
                        </label>
                        <input
                          type="email"
                          value={claimEmailInput}
                          onChange={e => setClaimEmailInput(e.target.value)}
                          placeholder="e.g. name@university.ac.ke or university.ac.za"
                          className="form-control"
                          style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.9rem" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestClaimOtp}
                        disabled={claimLoading}
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        {claimLoading ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>Sending Verification Code...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane"></i>
                            <span>Send 6-Digit Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-body)", lineHeight: 1.5, marginBottom: "1.2rem" }}>
                        Enter the 6-digit code sent to your academic email address and choose a permanent password for your AfriJournal researcher portal.
                      </p>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                          6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={claimOtpInput}
                          onChange={e => setClaimOtpInput(e.target.value)}
                          placeholder="123456"
                          className="form-control"
                          style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "4px", textAlign: "center" }}
                        />
                      </div>
                      <div style={{ marginBottom: "1.2rem" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                          Choose New Permanent Password (min. 8 characters)
                        </label>
                        <input
                          type="password"
                          value={claimPasswordInput}
                          onChange={e => setClaimPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="form-control"
                          style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.9rem" }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "0.6rem" }}>
                        <button
                          type="button"
                          onClick={() => setClaimStep("request")}
                          className="btn btn-secondary"
                          style={{ padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem" }}
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyClaimOtp}
                          disabled={claimLoading}
                          className="btn btn-primary"
                          style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                        >
                          {claimLoading ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin"></i>
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-check"></i>
                              <span>Verify & Activate Profile</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Official ORCID Registry */}
              {claimTab === "orcid" && (
                <div>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-body)", lineHeight: 1.5, marginBottom: "1.2rem" }}>
                    Instant identity verification: provide your official 16-digit ORCID iD. We will verify your identity against the international ORCID registry.
                  </p>
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                      Your ORCID iD
                    </label>
                    <input
                      type="text"
                      value={claimOrcidInput}
                      onChange={e => setClaimOrcidInput(e.target.value)}
                      placeholder="0000-0002-1825-0097"
                      className="form-control"
                      style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.9rem" }}
                    />
                  </div>
                  <div style={{ marginBottom: "1.2rem" }}>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.35rem" }}>
                      Set Account Password (min. 8 characters)
                    </label>
                    <input
                      type="password"
                      value={claimPasswordInput}
                      onChange={e => setClaimPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="form-control"
                      style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.9rem" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleClaimViaOrcid}
                    disabled={claimLoading}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    {claimLoading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Verifying with ORCID...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-brands fa-orcid"></i>
                        <span>Verify ORCID & Claim Profile</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Verified AfriScholar ID & Certificate Modal */}
        {showScholarCertModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(10, 15, 29, 0.82)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: "1rem",
              backdropFilter: "blur(6px)"
            }}
            onClick={() => setShowScholarCertModal(false)}
          >
            <div
              style={{
                background: "var(--color-bg-card)",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                maxWidth: "680px",
                width: "100%",
                padding: "2rem",
                boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
                maxHeight: "90vh",
                overflowY: "auto",
                position: "relative"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", fontWeight: 800, color: "var(--color-primary)", background: "rgba(245, 158, 11, 0.12)", padding: "0.2rem 0.6rem", borderRadius: "12px", marginBottom: "0.4rem" }}>
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Official Academic Credential</span>
                  </div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
                    Verified AfriScholar Certification
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScholarCertModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.3rem", color: "var(--color-text-muted)", cursor: "pointer", padding: "0.2rem" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Certificate Canvas Preview Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  border: "2px solid #d97706",
                  borderRadius: "12px",
                  padding: "2rem 1.5rem",
                  color: "#f8fafc",
                  textAlign: "center",
                  position: "relative",
                  marginBottom: "1.5rem",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.3)"
                }}
              >
                <div style={{ fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase", color: "#fbbf24", fontWeight: 800, marginBottom: "0.5rem" }}>
                  AfriJournal Index • Registry of African Scholars
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#ffffff", margin: "0 0 1rem", letterSpacing: "-0.01em" }}>
                  Certificate of Scholarly Authentication
                </h3>
                <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
                  This hereby certifies that
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fbbf24", margin: "0.2rem 0 0.5rem" }}>
                  {profile.name}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "1rem" }}>
                  {profile.institution || "African Academic & Research Institution"} {profile.country ? `• ${profile.country}` : ""}
                </div>

                <div style={{ display: "inline-block", background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: "6px", padding: "0.4rem 1rem", marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block" }}>Permanent African Scholar Identifier</span>
                  <strong style={{ fontSize: "1rem", color: "#fbbf24", letterSpacing: "1px" }}>
                    {(profile as any)?.asid || `ASID-2026-${((profile as any)?.countryCode || (profile.country === "Kenya" ? "KE" : profile.country === "Nigeria" ? "NG" : profile.country === "South Africa" ? "ZA" : "AF")).slice(0, 2).toUpperCase()}-${(profile.id || targetId || "0000").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "center", gap: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem", fontSize: "0.82rem", color: "#94a3b8" }}>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "1.05rem", display: "block" }}>{profile.totalCitations || 0}</strong>
                    <span>Verified Citations</span>
                  </div>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "1.05rem", display: "block" }}>h-{profile.hIndex || 0}</strong>
                    <span>Hirsch Index</span>
                  </div>
                  <div>
                    <strong style={{ color: "#ffffff", fontSize: "1.05rem", display: "block" }}>2026</strong>
                    <span>Attestation Year</span>
                  </div>
                </div>
              </div>

              {/* Information & Action Section */}
              <div style={{ fontSize: "0.86rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                The <strong>Verified AfriScholar ID (ASID)</strong> is the continental standard for African research identity. It provides permanent cryptographic attribution for academic promotion reviews, institutional grant applications, and peer review credentialing.
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", padding: "0.6rem 1.2rem" }}
                >
                  <i className="fa-solid fa-print"></i>
                  <span>Print Certificate</span>
                </button>

                {profile.isClaimed ? (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", fontWeight: 700, padding: "0.6rem 1.4rem" }}
                  >
                    <i className="fa-solid fa-file-pdf"></i>
                    <span>Download / Print Official Certificate</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setShowScholarCertModal(false); setShowClaimProfileModal(true); }}
                    className="btn btn-primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", fontWeight: 700, padding: "0.6rem 1.4rem" }}
                  >
                    <i className="fa-solid fa-id-badge"></i>
                    <span>Claim &amp; Verify Profile (Free)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
