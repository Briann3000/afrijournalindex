"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "../Header";
import Footer from "../Footer";
import Link from "next/link";
import { ALL_COUNTRY_NAMES } from "../data/african-countries";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
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
}

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Elevation passkey state (for non-admin users)
  const [passcode, setPasscode] = useState<string>("");
  const [elevating, setElevating] = useState<boolean>(false);
  const [elevateError, setElevateError] = useState<string | null>(null);

  // Core Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);

  // Navigation Tabs: "submissions" | "claims" | "journals"
  const [activeTab, setActiveTab] = useState<"submissions" | "claims" | "journals">("submissions");

  // Action in progress
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // TAB 1: SUBMISSIONS CONTROLS (Search, Filter, Sort, Pagination)
  // -------------------------------------------------------------
  const [subSearch, setSubSearch] = useState<string>("");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("ALL");
  const [subCountryFilter, setSubCountryFilter] = useState<string>("ALL");
  const [subSort, setSubSort] = useState<string>("newest");
  const [subPage, setSubPage] = useState<number>(1);
  const [subPageSize, setSubPageSize] = useState<number>(10);

  // -------------------------------------------------------------
  // TAB 2: CLAIMS CONTROLS (Search, Filter, Sort, Pagination)
  // -------------------------------------------------------------
  const [claimSearch, setClaimSearch] = useState<string>("");
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("ALL");
  const [claimSort, setClaimSort] = useState<string>("newest");
  const [claimPage, setClaimPage] = useState<number>(1);
  const [claimPageSize, setClaimPageSize] = useState<number>(10);

  // -------------------------------------------------------------
  // TAB 3: JOURNALS CONTROLS (Search, Filter, Sort, Pagination)
  // -------------------------------------------------------------
  const [journalSearch, setJournalSearch] = useState<string>("");
  const [journalIndexedFilter, setJournalIndexedFilter] = useState<string>("ALL");
  const [journalPaidFilter, setJournalPaidFilter] = useState<string>("ALL");
  const [journalGradeFilter, setJournalGradeFilter] = useState<string>("ALL");
  const [journalCountryFilter, setJournalCountryFilter] = useState<string>("ALL");
  const [journalSort, setJournalSort] = useState<string>("name-asc");
  const [journalPage, setJournalPage] = useState<number>(1);
  const [journalPageSize, setJournalPageSize] = useState<number>(15);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // 1. Check Authentication Status
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      if (data.authenticated) {
        setCurrentUser(data.user);
        setIsAdmin(data.isAdmin);
        if (data.isAdmin) {
          fetchAdminData();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch {
      setError("Failed to verify credentials.");
      setLoading(false);
    }
  };

  // 2. Fetch Admin Datasets
  const fetchAdminData = async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = query ? `/api/admin?searchJournal=${encodeURIComponent(query)}` : "/api/admin";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSubmissions(data.submissions || []);
        setClaims(data.claims || []);
        setJournals(data.journals || []);
      } else {
        setError(data.error || "Failed to load admin overview.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error loading admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 3. Elevate user to Admin
  const handleElevate = async (e: React.FormEvent) => {
    e.preventDefault();
    setElevating(true);
    setElevateError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (data.success) {
        setIsAdmin(true);
        setCurrentUser(data.user);
        showToast("Granted Chief Administrator privileges!");
        fetchAdminData();
      } else {
        setElevateError(data.error || "Invalid setup passcode.");
      }
    } catch {
      setElevateError("Error connecting to server.");
    } finally {
      setElevating(false);
    }
  };

  // 4. Update Submission Status (Approve, Under Review, Reject)
  const handleUpdateSubmission = async (submissionId: string, status: string, qualityGrade = "A") => {
    setActionLoadingId(submissionId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSubmission",
          submissionId,
          status,
          qualityGrade
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Submission marked as ${status}!`);
        setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, status } : s));
        if (status === "ACCEPTED") {
          setStats(prev => prev ? { ...prev, indexedJournals: prev.indexedJournals + 1, pendingSubmissions: Math.max(0, prev.pendingSubmissions - 1) } : prev);
        }
      } else {
        alert(data.error || "Failed to update submission.");
      }
    } catch {
      alert("Error executing submission action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Update Publication Claim Status (Verify, Reject)
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
        showToast(`Publication claim updated to ${status}!`);
        setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status } : c));
        if (status === "VERIFIED") {
          setStats(prev => prev ? { ...prev, pendingClaims: Math.max(0, prev.pendingClaims - 1) } : prev);
        }
      } else {
        alert(data.error || "Failed to update claim.");
      }
    } catch {
      alert("Error executing claim action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 6. Toggle Journal Flags (isIndexed, certificatePaid)
  const handleToggleJournal = async (journalId: string, field: "isIndexed" | "certificatePaid", currentValue: boolean) => {
    setActionLoadingId(`${journalId}-${field}`);
    const nextValue = !currentValue;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateJournal",
          journalId,
          [field]: nextValue
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Journal ${field === "isIndexed" ? "Indexing" : "Certificate"} set to ${nextValue ? "LIVE" : "OFF"}`);
        setJournals(prev => prev.map(j => j.id === journalId ? { ...j, [field]: nextValue } : j));
        if (field === "isIndexed") {
          setStats(prev => prev ? { ...prev, indexedJournals: prev.indexedJournals + (nextValue ? 1 : -1) } : prev);
        }
        if (field === "certificatePaid") {
          setStats(prev => prev ? { ...prev, paidCertificates: prev.paidCertificates + (nextValue ? 1 : -1) } : prev);
        }
      } else {
        alert(data.error || "Failed to update journal.");
      }
    } catch {
      alert("Error updating journal.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // 7. Update Journal Quality Grade
  const handleUpdateGrade = async (journalId: string, grade: string) => {
    setActionLoadingId(`${journalId}-grade`);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateJournal",
          journalId,
          qualityGrade: grade
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Grade updated to "${grade}"`);
        setJournals(prev => prev.map(j => j.id === journalId ? { ...j, qualityGrade: grade } : j));
      } else {
        alert(data.error || "Failed to update grade.");
      }
    } catch {
      alert("Error updating grade.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // -------------------------------------------------------------
  // PROCESSED SUBMISSIONS (Filter, Search, Sort, Pagination)
  // -------------------------------------------------------------
  const processedSubmissions = useMemo(() => {
    const q = subSearch.toLowerCase().trim();
    const filtered = submissions.filter(s => {
      const matchesSearch = !q ||
        (s.journalName && s.journalName.toLowerCase().includes(q)) ||
        (s.issn && s.issn.toLowerCase().includes(q)) ||
        (s.eissn && s.eissn.toLowerCase().includes(q)) ||
        (s.submitter?.name && s.submitter.name.toLowerCase().includes(q)) ||
        (s.submitter?.email && s.submitter.email.toLowerCase().includes(q)) ||
        (s.country && s.country.toLowerCase().includes(q));

      const matchesStatus = subStatusFilter === "ALL" ||
        (subStatusFilter === "PENDING" && (s.status === "PENDING" || s.status === "UNDER_REVIEW")) ||
        s.status === subStatusFilter;

      const matchesCountry = subCountryFilter === "ALL" || s.country === subCountryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    });

    filtered.sort((a, b) => {
      if (subSort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (subSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (subSort === "name-asc") return (a.journalName || "").localeCompare(b.journalName || "");
      if (subSort === "name-desc") return (b.journalName || "").localeCompare(a.journalName || "");
      return 0;
    });

    return filtered;
  }, [submissions, subSearch, subStatusFilter, subCountryFilter, subSort]);

  const subTotalPages = Math.ceil(processedSubmissions.length / subPageSize) || 1;
  const paginatedSubmissions = useMemo(() => {
    const start = (subPage - 1) * subPageSize;
    return processedSubmissions.slice(start, start + subPageSize);
  }, [processedSubmissions, subPage, subPageSize]);

  // -------------------------------------------------------------
  // PROCESSED CLAIMS (Filter, Search, Sort, Pagination)
  // -------------------------------------------------------------
  const processedClaims = useMemo(() => {
    const q = claimSearch.toLowerCase().trim();
    const filtered = claims.filter(c => {
      const matchesSearch = !q ||
        (c.article?.title && c.article.title.toLowerCase().includes(q)) ||
        (c.article?.doi && c.article.doi.toLowerCase().includes(q)) ||
        (c.user?.name && c.user.name.toLowerCase().includes(q)) ||
        (c.user?.email && c.user.email.toLowerCase().includes(q)) ||
        (c.user?.orcid && c.user.orcid.toLowerCase().includes(q));

      const matchesStatus = claimStatusFilter === "ALL" ||
        (claimStatusFilter === "NEEDS_AUDIT" && c.status === "PENDING_EDITORIAL_AUDIT") ||
        c.status === claimStatusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (claimSort === "newest") return new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime();
      if (claimSort === "oldest") return new Date(a.claimedAt).getTime() - new Date(b.claimedAt).getTime();
      if (claimSort === "title-asc") return (a.article?.title || "").localeCompare(b.article?.title || "");
      return 0;
    });

    return filtered;
  }, [claims, claimSearch, claimStatusFilter, claimSort]);

  const claimTotalPages = Math.ceil(processedClaims.length / claimPageSize) || 1;
  const paginatedClaims = useMemo(() => {
    const start = (claimPage - 1) * claimPageSize;
    return processedClaims.slice(start, start + claimPageSize);
  }, [processedClaims, claimPage, claimPageSize]);

  // -------------------------------------------------------------
  // PROCESSED JOURNALS (Filter, Search, Sort, Pagination)
  // -------------------------------------------------------------
  const processedJournals = useMemo(() => {
    const q = journalSearch.toLowerCase().trim();
    const filtered = journals.filter(j => {
      const matchesSearch = !q ||
        (j.name && j.name.toLowerCase().includes(q)) ||
        (j.issn && j.issn.toLowerCase().includes(q)) ||
        (j.eissn && j.eissn.toLowerCase().includes(q)) ||
        (j.country && j.country.toLowerCase().includes(q)) ||
        (j.publisherName && j.publisherName.toLowerCase().includes(q));

      const matchesIndexed = journalIndexedFilter === "ALL" ||
        (journalIndexedFilter === "INDEXED" && Boolean(j.isIndexed)) ||
        (journalIndexedFilter === "DELISTED" && !j.isIndexed);

      const matchesPaid = journalPaidFilter === "ALL" ||
        (journalPaidFilter === "PAID" && Boolean(j.certificatePaid)) ||
        (journalPaidFilter === "UNPAID" && !j.certificatePaid);

      const matchesGrade = journalGradeFilter === "ALL" || j.qualityGrade === journalGradeFilter;
      const matchesCountry = journalCountryFilter === "ALL" || j.country === journalCountryFilter;

      return matchesSearch && matchesIndexed && matchesPaid && matchesGrade && matchesCountry;
    });

    filtered.sort((a, b) => {
      if (journalSort === "name-asc") return (a.name || "").localeCompare(b.name || "");
      if (journalSort === "name-desc") return (b.name || "").localeCompare(a.name || "");
      if (journalSort === "country-asc") return (a.country || "").localeCompare(b.country || "");
      if (journalSort === "grade-asc") return (a.qualityGrade || "C").localeCompare(b.qualityGrade || "C");
      return 0;
    });

    return filtered;
  }, [journals, journalSearch, journalIndexedFilter, journalPaidFilter, journalGradeFilter, journalCountryFilter, journalSort]);

  const journalTotalPages = Math.ceil(processedJournals.length / journalPageSize) || 1;
  const paginatedJournals = useMemo(() => {
    const start = (journalPage - 1) * journalPageSize;
    return processedJournals.slice(start, start + journalPageSize);
  }, [processedJournals, journalPage, journalPageSize]);

  // Reset pagination on filter changes
  useEffect(() => { setSubPage(1); }, [subSearch, subStatusFilter, subCountryFilter, subSort, subPageSize]);
  useEffect(() => { setClaimPage(1); }, [claimSearch, claimStatusFilter, claimSort, claimPageSize]);
  useEffect(() => { setJournalPage(1); }, [journalSearch, journalIndexedFilter, journalPaidFilter, journalGradeFilter, journalCountryFilter, journalSort, journalPageSize]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base, #f8fafc)", color: "var(--color-text-main, #0f172a)" }}>
      <Header />

      {/* Floating Success Toast */}
      {successToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "#10b981",
          color: "#ffffff",
          padding: "12px 22px",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          fontWeight: 700,
          fontSize: "0.9rem",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{successToast}</span>
        </div>
      )}

      <main style={{ flex: 1, padding: "2.5rem 1rem", maxWidth: "1360px", width: "95%", margin: "0 auto" }}>
        
        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: "center", padding: "6rem 0" }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2.5rem", color: "var(--color-primary, #0284c7)" }}></i>
            <p style={{ marginTop: "1rem", color: "var(--color-text-muted, #64748b)", fontWeight: 600 }}>Loading Editorial Dashboard & Datasets...</p>
          </div>
        )}

        {/* Not Logged In View */}
        {!loading && !currentUser && (
          <div style={{
            maxWidth: "480px",
            margin: "4rem auto",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border, #e2e8f0)",
            borderRadius: "16px",
            padding: "2.5rem",
            textAlign: "center",
            boxShadow: "var(--card-shadow, 0 4px 6px -1px rgba(0,0,0,0.05))"
          }}>
            <div style={{ width: "64px", height: "64px", background: "rgba(2, 132, 199, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", color: "#0284c7", fontSize: "1.75rem" }}>
              <i className="fa-solid fa-lock"></i>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Admin Portal Authentication</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", lineHeight: "1.6", marginBottom: "1.75rem" }}>
              This portal is restricted to AfriJournal Editorial Board Directors and Chief Index Administrators.
            </p>
            <Link 
              href="/login?redirect=/admin"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <i className="fa-solid fa-right-to-bracket"></i> Log In to Continue
            </Link>
          </div>
        )}

        {/* Non-Admin Account: Elevation Key */}
        {!loading && currentUser && !isAdmin && (
          <div style={{
            maxWidth: "520px",
            margin: "4rem auto",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border, #e2e8f0)",
            borderRadius: "16px",
            padding: "2.5rem",
            boxShadow: "var(--card-shadow, 0 4px 6px -1px rgba(0,0,0,0.05))"
          }}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(245, 158, 11, 0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: "#d97706", fontSize: "1.5rem" }}>
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.4rem" }}>Elevate Account to Editorial Admin</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                Logged in as <strong>{currentUser.email}</strong> (Role: <span style={{ color: "#0284c7", fontWeight: 700 }}>{currentUser.role}</span>). Enter your Editorial Setup Key to gain full administrative access.
              </p>
            </div>

            {elevateError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "6px" }}></i> {elevateError}
              </div>
            )}

            <form onSubmit={handleElevate}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-body)", marginBottom: "0.4rem" }}>
                  Admin Setup Passcode
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter admin passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    color: "var(--color-text-main)",
                    fontSize: "0.95rem",
                    outline: "none"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={elevating}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {elevating ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Authorizing...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-key"></i> Unlock Administrator Console
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* FULL CHIEF EDITORIAL & ADMIN CONSOLE */}
        {!loading && currentUser && isAdmin && (
          <div>
            
            {/* Header Title & Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.35rem" }}>
                  <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.5px" }}>
                    CHIEF EDITORIAL CONSOLE
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", fontWeight: 500 }}>AfriJournal Index Operations</span>
                </div>
                <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
                  Administrative Oversight Portal
                </h1>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  onClick={() => fetchAdminData()}
                  className="btn btn-secondary btn-sm"
                  style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-body)" }}
                  title="Reload Live Datasets"
                >
                  <i className="fa-solid fa-arrows-rotate"></i> Refresh Data
                </button>
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", padding: "0.4rem 0.85rem", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Admin: <strong style={{ color: "#0284c7" }}>{currentUser.name || currentUser.email}</strong>
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "1rem 1.25rem", borderRadius: "12px", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            {/* 4 Top Metric KPI Cards (Light Theme) */}
            {stats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                
                {/* Metric 1: Indexed Journals */}
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "1.4rem", display: "flex", alignItems: "center", gap: "1.2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#eff6ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                    <i className="fa-solid fa-book-journal-whills"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>INDEXED JOURNALS</div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                      {stats.indexedJournals} <span style={{ fontSize: "0.88rem", color: "#94a3b8", fontWeight: 500 }}>/ {stats.totalJournals}</span>
                    </div>
                  </div>
                </div>

                {/* Metric 2: Pending Submissions */}
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "1.4rem", display: "flex", alignItems: "center", gap: "1.2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                    <i className="fa-solid fa-hourglass-half"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>PENDING SUBMISSIONS</div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, color: stats.pendingSubmissions > 0 ? "#d97706" : "#0f172a" }}>
                      {stats.pendingSubmissions}
                    </div>
                  </div>
                </div>

                {/* Metric 3: Claims to Audit */}
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "1.4rem", display: "flex", alignItems: "center", gap: "1.2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#faf5ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                    <i className="fa-solid fa-user-check"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>CLAIMS TO AUDIT</div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, color: stats.pendingClaims > 0 ? "#7c3aed" : "#0f172a" }}>
                      {stats.pendingClaims}
                    </div>
                  </div>
                </div>

                {/* Metric 4: Paid Certificates */}
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "1.4rem", display: "flex", alignItems: "center", gap: "1.2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem" }}>
                    <i className="fa-solid fa-certificate"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>PAID CERTIFICATES ($99)</div>
                    <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#059669" }}>
                      {stats.paidCertificates}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Main Navigation Tabs */}
            <div style={{ display: "flex", gap: "0.5rem", borderBottom: "2px solid var(--color-border)", marginBottom: "1.5rem" }}>
              
              <button
                onClick={() => setActiveTab("submissions")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.85rem 1.4rem",
                  fontSize: "0.98rem",
                  fontWeight: 700,
                  color: activeTab === "submissions" ? "#0284c7" : "#64748b",
                  borderBottom: activeTab === "submissions" ? "3px solid #0284c7" : "3px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "-2px"
                }}
              >
                <i className="fa-solid fa-inbox"></i> Submissions Desk
                {stats && stats.pendingSubmissions > 0 && (
                  <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", fontWeight: 800 }}>
                    {stats.pendingSubmissions}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("claims")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.85rem 1.4rem",
                  fontSize: "0.98rem",
                  fontWeight: 700,
                  color: activeTab === "claims" ? "#0284c7" : "#64748b",
                  borderBottom: activeTab === "claims" ? "3px solid #0284c7" : "3px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "-2px"
                }}
              >
                <i className="fa-solid fa-user-check"></i> Authorship Claims
                {stats && stats.pendingClaims > 0 && (
                  <span style={{ background: "#f3e8ff", color: "#7e22ce", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", fontWeight: 800 }}>
                    {stats.pendingClaims}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("journals")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.85rem 1.4rem",
                  fontSize: "0.98rem",
                  fontWeight: 700,
                  color: activeTab === "journals" ? "#0284c7" : "#64748b",
                  borderBottom: activeTab === "journals" ? "3px solid #0284c7" : "3px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "-2px"
                }}
              >
                <i className="fa-solid fa-book"></i> Journal Directory & Certificates
                <span style={{ background: "var(--color-bg-card-subtle)", color: "var(--color-text-muted)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", fontWeight: 800 }}>
                  {stats ? stats.totalJournals : journals.length}
                </span>
              </button>

            </div>

            {/* =============================================================
                TAB 1: SUBMISSIONS DESK
            ============================================================= */}
            {activeTab === "submissions" && (
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                
                {/* Search, Filter & Sort Controls */}
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", background: "var(--color-bg-card-subtle)", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
                  
                  {/* Left: Search & Filter inputs */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", flex: 1 }}>
                    <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "340px" }}>
                      <input
                        type="text"
                        placeholder="Search submissions by title, ISSN, submitter..."
                        value={subSearch}
                        onChange={(e) => setSubSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.85rem 0.55rem 2.2rem",
                          background: "var(--color-bg-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          color: "var(--color-text-main)",
                          outline: "none"
                        }}
                      />
                      <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.8rem" }}></i>
                    </div>

                    {/* Status Filter */}
                    <select
                      value={subStatusFilter}
                      onChange={(e) => setSubStatusFilter(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", fontWeight: 600, outline: "none" }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Needs Review (Pending / Under Review)</option>
                      <option value="ACCEPTED">Accepted (Indexed)</option>
                      <option value="REJECTED">Rejected (Cooling Period)</option>
                    </select>

                    {/* Country Filter */}
                    <select
                      value={subCountryFilter}
                      onChange={(e) => setSubCountryFilter(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", outline: "none" }}
                    >
                      <option value="ALL">All Countries</option>
                      {ALL_COUNTRY_NAMES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Sort */}
                    <select
                      value={subSort}
                      onChange={(e) => setSubSort(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", outline: "none" }}
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="oldest">Sort: Oldest First</option>
                      <option value="name-asc">Sort: Journal Title (A-Z)</option>
                      <option value="name-desc">Sort: Journal Title (Z-A)</option>
                    </select>
                  </div>

                  {/* Right: Counter */}
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    {processedSubmissions.length} submissions found
                  </span>
                </div>

                {/* Submissions Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                    <thead>
                      <tr style={{ background: "var(--color-bg-card)", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "1rem 1.25rem" }}>Journal Details</th>
                        <th style={{ padding: "1rem" }}>Submitter & Institution</th>
                        <th style={{ padding: "1rem" }}>Audit & Date</th>
                        <th style={{ padding: "1rem" }}>Status</th>
                        <th style={{ padding: "1rem 1.25rem", textAlign: "right" }}>Editorial Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                            <i className="fa-solid fa-inbox" style={{ fontSize: "2.5rem", marginBottom: "0.75rem", display: "block", color: "#cbd5e1" }}></i>
                            No submissions match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedSubmissions.map(sub => (
                          <tr key={sub.id} style={{ borderBottom: "1px solid #f1f5f9", background: "var(--color-bg-card)" }}>
                            
                            <td style={{ padding: "1rem 1.25rem" }}>
                              <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem", marginBottom: "2px" }}>
                                {sub.journalName}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <span>ISSN: <strong>{sub.issn || sub.eissn || "N/A"}</strong></span>
                                <span>•</span>
                                <span>Country: <strong>{sub.country || "Pan-African"}</strong></span>
                              </div>
                              {(sub.websiteUrl || sub.website) && (
                                <a href={sub.websiteUrl || sub.website} target="_blank" rel="noreferrer" style={{ fontSize: "0.78rem", color: "#0284c7", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px", fontWeight: 600 }}>
                                  <i className="fa-solid fa-arrow-up-right-from-square"></i> Visit Website
                                </a>
                              )}
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <div style={{ fontWeight: 600, color: "var(--color-text-body)" }}>
                                {sub.submitter?.name || "Independent Submitter"}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                {sub.submitter?.email || "No email"}
                              </div>
                              <div style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                                {sub.submitter?.institution || sub.publisherName || "Pan-African Scholarly Press"}
                              </div>
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <span style={{
                                background: sub.evaluationLog ? "#ecfdf5" : "#fffbeb",
                                color: sub.evaluationLog ? "#059669" : "#d97706",
                                border: `1px solid ${sub.evaluationLog ? "#a7f3d0" : "#fde68a"}`,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontWeight: 700,
                                fontSize: "0.78rem"
                              }}>
                                {sub.evaluationLog ? "Verified Audit" : "Initial Review"}
                              </span>
                              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                                {new Date(sub.createdAt).toLocaleDateString()}
                              </div>
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <span style={{
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                background: sub.status === "ACCEPTED" ? "#ecfdf5" : sub.status === "REJECTED" ? "#fef2f2" : "#fffbeb",
                                color: sub.status === "ACCEPTED" ? "#059669" : sub.status === "REJECTED" ? "#dc2626" : "#d97706",
                                border: `1px solid ${sub.status === "ACCEPTED" ? "#a7f3d0" : sub.status === "REJECTED" ? "#fecaca" : "#fde68a"}`
                              }}>
                                {sub.status}
                              </span>
                            </td>

                            <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                {sub.status !== "ACCEPTED" && (
                                  <button
                                    onClick={() => handleUpdateSubmission(sub.id, "ACCEPTED", "A")}
                                    disabled={actionLoadingId === sub.id}
                                    className="btn btn-sm"
                                    style={{ background: "#059669", color: "#ffffff", padding: "5px 12px", fontSize: "0.78rem", fontWeight: 700 }}
                                    title="Approve and Index into public directory"
                                  >
                                    <i className="fa-solid fa-check"></i> Approve & Index
                                  </button>
                                )}

                                {sub.status === "PENDING" && (
                                  <button
                                    onClick={() => handleUpdateSubmission(sub.id, "UNDER_REVIEW")}
                                    disabled={actionLoadingId === sub.id}
                                    className="btn btn-sm"
                                    style={{ background: "var(--color-bg-card)", border: "1px solid #d97706", color: "#d97706", padding: "5px 10px", fontSize: "0.78rem" }}
                                    title="Mark Under Review"
                                  >
                                    <i className="fa-solid fa-hourglass-half"></i> Under Review
                                  </button>
                                )}

                                {sub.status !== "REJECTED" && (
                                  <button
                                    onClick={() => handleUpdateSubmission(sub.id, "REJECTED")}
                                    disabled={actionLoadingId === sub.id}
                                    className="btn btn-sm"
                                    style={{ background: "var(--color-bg-card)", border: "1px solid #ef4444", color: "#dc2626", padding: "5px 10px", fontSize: "0.78rem" }}
                                    title="Reject and enforce 6-month cooldown"
                                  >
                                    <i className="fa-solid fa-xmark"></i> Reject
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Submissions Pagination */}
                {processedSubmissions.length > 0 && (
                  <div style={{ padding: "0.85rem 1.5rem", borderTop: "1px solid #f1f5f9", background: "var(--color-bg-card-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                      <span>Per page:</span>
                      <select
                        value={subPageSize}
                        onChange={(e) => setSubPageSize(Number(e.target.value))}
                        style={{ padding: "2px 6px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)", fontSize: "0.82rem" }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span>Showing {((subPage - 1) * subPageSize) + 1} - {Math.min(subPage * subPageSize, processedSubmissions.length)} of {processedSubmissions.length}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => setSubPage(p => Math.max(1, p - 1))}
                        disabled={subPage === 1}
                        className="btn btn-sm"
                        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: subPage === 1 ? "#94a3b8" : "#334155", padding: "4px 10px" }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", fontWeight: 700, padding: "0 6px" }}>
                        Page {subPage} of {subTotalPages}
                      </span>
                      <button
                        onClick={() => setSubPage(p => Math.min(subTotalPages, p + 1))}
                        disabled={subPage >= subTotalPages}
                        className="btn btn-sm"
                        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: subPage >= subTotalPages ? "#94a3b8" : "#334155", padding: "4px 10px" }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* =============================================================
                TAB 2: AUTHORSHIP CLAIMS DESK
            ============================================================= */}
            {activeTab === "claims" && (
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                
                {/* Search & Filter Bar */}
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", background: "var(--color-bg-card-subtle)", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", flex: 1 }}>
                    <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "340px" }}>
                      <input
                        type="text"
                        placeholder="Search claims by paper title, DOI, author..."
                        value={claimSearch}
                        onChange={(e) => setClaimSearch(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.85rem 0.55rem 2.2rem",
                          background: "var(--color-bg-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          color: "var(--color-text-main)",
                          outline: "none"
                        }}
                      />
                      <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.8rem" }}></i>
                    </div>

                    <select
                      value={claimStatusFilter}
                      onChange={(e) => setClaimStatusFilter(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", fontWeight: 600, outline: "none" }}
                    >
                      <option value="ALL">All Claim Statuses</option>
                      <option value="NEEDS_AUDIT">Pending Editorial Audit</option>
                      <option value="VERIFIED">Verified (Credited)</option>
                      <option value="REJECTED">Rejected Claims</option>
                    </select>

                    <select
                      value={claimSort}
                      onChange={(e) => setClaimSort(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", outline: "none" }}
                    >
                      <option value="newest">Sort: Newest Claim</option>
                      <option value="oldest">Sort: Oldest Claim</option>
                      <option value="title-asc">Sort: Title (A-Z)</option>
                    </select>
                  </div>

                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                    {processedClaims.length} authorship claims found
                  </span>
                </div>

                {/* Claims Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                    <thead>
                      <tr style={{ background: "var(--color-bg-card)", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "1rem 1.25rem" }}>Publication & Journal</th>
                        <th style={{ padding: "1rem" }}>Claiming Researcher</th>
                        <th style={{ padding: "1rem" }}>Claimed Role</th>
                        <th style={{ padding: "1rem" }}>Status</th>
                        <th style={{ padding: "1rem 1.25rem", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClaims.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                            <i className="fa-solid fa-user-check" style={{ fontSize: "2.5rem", marginBottom: "0.75rem", display: "block", color: "#cbd5e1" }}></i>
                            No publication claims match your filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedClaims.map(c => (
                          <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9", background: "var(--color-bg-card)" }}>
                            
                            <td style={{ padding: "1rem 1.25rem" }}>
                              <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.92rem", marginBottom: "3px" }}>
                                {c.article?.title || "Unknown Publication"}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                {c.article?.journal?.name || "AfriJournal Repository"}
                              </div>
                              {c.article?.doi && (
                                <a 
                                  href={`https://doi.org/${c.article.doi}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  style={{ fontSize: "0.78rem", color: "#0284c7", fontFamily: "monospace", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "3px" }}
                                >
                                  DOI: {c.article.doi} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.68rem" }}></i>
                                </a>
                              )}
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <div style={{ fontWeight: 600, color: "var(--color-text-body)" }}>
                                {c.user?.name || "Registered Scholar"}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                {c.user?.email}
                              </div>
                              {c.user?.orcid && (
                                <a href={`https://orcid.org/${c.user.orcid}`} target="_blank" rel="noreferrer" style={{ fontSize: "0.76rem", color: "#059669", textDecoration: "none", fontWeight: 600 }}>
                                  ORCID: {c.user.orcid}
                                </a>
                              )}
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <span style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", padding: "3px 8px", borderRadius: "6px", fontSize: "0.8rem", color: "var(--color-text-body)", fontWeight: 600 }}>
                                {c.role}
                              </span>
                              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                                {new Date(c.claimedAt).toLocaleDateString()}
                              </div>
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <span style={{
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                background: c.status === "VERIFIED" ? "#ecfdf5" : c.status === "REJECTED" ? "#fef2f2" : "#faf5ff",
                                color: c.status === "VERIFIED" ? "#059669" : c.status === "REJECTED" ? "#dc2626" : "#7c3aed",
                                border: `1px solid ${c.status === "VERIFIED" ? "#a7f3d0" : c.status === "REJECTED" ? "#fecaca" : "#e9d5ff"}`
                              }}>
                                {c.status === "PENDING_EDITORIAL_AUDIT" ? "Needs Audit" : c.status}
                              </span>
                            </td>

                            <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                {c.status !== "VERIFIED" && (
                                  <button
                                    onClick={() => handleUpdateClaim(c.id, "VERIFIED")}
                                    disabled={actionLoadingId === c.id}
                                    className="btn btn-sm"
                                    style={{ background: "#059669", color: "#ffffff", padding: "5px 12px", fontSize: "0.78rem", fontWeight: 700 }}
                                    title="Verify authorship and credit citations"
                                  >
                                    <i className="fa-solid fa-check"></i> Verify
                                  </button>
                                )}

                                {c.status !== "REJECTED" && (
                                  <button
                                    onClick={() => handleUpdateClaim(c.id, "REJECTED")}
                                    disabled={actionLoadingId === c.id}
                                    className="btn btn-sm"
                                    style={{ background: "var(--color-bg-card)", border: "1px solid #ef4444", color: "#dc2626", padding: "5px 10px", fontSize: "0.78rem" }}
                                    title="Reject authorship claim"
                                  >
                                    <i className="fa-solid fa-xmark"></i> Reject
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Claims Pagination */}
                {processedClaims.length > 0 && (
                  <div style={{ padding: "0.85rem 1.5rem", borderTop: "1px solid #f1f5f9", background: "var(--color-bg-card-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                      <span>Per page:</span>
                      <select
                        value={claimPageSize}
                        onChange={(e) => setClaimPageSize(Number(e.target.value))}
                        style={{ padding: "2px 6px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)", fontSize: "0.82rem" }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span>Showing {((claimPage - 1) * claimPageSize) + 1} - {Math.min(claimPage * claimPageSize, processedClaims.length)} of {processedClaims.length}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => setClaimPage(p => Math.max(1, p - 1))}
                        disabled={claimPage === 1}
                        className="btn btn-sm"
                        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: claimPage === 1 ? "#94a3b8" : "#334155", padding: "4px 10px" }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", fontWeight: 700, padding: "0 6px" }}>
                        Page {claimPage} of {claimTotalPages}
                      </span>
                      <button
                        onClick={() => setClaimPage(p => Math.min(claimTotalPages, p + 1))}
                        disabled={claimPage >= claimTotalPages}
                        className="btn btn-sm"
                        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: claimPage >= claimTotalPages ? "#94a3b8" : "#334155", padding: "4px 10px" }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* =============================================================
                TAB 3: JOURNAL DIRECTORY & CERTIFICATES (ALL SEEDED JOURNALS)
            ============================================================= */}
            {activeTab === "journals" && (
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                
                {/* Search, Filter & Sort Controls */}
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9", background: "var(--color-bg-card-subtle)", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
                  
                  {/* Left: Search input & Filters */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center", flex: 1 }}>
                    <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "360px" }}>
                      <input
                        type="text"
                        placeholder="Search seeded & live journals (Title, ISSN, Publisher)..."
                        value={journalSearch}
                        onChange={(e) => setJournalSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            fetchAdminData(journalSearch);
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.85rem 0.55rem 2.2rem",
                          background: "var(--color-bg-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          color: "var(--color-text-main)",
                          outline: "none"
                        }}
                      />
                      <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "0.8rem" }}></i>
                    </div>

                    {/* Filter: Indexing */}
                    <select
                      value={journalIndexedFilter}
                      onChange={(e) => setJournalIndexedFilter(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", fontWeight: 600, outline: "none" }}
                    >
                      <option value="ALL">All Indexing States</option>
                      <option value="INDEXED">Indexed (Live)</option>
                      <option value="DELISTED">Delisted / Unindexed</option>
                    </select>

                    {/* Filter: Certificate Paid */}
                    <select
                      value={journalPaidFilter}
                      onChange={(e) => setJournalPaidFilter(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", fontWeight: 600, outline: "none" }}
                    >
                      <option value="ALL">All Certificate States</option>
                      <option value="PAID">Paid ($99 Full Cert)</option>
                      <option value="UNPAID">Unpaid (Sample Preview)</option>
                    </select>

                    {/* Filter: Grade */}
                    <select
                      value={journalGradeFilter}
                      onChange={(e) => setJournalGradeFilter(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", outline: "none" }}
                    >
                      <option value="ALL">All Grades</option>
                      <option value="A+">A+ (Pioneer)</option>
                      <option value="A">A (Standard)</option>
                      <option value="B">B (Developing)</option>
                      <option value="C">C (Provisional)</option>
                    </select>

                    {/* Filter: Country */}
                    <select
                      value={journalCountryFilter}
                      onChange={(e) => setJournalCountryFilter(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", outline: "none" }}
                    >
                      <option value="ALL">All African Nations</option>
                      {ALL_COUNTRY_NAMES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Sort */}
                    <select
                      value={journalSort}
                      onChange={(e) => setJournalSort(e.target.value)}
                      style={{ padding: "0.55rem 0.85rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-text-body)", outline: "none" }}
                    >
                      <option value="name-asc">Sort: Title (A-Z)</option>
                      <option value="name-desc">Sort: Title (Z-A)</option>
                      <option value="country-asc">Sort: Country (A-Z)</option>
                      <option value="grade-asc">Sort: Quality Grade</option>
                    </select>
                  </div>

                  {/* Right Counter & Search Trigger */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => fetchAdminData(journalSearch)}
                      className="btn btn-sm btn-primary"
                      style={{ padding: "0.45rem 0.85rem", fontSize: "0.82rem" }}
                    >
                      <i className="fa-solid fa-magnifying-glass"></i> Deep Query
                    </button>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                      {processedJournals.length} journals
                    </span>
                  </div>
                </div>

                {/* Seeded & Live Journals Table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                    <thead>
                      <tr style={{ background: "var(--color-bg-card)", color: "var(--color-text-muted)", borderBottom: "2px solid var(--color-border)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "1rem 1.25rem" }}>Journal & Publisher</th>
                        <th style={{ padding: "1rem" }}>Live Directory</th>
                        <th style={{ padding: "1rem" }}>Accredited Cert ($99)</th>
                        <th style={{ padding: "1rem" }}>Quality Grade</th>
                        <th style={{ padding: "1rem 1.25rem", textAlign: "right" }}>Public Links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedJournals.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
                            <i className="fa-solid fa-book" style={{ fontSize: "2.5rem", marginBottom: "0.75rem", display: "block", color: "#cbd5e1" }}></i>
                            No journals match your query. Try searching with a broader keyword or resetting filters.
                          </td>
                        </tr>
                      ) : (
                        paginatedJournals.map(j => (
                          <tr key={j.id} style={{ borderBottom: "1px solid #f1f5f9", background: "var(--color-bg-card)" }}>
                            
                            <td style={{ padding: "1rem 1.25rem" }}>
                              <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.95rem", marginBottom: "2px" }}>
                                {j.name}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                ISSN: <strong>{j.issn || j.eissn || "N/A"}</strong> • {j.country}
                              </div>
                              <div style={{ fontSize: "0.76rem", color: j.publisher ? "#0284c7" : "#94a3b8", marginTop: "2px", fontWeight: j.publisher ? 600 : 400 }}>
                                {j.publisher ? (
                                  <>
                                    <i className="fa-solid fa-user-tie" style={{ marginRight: "4px" }}></i>
                                    Editor: {j.publisher.name} ({j.publisher.email})
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-solid fa-seedling" style={{ marginRight: "4px", color: "#10b981" }}></i>
                                    Seeded Entry • Open to Claim
                                  </>
                                )}
                              </div>
                            </td>

                            {/* isIndexed Switch */}
                            <td style={{ padding: "1rem" }}>
                              <button
                                onClick={() => handleToggleJournal(j.id, "isIndexed", Boolean(j.isIndexed))}
                                disabled={actionLoadingId === `${j.id}-isIndexed`}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "20px",
                                  border: "none",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  background: j.isIndexed ? "#ecfdf5" : "#f1f5f9",
                                  color: j.isIndexed ? "#059669" : "#64748b",
                                  borderWidth: "1px",
                                  borderStyle: "solid",
                                  borderColor: j.isIndexed ? "#a7f3d0" : "#cbd5e1",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                <i className={`fa-solid ${j.isIndexed ? "fa-circle-check" : "fa-ban"}`}></i>
                                <span>{j.isIndexed ? "Indexed (Live)" : "Delisted"}</span>
                              </button>
                            </td>

                            {/* certificatePaid Switch */}
                            <td style={{ padding: "1rem" }}>
                              <button
                                onClick={() => handleToggleJournal(j.id, "certificatePaid", Boolean(j.certificatePaid))}
                                disabled={actionLoadingId === `${j.id}-certificatePaid`}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: "20px",
                                  border: "none",
                                  fontSize: "0.8rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  background: j.certificatePaid ? "#fefce8" : "#f1f5f9",
                                  color: j.certificatePaid ? "#a16207" : "#64748b",
                                  borderWidth: "1px",
                                  borderStyle: "solid",
                                  borderColor: j.certificatePaid ? "#fef08a" : "#cbd5e1",
                                  transition: "all 0.15s ease"
                                }}
                              >
                                <i className={`fa-solid ${j.certificatePaid ? "fa-certificate" : "fa-lock"}`}></i>
                                <span>{j.certificatePaid ? "Paid ($99 Full)" : "Unpaid Sample"}</span>
                              </button>
                            </td>

                            {/* Quality Grade Inline Selector */}
                            <td style={{ padding: "1rem" }}>
                              <select
                                value={j.qualityGrade || "A"}
                                onChange={(e) => handleUpdateGrade(j.id, e.target.value)}
                                style={{
                                  background: "var(--color-bg-card)",
                                  color: "var(--color-text-main)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  fontSize: "0.85rem",
                                  fontWeight: 700,
                                  outline: "none"
                                }}
                              >
                                <option value="A+">A+ (Pioneer)</option>
                                <option value="A">A (Standard)</option>
                                <option value="B">B (Developing)</option>
                                <option value="C">C (Provisional)</option>
                              </select>
                            </td>

                            {/* Public Links */}
                            <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                <Link
                                  href={`/journal/${j.id}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "4px 10px", fontSize: "0.78rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                                  target="_blank"
                                >
                                  <i className="fa-solid fa-arrow-up-right-from-square"></i> View Profile
                                </Link>
                                <Link
                                  href={`/verify/${j.id}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "4px 10px", fontSize: "0.78rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
                                  target="_blank"
                                >
                                  <i className="fa-solid fa-certificate"></i> Cert
                                </Link>
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Journals Pagination */}
                {processedJournals.length > 0 && (
                  <div style={{ padding: "0.85rem 1.5rem", borderTop: "1px solid #f1f5f9", background: "var(--color-bg-card-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                      <span>Per page:</span>
                      <select
                        value={journalPageSize}
                        onChange={(e) => setJournalPageSize(Number(e.target.value))}
                        style={{ padding: "2px 6px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)", fontSize: "0.82rem" }}
                      >
                        <option value={15}>15</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>Showing {((journalPage - 1) * journalPageSize) + 1} - {Math.min(journalPage * journalPageSize, processedJournals.length)} of {processedJournals.length}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        onClick={() => setJournalPage(p => Math.max(1, p - 1))}
                        disabled={journalPage === 1}
                        className="btn btn-sm"
                        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: journalPage === 1 ? "#94a3b8" : "#334155", padding: "4px 10px" }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", fontWeight: 700, padding: "0 6px" }}>
                        Page {journalPage} of {journalTotalPages}
                      </span>
                      <button
                        onClick={() => setJournalPage(p => Math.min(journalTotalPages, p + 1))}
                        disabled={journalPage >= journalTotalPages}
                        className="btn btn-sm"
                        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: journalPage >= journalTotalPages ? "#94a3b8" : "#334155", padding: "4px 10px" }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
