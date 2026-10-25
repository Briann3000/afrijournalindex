"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ALL_COUNTRY_NAMES } from "../data/african-countries";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  institution?: string;
}

interface Stats {
  totalJournals: number;
  indexedJournals: number;
  paidCertificates: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  totalClaims: number;
  pendingClaims: number;
  totalUsers: number;
  totalResearchers: number;
  totalPublishers: number;
  totalAdmins: number;
  totalForumTopics: number;
  totalForumReplies: number;
  totalPosts: number;
  totalJournalComments: number;
  scopusJournals?: number;
  wosJournals?: number;
}

type TabKey = "overview" | "submissions" | "claims" | "journals" | "moderation" | "users" | "harvester" | "payments";

export default function AdminPortalPage() {
  const router = useRouter();

  // -------------------------------------------------------------
  // Session & Authentication
  // -------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [moderationSubTab, setModerationSubTab] = useState<"forum" | "posts" | "comments">("forum");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // -------------------------------------------------------------
  // Platform Datasets
  // -------------------------------------------------------------
  const [stats, setStats] = useState<Stats | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [forumTopics, setForumTopics] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Action in progress indicator
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals & Selected Inspection States
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [subReviewNotes, setSubReviewNotes] = useState<string>("");
  const [subQualityGrade, setSubQualityGrade] = useState<string>("A");

  // Harvester Form State
  const [harvestForm, setHarvestForm] = useState({
    oaiUrl: "https://journals.co.za/oai/request",
    journalId: "",
    limit: 50,
    autoSave: true
  });
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [harvestResult, setHarvestResult] = useState<any | null>(null);

  // Metrics Recalculation State
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmLabel: "Confirm",
    onConfirm: () => {}
  });

  // -------------------------------------------------------------
  // Submissions Controls
  // -------------------------------------------------------------
  const [subSearch, setSubSearch] = useState<string>("");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("ALL");
  const [subCountryFilter, setSubCountryFilter] = useState<string>("ALL");
  const [subPage, setSubPage] = useState<number>(1);
  const [subPageSize] = useState<number>(10);

  // -------------------------------------------------------------
  // Claims Controls
  // -------------------------------------------------------------
  const [claimSearch, setClaimSearch] = useState<string>("");
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("ALL");
  const [claimPage, setClaimPage] = useState<number>(1);
  const [claimPageSize] = useState<number>(10);

  // -------------------------------------------------------------
  // Journals Controls
  // -------------------------------------------------------------
  const [journalSearch, setJournalSearch] = useState<string>("");
  const [journalIndexedFilter, setJournalIndexedFilter] = useState<string>("ALL");
  const [journalPaidFilter, setJournalPaidFilter] = useState<string>("ALL");
  const [journalIndexingBodyFilter, setJournalIndexingBodyFilter] = useState<string>("ALL");
  const [journalCountryFilter, setJournalCountryFilter] = useState<string>("ALL");
  const [journalPage, setJournalPage] = useState<number>(1);
  const [journalPageSize] = useState<number>(15);

  // -------------------------------------------------------------
  // Users Controls
  // -------------------------------------------------------------
  const [userSearch, setUserSearch] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userPage, setUserPage] = useState<number>(1);
  const [userPageSize] = useState<number>(15);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Authentication Check
  const checkAuthAndLoad = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/auth");
      const data = await res.json();

      if (data.authenticated && data.isAdmin) {
        setCurrentUser(data.user);
        await fetchAdminData();
      } else {
        router.replace("/admin/login");
      }
    } catch {
      setError("Network error connecting to administrative service.");
      setLoading(false);
    }
  };

  // 2. Fetch Datasets
  const fetchAdminData = async (searchQuery = "") => {
    setRefreshing(true);
    setError(null);
    try {
      const url = searchQuery ? `/api/admin?searchJournal=${encodeURIComponent(searchQuery)}` : "/api/admin";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSubmissions(data.submissions || []);
        setClaims(data.claims || []);
        setJournals(data.journals || []);
        setForumTopics(data.forumTopics || []);
        setPosts(data.posts || []);
        setComments(data.comments || []);
        setUsers(data.users || []);
        setPayments(data.payments || []);
        if (data.journals && data.journals.length > 0 && !harvestForm.journalId) {
          setHarvestForm(prev => ({ ...prev, journalId: data.journals[0].id }));
        }
      } else {
        setError(data.error || "Failed to load administrative overview.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reach server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  // 3. Admin Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.replace("/admin/login");
    } catch {
      window.location.href = "/admin/login";
    }
  };

  // -------------------------------------------------------------
  // ACTIONS: Submissions
  // -------------------------------------------------------------
  const handleUpdateSubmission = async (submissionId: string, status: string, qualityGrade = "A", reviewNotes = "") => {
    setActionLoadingId(submissionId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSubmission",
          submissionId,
          status,
          qualityGrade,
          reviewNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Submission marked as ${status}.`);
        setSelectedSubmission(null);
        fetchAdminData();
      } else {
        showToast(data.error || "Failed to update submission.", "error");
      }
    } catch {
      showToast("Network error executing submission update.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // -------------------------------------------------------------
  // ACTIONS: Publication Claims
  // -------------------------------------------------------------
  const handleUpdateClaim = async (claimId: string, status: string) => {
    setActionLoadingId(claimId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateClaim",
          claimId,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Publication claim set to ${status}.`);
        fetchAdminData();
      } else {
        showToast(data.error || "Failed to update claim.", "error");
      }
    } catch {
      showToast("Network error updating claim.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // -------------------------------------------------------------
  // ACTIONS: Journal Edits
  // -------------------------------------------------------------
  const handleUpdateJournal = async (journalId: string, payload: any) => {
    setActionLoadingId(journalId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateJournal",
          journalId,
          ...payload
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Journal updated successfully.");
        fetchAdminData();
      } else {
        showToast(data.error || "Failed to update journal.", "error");
      }
    } catch {
      showToast("Network error updating journal.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // -------------------------------------------------------------
  // ACTIONS: Moderation
  // -------------------------------------------------------------
  const handleModerateForumTopic = async (topicId: string, subAction: "pin" | "unpin" | "lock" | "unlock" | "delete") => {
    setActionLoadingId(topicId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderateForumTopic",
          topicId,
          subAction
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchAdminData();
      } else {
        showToast(data.error || "Action failed.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    setActionLoadingId(postId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderatePost",
          postId
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Social feed post removed.");
        fetchAdminData();
      } else {
        showToast(data.error || "Failed to remove post.", "error");
      }
    } catch {
      showToast("Network error removing post.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setActionLoadingId(commentId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteJournalComment",
          commentId
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Journal comment deleted.");
        fetchAdminData();
      } else {
        showToast(data.error || "Failed to delete comment.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // -------------------------------------------------------------
  // ACTIONS: User Management
  // -------------------------------------------------------------
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateUserRole",
          userId,
          newRole
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchAdminData();
      } else {
        showToast(data.error || "Failed to change user role.", "error");
      }
    } catch {
      showToast("Network error.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete User Account",
      description: `Are you certain you want to delete user account "${email}"? This permanently unlinks their submissions and profile.`,
      confirmLabel: "Delete Account",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setActionLoadingId(userId);
        try {
          const res = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "deleteUser",
              userId
            })
          });
          const data = await res.json();
          if (data.success) {
            showToast(`User ${email} deleted.`);
            fetchAdminData();
          } else {
            showToast(data.error || "Failed to delete user.", "error");
          }
        } catch {
          showToast("Network error.", "error");
        } finally {
          setActionLoadingId(null);
        }
      }
    });
  };

  // -------------------------------------------------------------
  // ACTIONS: OAI Harvester & Metrics Engine
  // -------------------------------------------------------------
  const handleRunHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!harvestForm.journalId || !harvestForm.oaiUrl) {
      showToast("Please provide both target journal and OAI URL.", "error");
      return;
    }

    setHarvestLoading(true);
    setHarvestResult(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "triggerOaiHarvest",
          ...harvestForm
        })
      });
      const data = await res.json();
      if (data.success) {
        setHarvestResult(data);
        showToast(data.message || "Harvest executed successfully!");
        fetchAdminData();
      } else {
        showToast(data.error || "Harvest failed.", "error");
      }
    } catch {
      showToast("Network error during harvest execution.", "error");
    } finally {
      setHarvestLoading(false);
    }
  };

  const handleRecalculateMetrics = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Recalculate AJCI Metrics",
      description: "This executes the annual bibliometric calculation engine across all indexed journals, updating citations, regional scores, and quartile rankings (Q1-Q4).",
      confirmLabel: "Execute Recalculation",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setMetricsLoading(true);
        try {
          const res = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "triggerMetricsRecalculation" })
          });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            fetchAdminData();
          } else {
            showToast(data.error || "Metrics engine error.", "error");
          }
        } catch {
          showToast("Failed to run metrics engine.", "error");
        } finally {
          setMetricsLoading(false);
        }
      }
    });
  };

  // -------------------------------------------------------------
  // Filtered & Paginated Views
  // -------------------------------------------------------------
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const q = subSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        sub.journalName?.toLowerCase().includes(q) ||
        sub.issn?.toLowerCase().includes(q) ||
        sub.submitter?.name?.toLowerCase().includes(q) ||
        sub.submitter?.email?.toLowerCase().includes(q) ||
        sub.country?.toLowerCase().includes(q);

      const matchStatus = subStatusFilter === "ALL" || sub.status === subStatusFilter;
      const matchCountry = subCountryFilter === "ALL" || sub.country === subCountryFilter;

      return matchSearch && matchStatus && matchCountry;
    });
  }, [submissions, subSearch, subStatusFilter, subCountryFilter]);

  const pagedSubmissions = useMemo(() => {
    const start = (subPage - 1) * subPageSize;
    return filteredSubmissions.slice(start, start + subPageSize);
  }, [filteredSubmissions, subPage, subPageSize]);

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const q = claimSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.user?.name?.toLowerCase().includes(q) ||
        c.user?.email?.toLowerCase().includes(q) ||
        c.article?.title?.toLowerCase().includes(q) ||
        c.article?.doi?.toLowerCase().includes(q);

      const matchStatus = claimStatusFilter === "ALL" || c.status === claimStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [claims, claimSearch, claimStatusFilter]);

  const pagedClaims = useMemo(() => {
    const start = (claimPage - 1) * claimPageSize;
    return filteredClaims.slice(start, start + claimPageSize);
  }, [filteredClaims, claimPage, claimPageSize]);

  const filteredJournals = useMemo(() => {
    return journals.filter(j => {
      const q = journalSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        j.name?.toLowerCase().includes(q) ||
        j.issn?.toLowerCase().includes(q) ||
        j.country?.toLowerCase().includes(q) ||
        j.publisherName?.toLowerCase().includes(q);

      const matchIndexed =
        journalIndexedFilter === "ALL" ||
        (journalIndexedFilter === "INDEXED" && j.isIndexed) ||
        (journalIndexedFilter === "UNINDEXED" && !j.isIndexed);

      const matchPaid =
        journalPaidFilter === "ALL" ||
        (journalPaidFilter === "PAID" && j.certificatePaid) ||
        (journalPaidFilter === "UNPAID" && !j.certificatePaid);

      const matchIndexingBody =
        journalIndexingBodyFilter === "ALL" ||
        (journalIndexingBodyFilter === "SCOPUS" && j.isScopusIndexed) ||
        (journalIndexingBodyFilter === "WOS" && j.isWosIndexed) ||
        (journalIndexingBodyFilter === "BOTH" && j.isScopusIndexed && j.isWosIndexed) ||
        (journalIndexingBodyFilter === "NEITHER" && !j.isScopusIndexed && !j.isWosIndexed);

      const matchCountry = journalCountryFilter === "ALL" || j.country === journalCountryFilter;

      return matchSearch && matchIndexed && matchPaid && matchIndexingBody && matchCountry;
    });
  }, [journals, journalSearch, journalIndexedFilter, journalPaidFilter, journalIndexingBodyFilter, journalCountryFilter]);

  const pagedJournals = useMemo(() => {
    const start = (journalPage - 1) * journalPageSize;
    return filteredJournals.slice(start, start + journalPageSize);
  }, [filteredJournals, journalPage, journalPageSize]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = userSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.institution?.toLowerCase().includes(q);

      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const pagedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  // Loading Screen
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#090d16", color: "#94a3b8" }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "#10b981", fontSize: "2rem", marginBottom: "1rem" }}></i>
        <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>Loading Editorial Command Center...</p>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Toast Notification */}
      {toast && (
        <div className="admin-toast" style={{
          background: toast.type === "success" ? "#064e3b" : toast.type === "error" ? "#7f1d1d" : "#0f172a",
          border: `1px solid ${toast.type === "success" ? "#059669" : toast.type === "error" ? "#b91c1c" : "#334155"}`,
          color: "#ffffff"
        }}>
          <i className={toast.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"} style={{ color: toast.type === "success" ? "#34d399" : "#f87171" }}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box" style={{ maxWidth: "440px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.5rem" }}>{confirmDialog.title}</h3>
            <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 1.5rem" }}>{confirmDialog.description}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="admin-btn admin-btn-danger"
                style={{ background: "#ef4444", color: "#ffffff" }}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Review Modal */}
      {selectedSubmission && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #1e293b", paddingBottom: "1rem" }}>
              <div>
                <span className="admin-badge admin-badge-success">{selectedSubmission.status}</span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0.5rem 0 0.2rem" }}>
                  {selectedSubmission.journalName}
                </h3>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>
                  Publisher: {selectedSubmission.publisherName} • {selectedSubmission.country}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.1rem" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ background: "#090e1a", padding: "0.75rem", borderRadius: "10px", border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>ISSN / E-ISSN</div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#f1f5f9", marginTop: "2px" }}>
                    {selectedSubmission.issn || "N/A"} / {selectedSubmission.eissn || "N/A"}
                  </div>
                </div>
                <div style={{ background: "#090e1a", padding: "0.75rem", borderRadius: "10px", border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Frequency</div>
                  <div style={{ fontSize: "0.85rem", color: "#f1f5f9", marginTop: "2px" }}>
                    {selectedSubmission.frequency || "Quarterly"}
                  </div>
                </div>
              </div>

              <div style={{ background: "#090e1a", padding: "0.75rem", borderRadius: "10px", border: "1px solid #1e293b" }}>
                <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>Submitter Profile</div>
                <div style={{ fontSize: "0.85rem", color: "#f1f5f9", fontWeight: 600 }}>
                  {selectedSubmission.submitter?.name} ({selectedSubmission.submitter?.email})
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {selectedSubmission.submitter?.institution || "No institution specified"}
                </div>
              </div>

              {selectedSubmission.websiteUrl && (
                <div style={{ background: "#090e1a", padding: "0.75rem", borderRadius: "10px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", marginRight: "1rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Official Website</div>
                    <div style={{ fontSize: "0.8rem", color: "#34d399", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {selectedSubmission.websiteUrl}
                    </div>
                  </div>
                  <a
                    href={selectedSubmission.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> Visit
                  </a>
                </div>
              )}

              {selectedSubmission.pdfFileUrl && (
                <div style={{ background: "#090e1a", padding: "0.75rem", borderRadius: "10px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Dossier Document</div>
                    <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Attached verification proof / PDF</div>
                  </div>
                  <a
                    href={selectedSubmission.pdfFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn admin-btn-sm"
                    style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.4)" }}
                  >
                    <i className="fa-solid fa-file-pdf"></i> Open PDF
                  </a>
                </div>
              )}

              <div>
                <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Journal Scope</div>
                <div style={{ fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.5, background: "#090e1a", padding: "0.75rem", borderRadius: "10px", border: "1px solid #1e293b" }}>
                  {selectedSubmission.description || "No description provided."}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>
                  Append Editorial Note / Audit Finding
                </label>
                <textarea
                  rows={3}
                  value={subReviewNotes}
                  onChange={(e) => setSubReviewNotes(e.target.value)}
                  placeholder="Record compliance conditions or audit rationale..."
                  className="admin-textarea"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>
                  Quality Grade
                </label>
                <select
                  value={subQualityGrade}
                  onChange={(e) => setSubQualityGrade(e.target.value)}
                  className="admin-select"
                >
                  <option value="A+">Grade A+ (Exemplary Standard)</option>
                  <option value="A">Grade A (High Academic Standard)</option>
                  <option value="B">Grade B (Developing Academic Standard)</option>
                  <option value="C">Grade C (Provisional Evaluation)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e293b", paddingTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="admin-btn admin-btn-secondary"
              >
                Close
              </button>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  disabled={actionLoadingId === selectedSubmission.id}
                  onClick={() => handleUpdateSubmission(selectedSubmission.id, "REJECTED", subQualityGrade, subReviewNotes)}
                  className="admin-btn admin-btn-danger"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === selectedSubmission.id}
                  onClick={() => handleUpdateSubmission(selectedSubmission.id, "UNDER_REVIEW", subQualityGrade, subReviewNotes)}
                  className="admin-btn"
                  style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.4)" }}
                >
                  Under Review
                </button>
                <button
                  type="button"
                  disabled={actionLoadingId === selectedSubmission.id}
                  onClick={() => handleUpdateSubmission(selectedSubmission.id, "ACCEPTED", subQualityGrade, subReviewNotes)}
                  className="admin-btn admin-btn-primary"
                >
                  <i className="fa-solid fa-check"></i> Approve & Index
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION                                            */}
      {/* ------------------------------------------------------------- */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div>
          {/* Brand Heading */}
          <div className="admin-sidebar-header">
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #10b981 0%, #047857 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "0.95rem" }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", display: "block", lineHeight: 1.1 }}>AfriJournal</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Admin Console</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem" }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="admin-sidebar-nav">
            <div className="admin-nav-category">Operations</div>

            <button
              onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}
              className={`admin-nav-btn ${activeTab === "overview" ? "active" : ""}`}
            >
              <span><i className="fa-solid fa-gauge-high" style={{ width: "20px" }}></i> Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab("submissions"); setSidebarOpen(false); }}
              className={`admin-nav-btn ${activeTab === "submissions" ? "active" : ""}`}
            >
              <span><i className="fa-solid fa-file-signature" style={{ width: "20px" }}></i> Submissions</span>
              {stats?.pendingSubmissions ? (
                <span className="admin-badge admin-badge-warning">{stats.pendingSubmissions}</span>
              ) : null}
            </button>

            <button
              onClick={() => { setActiveTab("claims"); setSidebarOpen(false); }}
              className={`admin-nav-btn ${activeTab === "claims" ? "active" : ""}`}
            >
              <span><i className="fa-solid fa-user-check" style={{ width: "20px" }}></i> Author Claims</span>
              {stats?.pendingClaims ? (
                <span className="admin-badge admin-badge-info">{stats.pendingClaims}</span>
              ) : null}
            </button>

            <button
              onClick={() => { setActiveTab("journals"); setSidebarOpen(false); }}
              className={`admin-nav-btn ${activeTab === "journals" ? "active" : ""}`}
            >
              <span><i className="fa-solid fa-book" style={{ width: "20px" }}></i> Journals Catalog</span>
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace" }}>{stats?.totalJournals || 0}</span>
            </button>

            <div className="admin-nav-category">Community & Safety</div>

            <button
              onClick={() => { setActiveTab("moderation"); setSidebarOpen(false); }}
              className={`admin-nav-btn ${activeTab === "moderation" ? "active" : ""}`}
            >
              <span><i className="fa-solid fa-gavel" style={{ width: "20px" }}></i> Moderation Desk</span>
              <span className="admin-badge admin-badge-neutral">
                {(stats?.totalForumTopics || 0) + (stats?.totalPosts || 0)}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("users"); setSidebarOpen(false); }}
              className={`admin-nav-btn ${activeTab === "users" ? "active" : ""}`}
            >
              <span><i className="fa-solid fa-users" style={{ width: "20px" }}></i> User Directory</span>
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace" }}>{stats?.totalUsers || 0}</span>
            </button>

            <div className="admin-nav-category">Engines & Billing</div>

            <button
              onClick={() => { setActiveTab("harvester"); setSidebarOpen(false); }}
              className={`admin-nav-btn ${activeTab === "harvester" ? "active" : ""}`}
            >
              <span><i className="fa-solid fa-network-wired" style={{ width: "20px" }}></i> OAI & Metrics</span>
            </button>

            <button
              onClick={() => { setActiveTab("payments"); setSidebarOpen(false); }}
              className={`admin-nav-btn ${activeTab === "payments" ? "active" : ""}`}
            >
              <span><i className="fa-solid fa-credit-card" style={{ width: "20px" }}></i> Payments Ledger</span>
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "monospace" }}>{payments.length}</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="admin-sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", marginRight: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff", flexShrink: 0 }}>
              {currentUser?.email?.substring(0, 2).toUpperCase() || "AD"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser?.name || "Chief Admin"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Terminate Admin Session"
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.95rem", padding: "4px" }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA                                             */}
      {/* ------------------------------------------------------------- */}
      <div className="admin-main-wrap">
        {/* Top Header */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "1.1rem" }}
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              <span>Console</span> <span style={{ color: "#475569" }}>/</span> <strong style={{ color: "#ffffff", textTransform: "capitalize" }}>{activeTab}</strong>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="admin-badge admin-badge-success" style={{ padding: "0.3rem 0.65rem" }}>
              <i className="fa-solid fa-circle" style={{ fontSize: "0.45rem" }}></i> Live Node
            </span>

            <button
              onClick={() => fetchAdminData()}
              disabled={refreshing}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              <i className={`fa-solid fa-arrows-rotate ${refreshing ? "fa-spin" : ""}`}></i>
              <span>Refresh</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              <span>Public Site</span>
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
            </Link>
          </div>
        </header>

        {/* Tab Content */}
        <main className="admin-content">
          {error && (
            <div style={{ background: "#7f1d1d", border: "1px solid #b91c1c", color: "#fecaca", padding: "0.85rem 1rem", borderRadius: "12px", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "transparent", border: "none", color: "#fecaca", cursor: "pointer", fontWeight: 700 }}>Dismiss</button>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: EXECUTIVE OVERVIEW                                 */}
          {/* ========================================================= */}
          {activeTab === "overview" && (
            <div>
              {/* Metric KPI Cards */}
              <div className="admin-kpi-grid">
                <div className="admin-kpi-card">
                  <div className="admin-kpi-title">
                    <span>Indexed Journals</span>
                    <i className="fa-solid fa-book-bookmark" style={{ color: "#10b981" }}></i>
                  </div>
                  <div className="admin-kpi-value">
                    {stats?.indexedJournals || 0}
                    <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500, marginLeft: "6px" }}>/ {stats?.totalJournals || 0}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                    <span>Paid Certificates</span>
                    <strong style={{ color: "#10b981" }}>{stats?.paidCertificates || 0}</strong>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
                    <span>Scopus / WoS Indexed</span>
                    <span style={{ color: "#fbbf24", fontWeight: 700 }}>{stats?.scopusJournals || 0} / {stats?.wosJournals || 0}</span>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-title">
                    <span>Pending Submissions</span>
                    <i className="fa-solid fa-clock" style={{ color: "#f59e0b" }}></i>
                  </div>
                  <div className="admin-kpi-value" style={{ color: "#fbbf24" }}>
                    {stats?.pendingSubmissions || 0}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                    <span>Total Submissions</span>
                    <span>{stats?.totalSubmissions || 0}</span>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-title">
                    <span>Pending Author Claims</span>
                    <i className="fa-solid fa-user-check" style={{ color: "#38bdf8" }}></i>
                  </div>
                  <div className="admin-kpi-value" style={{ color: "#38bdf8" }}>
                    {stats?.pendingClaims || 0}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                    <span>Total Claim Records</span>
                    <span>{stats?.totalClaims || 0}</span>
                  </div>
                </div>

                <div className="admin-kpi-card">
                  <div className="admin-kpi-title">
                    <span>Scholarly Community</span>
                    <i className="fa-solid fa-users" style={{ color: "#a855f7" }}></i>
                  </div>
                  <div className="admin-kpi-value">
                    {stats?.totalUsers || 0}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                    <span>Forum Topics / Posts</span>
                    <span style={{ color: "#d8b4fe", fontFamily: "monospace" }}>{(stats?.totalForumTopics || 0)} / {(stats?.totalPosts || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Action Banner Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>Submissions Review Queue</h4>
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0 0 1rem", maxWidth: "300px" }}>
                      {stats?.pendingSubmissions || 0} journals are awaiting editorial evaluation and quality grading.
                    </p>
                    <button
                      onClick={() => setActiveTab("submissions")}
                      className="admin-btn admin-btn-primary admin-btn-sm"
                    >
                      Open Submissions Queue →
                    </button>
                  </div>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                    <i className="fa-solid fa-clipboard-check"></i>
                  </div>
                </div>

                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>Community Moderation Desk</h4>
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0 0 1rem", maxWidth: "300px" }}>
                      Audit forum discourse topics, scholar social updates, and public reviews across all journals.
                    </p>
                    <button
                      onClick={() => setActiveTab("moderation")}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      Open Moderation Desk →
                    </button>
                  </div>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(168, 85, 247, 0.15)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                </div>
              </div>

              {/* Recent Mini-Tables */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
                {/* Recent Submissions */}
                <div className="admin-table-container" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>Latest Submissions</h4>
                    <button onClick={() => setActiveTab("submissions")} style={{ background: "transparent", border: "none", color: "#34d399", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>View All</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {submissions.slice(0, 5).map(sub => (
                      <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #141e33", fontSize: "0.8rem" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", marginRight: "0.75rem" }}>
                          <div style={{ fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.journalName}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{sub.country} • {sub.submitter?.name}</div>
                        </div>
                        <span className={`admin-badge ${sub.status === "ACCEPTED" ? "admin-badge-success" : sub.status === "REJECTED" ? "admin-badge-danger" : "admin-badge-warning"}`}>
                          {sub.status}
                        </span>
                      </div>
                    ))}
                    {submissions.length === 0 && (
                      <div style={{ textAlign: "center", padding: "1rem", color: "#64748b", fontSize: "0.8rem" }}>No submissions found.</div>
                    )}
                  </div>
                </div>

                {/* Recent Author Claims */}
                <div className="admin-table-container" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>Recent Publication Claims</h4>
                    <button onClick={() => setActiveTab("claims")} style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>View All</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {claims.slice(0, 5).map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid #141e33", fontSize: "0.8rem" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", marginRight: "0.75rem" }}>
                          <div style={{ fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.article?.title || "Article Claim"}</div>
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{c.user?.name} ({c.user?.institution || "Independent"})</div>
                        </div>
                        <span className={`admin-badge ${c.status === "VERIFIED" ? "admin-badge-success" : "admin-badge-info"}`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                    {claims.length === 0 && (
                      <div style={{ textAlign: "center", padding: "1rem", color: "#64748b", fontSize: "0.8rem" }}>No claims found.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: SUBMISSIONS DESK                                   */}
          {/* ========================================================= */}
          {activeTab === "submissions" && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>Editorial Submissions Queue</h3>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Evaluate, audit, and approve African journal indexation applications.</p>
              </div>

              {/* Filters */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <input
                    type="text"
                    value={subSearch}
                    onChange={(e) => { setSubSearch(e.target.value); setSubPage(1); }}
                    placeholder="Search journal name, submitter, ISSN..."
                    className="admin-input"
                  />
                </div>

                <div style={{ width: "160px" }}>
                  <select
                    value={subStatusFilter}
                    onChange={(e) => { setSubStatusFilter(e.target.value); setSubPage(1); }}
                    className="admin-select"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="ACCEPTED">Accepted / Indexed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div style={{ width: "180px" }}>
                  <select
                    value={subCountryFilter}
                    onChange={(e) => { setSubCountryFilter(e.target.value); setSubPage(1); }}
                    className="admin-select"
                  >
                    <option value="ALL">All Countries</option>
                    {ALL_COUNTRY_NAMES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submissions Table */}
              <div className="admin-table-container">
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Journal & Country</th>
                        <th>ISSN</th>
                        <th>Submitter</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedSubmissions.map(sub => (
                        <tr key={sub.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{sub.journalName}</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{sub.country} • {sub.publisherName}</div>
                          </td>
                          <td style={{ fontFamily: "monospace" }}>
                            {sub.issn || sub.eissn || "—"}
                          </td>
                          <td>
                            <div style={{ color: "#f1f5f9" }}>{sub.submitter?.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{sub.submitter?.email}</div>
                          </td>
                          <td style={{ color: "#94a3b8" }}>
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <span className={`admin-badge ${sub.status === "ACCEPTED" ? "admin-badge-success" : sub.status === "REJECTED" ? "admin-badge-danger" : "admin-badge-warning"}`}>
                              {sub.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setSubReviewNotes(sub.evaluationLog || "");
                              }}
                              className="admin-btn admin-btn-primary admin-btn-sm"
                            >
                              <i className="fa-solid fa-magnifying-glass"></i> Review & Audit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {pagedSubmissions.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                            No submissions match the current filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredSubmissions.length > subPageSize && (
                  <div style={{ padding: "0.85rem 1rem", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#94a3b8" }}>
                    <div>
                      Showing {(subPage - 1) * subPageSize + 1} to {Math.min(subPage * subPageSize, filteredSubmissions.length)} of {filteredSubmissions.length}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        disabled={subPage === 1}
                        onClick={() => setSubPage(p => p - 1)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Previous
                      </button>
                      <button
                        disabled={subPage * subPageSize >= filteredSubmissions.length}
                        onClick={() => setSubPage(p => p + 1)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CLAIMS AUDIT DESK                                  */}
          {/* ========================================================= */}
          {activeTab === "claims" && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>Researcher Authorship Claims</h3>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Verify scholars claiming author credentials on indexed articles.</p>
              </div>

              {/* Filters */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <input
                    type="text"
                    value={claimSearch}
                    onChange={(e) => { setClaimSearch(e.target.value); setClaimPage(1); }}
                    placeholder="Search researcher name, article title, DOI..."
                    className="admin-input"
                  />
                </div>

                <div style={{ width: "180px" }}>
                  <select
                    value={claimStatusFilter}
                    onChange={(e) => { setClaimStatusFilter(e.target.value); setClaimPage(1); }}
                    className="admin-select"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING_AUDIT">Pending Audit</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Claims Table */}
              <div className="admin-table-container">
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Researcher</th>
                        <th>Claimed Article</th>
                        <th>Journal & DOI</th>
                        <th>Claim Date</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedClaims.map(c => (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{c.user?.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{c.user?.institution || "Independent"}</div>
                            {c.user?.orcid && <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#10b981" }}>ORCID: {c.user.orcid}</div>}
                          </td>
                          <td style={{ maxWidth: "260px" }}>
                            <div style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.article?.title}</div>
                          </td>
                          <td>
                            <div style={{ color: "#cbd5e1" }}>{c.article?.journal?.name}</div>
                            {c.article?.doi && (
                              <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#64748b" }}>DOI: {c.article.doi}</div>
                            )}
                          </td>
                          <td style={{ color: "#94a3b8" }}>
                            {new Date(c.claimedAt).toLocaleDateString()}
                          </td>
                          <td>
                            <span className={`admin-badge ${c.status === "VERIFIED" ? "admin-badge-success" : c.status === "REJECTED" ? "admin-badge-danger" : "admin-badge-info"}`}>
                              {c.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            {c.status !== "VERIFIED" && (
                              <button
                                disabled={actionLoadingId === c.id}
                                onClick={() => handleUpdateClaim(c.id, "VERIFIED")}
                                className="admin-btn admin-btn-primary admin-btn-sm"
                                style={{ marginRight: "4px" }}
                              >
                                Verify
                              </button>
                            )}
                            {c.status !== "REJECTED" && (
                              <button
                                disabled={actionLoadingId === c.id}
                                onClick={() => handleUpdateClaim(c.id, "REJECTED")}
                                className="admin-btn admin-btn-danger admin-btn-sm"
                              >
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {pagedClaims.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                            No publication claims found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: JOURNALS DIRECTORY                                 */}
          {/* ========================================================= */}
          {activeTab === "journals" && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>Journals Catalog Directory</h3>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Configure indexation status, quality grades, and subscription tiers.</p>
              </div>

              {/* Filters */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <input
                    type="text"
                    value={journalSearch}
                    onChange={(e) => { setJournalSearch(e.target.value); setJournalPage(1); }}
                    placeholder="Search journal name, publisher, ISSN..."
                    className="admin-input"
                  />
                </div>

                <div style={{ width: "150px" }}>
                  <select
                    value={journalIndexedFilter}
                    onChange={(e) => { setJournalIndexedFilter(e.target.value); setJournalPage(1); }}
                    className="admin-select"
                  >
                    <option value="ALL">All Index Status</option>
                    <option value="INDEXED">Indexed Only</option>
                    <option value="UNINDEXED">Unindexed Only</option>
                  </select>
                </div>

                <div style={{ width: "150px" }}>
                  <select
                    value={journalPaidFilter}
                    onChange={(e) => { setJournalPaidFilter(e.target.value); setJournalPage(1); }}
                    className="admin-select"
                  >
                    <option value="ALL">All Certificate</option>
                    <option value="PAID">Certificate Paid</option>
                    <option value="UNPAID">Certificate Unpaid</option>
                  </select>
                </div>

                <div style={{ width: "160px" }}>
                  <select
                    value={journalIndexingBodyFilter}
                    onChange={(e) => { setJournalIndexingBodyFilter(e.target.value); setJournalPage(1); }}
                    className="admin-select"
                  >
                    <option value="ALL">All Global Indexes</option>
                    <option value="SCOPUS">Scopus Indexed ({stats?.scopusJournals || 0})</option>
                    <option value="WOS">Web of Science</option>
                    <option value="BOTH">Scopus &amp; WoS</option>
                    <option value="NEITHER">Neither</option>
                  </select>
                </div>

                <div style={{ width: "160px" }}>
                  <select
                    value={journalCountryFilter}
                    onChange={(e) => { setJournalCountryFilter(e.target.value); setJournalPage(1); }}
                    className="admin-select"
                  >
                    <option value="ALL">All Countries</option>
                    {ALL_COUNTRY_NAMES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="admin-table-container">
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Journal Name & Country</th>
                        <th>ISSN</th>
                        <th>Grade</th>
                        <th>Tier</th>
                        <th>Indexed</th>
                        <th>Scopus</th>
                        <th>WoS</th>
                        <th>Certificate</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedJournals.map(j => (
                        <tr key={j.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{j.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{j.country} • {j.publisherName}</div>
                          </td>
                          <td style={{ fontFamily: "monospace" }}>
                            {j.issn || j.eissn || "—"}
                          </td>
                          <td>
                            <select
                              value={j.qualityGrade || "A"}
                              disabled={actionLoadingId === j.id}
                              onChange={(e) => handleUpdateJournal(j.id, { qualityGrade: e.target.value })}
                              className="admin-select"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem", width: "auto" }}
                            >
                              <option value="A+">A+</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                            </select>
                          </td>
                          <td>
                            <select
                              value={j.activeTier || "FREE"}
                              disabled={actionLoadingId === j.id}
                              onChange={(e) => handleUpdateJournal(j.id, { activeTier: e.target.value })}
                              className="admin-select"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem", width: "auto" }}
                            >
                              <option value="FREE">FREE</option>
                              <option value="BASIC">BASIC</option>
                              <option value="PREMIUM">PREMIUM</option>
                            </select>
                          </td>
                          <td>
                            <button
                              disabled={actionLoadingId === j.id}
                              onClick={() => handleUpdateJournal(j.id, { isIndexed: !j.isIndexed })}
                              className={`admin-badge ${j.isIndexed ? "admin-badge-success" : "admin-badge-neutral"}`}
                              style={{ cursor: "pointer", border: "none" }}
                            >
                              {j.isIndexed ? "Indexed ✓" : "Unindexed"}
                            </button>
                          </td>
                          <td>
                            <button
                              disabled={actionLoadingId === j.id}
                              onClick={() => handleUpdateJournal(j.id, { isScopusIndexed: !j.isScopusIndexed })}
                              className={`admin-badge ${j.isScopusIndexed ? "admin-badge-warning" : "admin-badge-neutral"}`}
                              style={{ cursor: "pointer", border: "none" }}
                              title="Toggle Scopus Indexing Status"
                            >
                              {j.isScopusIndexed ? "Scopus ✓" : "No"}
                            </button>
                          </td>
                          <td>
                            <button
                              disabled={actionLoadingId === j.id}
                              onClick={() => handleUpdateJournal(j.id, { isWosIndexed: !j.isWosIndexed })}
                              className={`admin-badge ${j.isWosIndexed ? "admin-badge-info" : "admin-badge-neutral"}`}
                              style={{ cursor: "pointer", border: "none" }}
                              title="Toggle Web of Science Indexing Status"
                            >
                              {j.isWosIndexed ? "WoS ✓" : "No"}
                            </button>
                          </td>
                          <td>
                            <button
                              disabled={actionLoadingId === j.id}
                              onClick={() => handleUpdateJournal(j.id, { certificatePaid: !j.certificatePaid })}
                              className={`admin-badge ${j.certificatePaid ? "admin-badge-success" : "admin-badge-neutral"}`}
                              style={{ cursor: "pointer", border: "none" }}
                            >
                              {j.certificatePaid ? "Paid ✓" : "Unpaid"}
                            </button>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Link
                              href={`/journal/${j.id}`}
                              target="_blank"
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square"></i> View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredJournals.length > journalPageSize && (
                  <div style={{ padding: "0.85rem 1rem", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#94a3b8" }}>
                    <div>
                      Showing {(journalPage - 1) * journalPageSize + 1} to {Math.min(journalPage * journalPageSize, filteredJournals.length)} of {filteredJournals.length}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        disabled={journalPage === 1}
                        onClick={() => setJournalPage(p => p - 1)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Previous
                      </button>
                      <button
                        disabled={journalPage * journalPageSize >= filteredJournals.length}
                        onClick={() => setJournalPage(p => p + 1)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: MODERATION DESK                                    */}
          {/* ========================================================= */}
          {activeTab === "moderation" && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>Community Moderation Desk</h3>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Review and moderate discourse topics, social feed publications, and user reviews.</p>
              </div>

              {/* Sub-tab selection */}
              <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid #1e293b", marginBottom: "1rem" }}>
                <button
                  onClick={() => setModerationSubTab("forum")}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: moderationSubTab === "forum" ? "2px solid #10b981" : "2px solid transparent",
                    color: moderationSubTab === "forum" ? "#10b981" : "#94a3b8",
                    padding: "0.6rem 0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Forum Topics ({forumTopics.length})
                </button>
                <button
                  onClick={() => setModerationSubTab("posts")}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: moderationSubTab === "posts" ? "2px solid #10b981" : "2px solid transparent",
                    color: moderationSubTab === "posts" ? "#10b981" : "#94a3b8",
                    padding: "0.6rem 0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Scholar Feed Posts ({posts.length})
                </button>
                <button
                  onClick={() => setModerationSubTab("comments")}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: moderationSubTab === "comments" ? "2px solid #10b981" : "2px solid transparent",
                    color: moderationSubTab === "comments" ? "#10b981" : "#94a3b8",
                    padding: "0.6rem 0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Journal Comments ({comments.length})
                </button>
              </div>

              {/* Moderation: Forum Topics */}
              {moderationSubTab === "forum" && (
                <div className="admin-table-container">
                  <div className="admin-table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Topic Title & Category</th>
                          <th>Author</th>
                          <th>Replies</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th style={{ textAlign: "right" }}>Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forumTopics.map(topic => (
                          <tr key={topic.id}>
                            <td style={{ maxWidth: "280px" }}>
                              <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{topic.title}</div>
                              <div style={{ fontSize: "0.72rem", color: "#10b981" }}>Category: {topic.category?.name}</div>
                            </td>
                            <td>
                              <div style={{ color: "#f1f5f9" }}>{topic.author?.name}</div>
                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{topic.author?.email}</div>
                            </td>
                            <td style={{ fontFamily: "monospace" }}>
                              {topic._count?.replies || 0}
                            </td>
                            <td>
                              {topic.isPinned && <span className="admin-badge admin-badge-warning" style={{ marginRight: "4px" }}>Pinned</span>}
                              {topic.isLocked && <span className="admin-badge admin-badge-danger" style={{ marginRight: "4px" }}>Locked</span>}
                              {!topic.isPinned && !topic.isLocked && <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Active</span>}
                            </td>
                            <td style={{ color: "#94a3b8" }}>
                              {new Date(topic.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <button
                                disabled={actionLoadingId === topic.id}
                                onClick={() => handleModerateForumTopic(topic.id, topic.isPinned ? "unpin" : "pin")}
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                style={{ marginRight: "4px" }}
                              >
                                {topic.isPinned ? "Unpin" : "Pin"}
                              </button>
                              <button
                                disabled={actionLoadingId === topic.id}
                                onClick={() => handleModerateForumTopic(topic.id, topic.isLocked ? "unlock" : "lock")}
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                                style={{ marginRight: "4px" }}
                              >
                                {topic.isLocked ? "Unlock" : "Lock"}
                              </button>
                              <button
                                disabled={actionLoadingId === topic.id}
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: "Delete Forum Topic",
                                    description: `Are you sure you want to permanently delete "${topic.title}" and all its replies?`,
                                    confirmLabel: "Delete Topic",
                                    onConfirm: () => {
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      handleModerateForumTopic(topic.id, "delete");
                                    }
                                  });
                                }}
                                className="admin-btn admin-btn-danger admin-btn-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {forumTopics.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No forum topics found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Moderation: Scholar Posts */}
              {moderationSubTab === "posts" && (
                <div className="admin-table-container">
                  <div className="admin-table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Author</th>
                          <th>Post Type & Content</th>
                          <th>Attachment</th>
                          <th>Stats</th>
                          <th>Date</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map(post => (
                          <tr key={post.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{post.author?.name}</div>
                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{post.author?.email}</div>
                            </td>
                            <td style={{ maxWidth: "340px" }}>
                              <span className="admin-badge admin-badge-info" style={{ marginRight: "6px" }}>{post.postType}</span>
                              {post.title && <strong style={{ color: "#f1f5f9" }}>{post.title} </strong>}
                              <p style={{ margin: "4px 0 0", color: "#cbd5e1", fontSize: "0.8rem", lineHeight: 1.4 }}>{post.content}</p>
                            </td>
                            <td>
                              {post.attachmentUrl ? (
                                <a href={post.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: "#10b981", fontSize: "0.75rem", textDecoration: "none" }}>
                                  <i className="fa-solid fa-file-pdf"></i> PDF Document
                                </a>
                              ) : (
                                <span style={{ color: "#64748b", fontSize: "0.75rem" }}>None</span>
                              )}
                            </td>
                            <td style={{ fontFamily: "monospace", color: "#94a3b8" }}>
                              {post._count?.likes || 0} likes • {post._count?.comments || 0} comments
                            </td>
                            <td style={{ color: "#94a3b8" }}>
                              {new Date(post.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                disabled={actionLoadingId === post.id}
                                onClick={() => {
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: "Delete Scholar Post",
                                    description: "Permanently delete this social post and all attached user comments?",
                                    confirmLabel: "Delete Post",
                                    onConfirm: () => {
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      handleDeletePost(post.id);
                                    }
                                  });
                                }}
                                className="admin-btn admin-btn-danger admin-btn-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {posts.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No social posts found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Moderation: Journal Comments */}
              {moderationSubTab === "comments" && (
                <div className="admin-table-container">
                  <div className="admin-table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Author</th>
                          <th>Journal</th>
                          <th>Comment</th>
                          <th>Date</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comments.map(c => (
                          <tr key={c.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{c.author?.name}</div>
                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{c.author?.email}</div>
                            </td>
                            <td style={{ color: "#10b981", fontWeight: 600 }}>
                              {c.journal?.name}
                            </td>
                            <td style={{ maxWidth: "340px", color: "#cbd5e1" }}>
                              {c.content}
                            </td>
                            <td style={{ color: "#94a3b8" }}>
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                disabled={actionLoadingId === c.id}
                                onClick={() => handleDeleteComment(c.id)}
                                className="admin-btn admin-btn-danger admin-btn-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {comments.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No journal comments found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: USER DIRECTORY                                     */}
          {/* ========================================================= */}
          {activeTab === "users" && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>User Directory & Permissions</h3>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Inspect registered researchers and publishers; manage platform roles.</p>
              </div>

              {/* Filters */}
              <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                    placeholder="Search name, email, institution..."
                    className="admin-input"
                  />
                </div>

                <div style={{ width: "160px" }}>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                    className="admin-select"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="RESEARCHER">Researchers</option>
                    <option value="PUBLISHER">Publishers</option>
                    <option value="ADMIN">Administrators</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="admin-table-container">
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User Details</th>
                        <th>Institution</th>
                        <th>Bibliometrics</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{u.name}</div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{u.email}</div>
                            {u.orcid && <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "#10b981" }}>ORCID: {u.orcid}</div>}
                          </td>
                          <td style={{ color: "#cbd5e1" }}>
                            {u.institution || "—"}
                          </td>
                          <td style={{ fontFamily: "monospace", color: "#94a3b8" }}>
                            {u.totalCitations || 0} cites • h: {u.hIndex || 0}
                          </td>
                          <td>
                            <span className={`admin-badge ${u.role === "ADMIN" ? "admin-badge-warning" : u.role === "PUBLISHER" ? "admin-badge-info" : "admin-badge-neutral"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ color: "#94a3b8" }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <select
                              value={u.role}
                              disabled={actionLoadingId === u.id || u.email === "kenprokenya@gmail.com"}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              className="admin-select"
                              style={{ padding: "0.25rem 0.5rem", fontSize: "0.78rem", width: "auto", marginRight: "6px" }}
                            >
                              <option value="RESEARCHER">Researcher</option>
                              <option value="PUBLISHER">Publisher</option>
                              <option value="ADMIN">Admin</option>
                            </select>

                            {u.email !== "kenprokenya@gmail.com" && (
                              <button
                                disabled={actionLoadingId === u.id}
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="admin-btn admin-btn-danger admin-btn-sm"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredUsers.length > userPageSize && (
                  <div style={{ padding: "0.85rem 1rem", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#94a3b8" }}>
                    <div>
                      Showing {(userPage - 1) * userPageSize + 1} to {Math.min(userPage * userPageSize, filteredUsers.length)} of {filteredUsers.length}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        disabled={userPage === 1}
                        onClick={() => setUserPage(p => p - 1)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Previous
                      </button>
                      <button
                        disabled={userPage * userPageSize >= filteredUsers.length}
                        onClick={() => setUserPage(p => p + 1)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: HARVESTER & PLATFORM TOOLS                         */}
          {/* ========================================================= */}
          {activeTab === "harvester" && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>OAI-PMH Harvesting & Impact Factor Calibration</h3>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Automated repository ingester and citation impact recalculation workstation.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
                {/* OAI Harvester */}
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      <i className="fa-solid fa-cloud-arrow-down"></i>
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>OAI-PMH Ingestion</h4>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Harvest metadata from OJS / DSpace endpoints.</p>
                    </div>
                  </div>

                  <form onSubmit={handleRunHarvest} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Target Journal</label>
                      <select
                        value={harvestForm.journalId}
                        onChange={(e) => setHarvestForm(prev => ({ ...prev, journalId: e.target.value }))}
                        className="admin-select"
                      >
                        {journals.map(j => (
                          <option key={j.id} value={j.id}>{j.name} ({j.country})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>OAI-PMH Base URL</label>
                      <input
                        type="url"
                        required
                        value={harvestForm.oaiUrl}
                        onChange={(e) => setHarvestForm(prev => ({ ...prev, oaiUrl: e.target.value }))}
                        placeholder="https://example.org/oai"
                        className="admin-input"
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "4px" }}>Limit</label>
                        <input
                          type="number"
                          min="5"
                          max="500"
                          value={harvestForm.limit}
                          onChange={(e) => setHarvestForm(prev => ({ ...prev, limit: parseInt(e.target.value, 10) || 50 }))}
                          className="admin-input"
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", paddingTop: "1.25rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#cbd5e1", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={harvestForm.autoSave}
                            onChange={(e) => setHarvestForm(prev => ({ ...prev, autoSave: e.target.checked }))}
                          />
                          Auto-save Articles
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={harvestLoading}
                      className="admin-btn admin-btn-primary"
                      style={{ marginTop: "0.5rem" }}
                    >
                      {harvestLoading ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin"></i> Harvesting...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-play"></i> Run Harvest Operation
                        </>
                      )}
                    </button>
                  </form>

                  {harvestResult && (
                    <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#090e1a", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", fontSize: "0.8rem" }}>
                      <div style={{ fontWeight: 700, color: "#34d399" }}>Harvest Completed</div>
                      <div style={{ color: "#cbd5e1" }}>Discovered: {harvestResult.recordsCount} records</div>
                      <div style={{ color: "#cbd5e1" }}>Saved: {harvestResult.savedCount} new articles</div>
                    </div>
                  )}
                </div>

                {/* Impact Factor Workbench */}
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(168, 85, 247, 0.15)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                      <i className="fa-solid fa-chart-line"></i>
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>AJCI Impact Factor Engine</h4>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Calculate citation velocity and quartile ranks.</p>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "1rem" }}>
                    Executing this recalculation queries all verified articles published across indexed African journals, cross-references citation records, computes discipline percentiles, and updates the official ranking quartiles ($Q1$, $Q2$, $Q3$, $Q4$).
                  </p>

                  <div style={{ background: "#090e1a", border: "1px solid #1e293b", borderRadius: "10px", padding: "0.85rem", fontSize: "0.78rem", display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                      <span>Formula:</span>
                      <strong style={{ color: "#f1f5f9" }}>2-Year Citation Ratio</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                      <span>Regional Multiplier:</span>
                      <strong style={{ color: "#10b981" }}>1.15x Pan-African Weight</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                      <span>Total Catalog Journals:</span>
                      <strong style={{ color: "#f1f5f9" }}>{stats?.totalJournals || 0}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={metricsLoading}
                    onClick={handleRecalculateMetrics}
                    className="admin-btn"
                    style={{ width: "100%", background: "#a855f7", color: "#ffffff" }}
                  >
                    {metricsLoading ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i> Calculating...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-calculator"></i> Recalculate Platform Impact Factors
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: PAYMENTS & FINANCIAL LEDGER                        */}
          {/* ========================================================= */}
          {activeTab === "payments" && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.25rem" }}>IntaSend Billing & Payment Ledger</h3>
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>Audit indexing certificate receipts and publisher subscription transactions.</p>
              </div>

              {/* Table */}
              <div className="admin-table-container">
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tracking ID</th>
                        <th>Journal</th>
                        <th>Customer Email</th>
                        <th>Tier</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: "monospace", color: "#10b981" }}>
                            {p.trackingId}
                          </td>
                          <td style={{ color: "#f1f5f9", fontWeight: 600 }}>
                            {p.journal?.name}
                          </td>
                          <td style={{ color: "#94a3b8" }}>
                            {p.customerEmail || p.user?.email || "—"}
                          </td>
                          <td>
                            <span className="admin-badge admin-badge-neutral">{p.tier}</span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#f1f5f9" }}>
                            {p.currency} {Number(p.amount).toLocaleString()}
                          </td>
                          <td>
                            <span className="admin-badge admin-badge-success">{p.status}</span>
                          </td>
                          <td style={{ textAlign: "right", color: "#94a3b8" }}>
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                            No payment transactions recorded in ledger.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
