"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

export default function ReviewerDashboardPage() {
  const { t } = useLang();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"reviewer" | "author">("reviewer");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    pendingInvitations: any[];
    activeReviews: any[];
    completedReviews: any[];
  }>({
    pendingInvitations: [],
    activeReviews: [],
    completedReviews: []
  });

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/review/reviewer/assignments");
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (res.status === 401) {
          router.push("/login?redirect=/reviewer");
          return;
        }
        throw new Error(result.error || "Failed to load reviewer desk.");
      }

      setData(result.data);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading tasks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const res = await fetch("/api/review/my-submissions");
      const result = await res.json();
      if (res.ok && result.success) {
        setSubmissions(result.submissions);
      }
    } catch (err) {
      console.error("Submissions load error:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchSubmissions();
  }, []);

  const handleRespond = async (assignmentId: string, action: "ACCEPT" | "DECLINE") => {
    setRespondingId(assignmentId);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/review/reviewer/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, action })
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Failed to process invitation.");
      }

      setActionSuccess(resData.message);

      if (action === "ACCEPT" && resData.workspaceUrl) {
        router.push(resData.workspaceUrl);
      } else {
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)", color: "var(--color-text-main)" }}>
      <Header activePage="reviewer" />

      <main style={{ flex: 1, maxWidth: "1100px", margin: "0 auto", padding: "2.5rem 1.5rem 6rem", width: "100%", boxSizing: "border-box" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>Reviewer Desk</span>
        </div>

        {/* Hero Header */}
        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--color-primary-light)", border: "1px solid rgba(180, 83, 9, 0.25)", color: "var(--color-primary)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.75rem" }}>
                <i className="fa-solid fa-graduation-cap"></i> Verified Peer Review Desk
              </div>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                African Scholarly Peer Review Desk
              </h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: "750px", margin: 0 }}>
                Manage double-blind referee invitations, conduct rubric-standard evaluations, track lodged manuscripts, and access accredited peer review credentials.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/review/submit"
                className="btn btn-primary btn-sm"
                style={{ padding: "0.6rem 1.25rem", fontSize: "0.86rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-plus"></i> Lodge New Manuscript
              </Link>
              <Link
                href="/review/track"
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.6rem 1.25rem", fontSize: "0.86rem", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-magnifying-glass"></i> Track Code
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "12px", borderTop: "1px solid var(--color-border)", marginTop: "1.75rem", paddingTop: "1.25rem" }}>
            <button
              type="button"
              onClick={() => setActiveTab("reviewer")}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === "reviewer" ? "3px solid var(--color-primary)" : "3px solid transparent",
                padding: "0.5rem 0.75rem",
                fontSize: "0.95rem",
                fontWeight: activeTab === "reviewer" ? 800 : 600,
                color: activeTab === "reviewer" ? "var(--color-primary)" : "var(--color-text-muted)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <i className="fa-solid fa-scale-balanced"></i>
              <span>Referee Tasks ({data.pendingInvitations.length + data.activeReviews.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("author")}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === "author" ? "3px solid var(--color-primary)" : "3px solid transparent",
                padding: "0.5rem 0.75rem",
                fontSize: "0.95rem",
                fontWeight: activeTab === "author" ? 800 : 600,
                color: activeTab === "author" ? "var(--color-primary)" : "var(--color-text-muted)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <i className="fa-solid fa-book-bookmark"></i>
              <span>My Submitted Manuscripts ({submissions.length})</span>
            </button>
          </div>
        </div>

        {/* Action Feedback */}
        {actionSuccess && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "1rem", color: "#065f46", fontSize: "0.9rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-circle-check"></i>
            <span>{actionSuccess}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Loading your reviewer desk records...</div>
          </div>
        ) : error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "2rem", textAlign: "center" }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "2.5rem", color: "#dc2626", marginBottom: "1rem" }}></i>
            <h2 style={{ fontSize: "1.3rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Error Loading Desk</h2>
            <p style={{ color: "var(--color-text-body)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{error}</p>
            <button onClick={fetchDashboardData} className="btn btn-primary btn-sm">Try Again</button>
          </div>
        ) : activeTab === "reviewer" ? (
          <>
            {/* Section 1: Pending 48-Hour Invitations */}
            <div style={{ marginBottom: "3rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fa-solid fa-envelope-open-text" style={{ color: "var(--color-primary)" }}></i>
                  Pending Review Invitations ({data.pendingInvitations.length})
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Strict 48-hour response window</span>
              </div>

              {data.pendingInvitations.length === 0 ? (
                <div style={{ background: "var(--color-bg-card)", border: "1px dashed var(--color-border)", borderRadius: "12px", padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                  <i className="fa-regular fa-folder-open" style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "block", color: "var(--color-text-muted)" }}></i>
                  No pending review invitations at this time. When a manuscript in your discipline is lodged, your invitation will appear here with an active 48-hour acceptance timer.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {data.pendingInvitations.map((inv) => (
                    <div key={inv.id} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "0.75rem" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--color-primary-light)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "16px", fontSize: "0.78rem", fontWeight: 700 }}>
                          <i className="fa-solid fa-clock"></i> {inv.hoursRemaining} hours left to respond
                        </div>
                        <span style={{ fontSize: "0.82rem", color: "var(--color-primary)", fontWeight: 700 }}>
                          {inv.discipline}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.6rem" }}>
                        {inv.title}
                      </h3>

                      <p style={{ color: "var(--color-text-body)", fontSize: "0.88rem", lineHeight: 1.55, margin: "0 0 1.25rem", maxHeight: "85px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {inv.abstract}
                      </p>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => handleRespond(inv.id, "ACCEPT")}
                          disabled={respondingId === inv.id}
                          className="btn btn-primary btn-sm"
                          style={{ padding: "0.5rem 1.25rem", fontSize: "0.86rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <i className="fa-solid fa-check"></i> Accept Review (10-Day Window)
                        </button>
                        <button
                          onClick={() => handleRespond(inv.id, "DECLINE")}
                          disabled={respondingId === inv.id}
                          className="btn btn-secondary btn-sm"
                          style={{ color: "#dc2626", border: "1px solid #fecaca", padding: "0.5rem 1.25rem", fontSize: "0.86rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <i className="fa-solid fa-xmark"></i> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Active In-Progress Reviews */}
            <div style={{ marginBottom: "3rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa-solid fa-pen-ruler" style={{ color: "var(--color-primary)" }}></i>
                Active Accepted Reviews ({data.activeReviews.length})
              </h2>

              {data.activeReviews.length === 0 ? (
                <div style={{ background: "var(--color-bg-card)", border: "1px dashed var(--color-border)", borderRadius: "12px", padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                  No active reviews in progress. Accept an invitation above to begin a double-blind manuscript evaluation.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {data.activeReviews.map((rev) => (
                    <div key={rev.id} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.25rem", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)" }}>
                      <div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7", padding: "3px 10px", borderRadius: "14px", fontSize: "0.76rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                          <i className="fa-regular fa-calendar-check"></i> {rev.daysRemaining} days remaining
                        </div>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.35rem" }}>
                          {rev.title}
                        </h3>
                        <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{rev.discipline}</div>
                      </div>

                      <Link
                        href={`/reviewer/workspace/${rev.id}`}
                        className="btn btn-primary btn-sm"
                        style={{ padding: "0.55rem 1.25rem", fontSize: "0.86rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}
                      >
                        <span>Open Evaluation Rubric</span>
                        <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Completed Reviews & Credentials */}
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa-solid fa-award" style={{ color: "var(--color-primary)" }}></i>
                Completed Evaluations &amp; Accreditations ({data.completedReviews.length})
              </h2>

              {data.completedReviews.length === 0 ? (
                <div style={{ background: "var(--color-bg-card)", border: "1px dashed var(--color-border)", borderRadius: "12px", padding: "2.5rem 1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                  Completed manuscript reviews will be archived here alongside your verifiable AfriJournal Peer Review Certificates.
                </div>
              ) : (
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "var(--color-bg-card-subtle)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                          <th style={{ padding: "0.85rem 1.25rem" }}>Manuscript Topic</th>
                          <th style={{ padding: "0.85rem 1.25rem" }}>Discipline</th>
                          <th style={{ padding: "0.85rem 1.25rem" }}>Recommendation</th>
                          <th style={{ padding: "0.85rem 1.25rem" }}>Completed Date</th>
                          <th style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>Accreditation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.completedReviews.map((c) => (
                          <tr key={c.id} style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-main)" }}>
                            <td style={{ padding: "1rem 1.25rem", fontWeight: 700 }}>{c.title}</td>
                            <td style={{ padding: "1rem 1.25rem", color: "var(--color-text-muted)" }}>{c.discipline}</td>
                            <td style={{ padding: "1rem 1.25rem" }}>
                              <span style={{ fontSize: "0.75rem", padding: "3px 8px", borderRadius: "10px", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", fontWeight: 700 }}>
                                {c.overallRecommendation?.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td style={{ padding: "1rem 1.25rem", color: "var(--color-text-muted)" }}>
                              {new Date(c.completedAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                              {c.certificateVerificationId && (
                                <Link
                                  href={`/reviewer/verify/${c.certificateVerificationId}`}
                                  target="_blank"
                                  style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 700, fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                >
                                  <i className="fa-solid fa-certificate"></i> View Credential
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Tab: My Submitted Manuscripts (as Author) */
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa-solid fa-file-invoice" style={{ color: "var(--color-primary)" }}></i>
                Lodged Manuscripts ({submissions.length})
              </h2>
              <Link href="/review/submit" className="btn btn-primary btn-sm" style={{ padding: "0.45rem 1rem", fontSize: "0.82rem", textDecoration: "none" }}>
                + Lodge Another Paper
              </Link>
            </div>

            {loadingSubmissions ? (
              <div style={{ textAlign: "center", padding: "3rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.5rem", color: "var(--color-primary)", marginBottom: "0.75rem" }}></i>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Loading your submissions...</div>
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ background: "var(--color-bg-card)", border: "1px dashed var(--color-border)", borderRadius: "12px", padding: "3rem 1.5rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                <i className="fa-regular fa-folder" style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "block" }}></i>
                You have not lodged any manuscripts for peer review yet.
                <div style={{ marginTop: "1rem" }}>
                  <Link href="/review/submit" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
                    Lodge Your First Manuscript
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {submissions.map((sub) => {
                  const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                    MATCHING: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
                    IN_REVIEW: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
                    COMPLETED: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
                    CANCELLED: { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" }
                  };
                  const colors = statusColors[sub.status] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };

                  return (
                    <div key={sub.id} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "1.35rem 1.5rem", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                      <div style={{ flex: 1, minWidth: "280px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.4rem" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, fontFamily: "monospace", color: "var(--color-primary)" }}>
                            {sub.trackingCode}
                          </span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                            {sub.status.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                            {new Date(sub.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.35rem" }}>
                          {sub.title}
                        </h3>

                        <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                          Discipline: <strong style={{ color: "var(--color-text-main)" }}>{sub.discipline}</strong>
                          {sub.targetJournal && (
                            <span> &bull; Target Outlet: <strong style={{ color: "var(--color-text-main)" }}>{sub.targetJournal}</strong></span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Link
                          href={`/review/track/${sub.trackingCode}`}
                          className="btn btn-primary btn-sm"
                          style={{ padding: "0.5rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <i className="fa-solid fa-radar"></i>
                          <span>Live Tracker</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
