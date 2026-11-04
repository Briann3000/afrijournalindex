"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../Header";
import Footer from "../../../Footer";

export default function ReviewTrackPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Invitation letter & revision modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFileUrl, setRevisionFileUrl] = useState("");
  const [rebuttalNotes, setRebuttalNotes] = useState("");
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchTracking() {
      if (!code) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/review/track/${code}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Review record not found.");
        }
        setReviewData(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to load tracking data.");
      } finally {
        setLoading(false);
      }
    }
    fetchTracking();
  }, [code]);

  const printDossier = () => {
    window.print();
  };

  const handleRevisionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setRevisionMessage({ type: "error", text: "File exceeds maximum size limit of 25MB." });
      return;
    }

    setUploadingRevision(true);
    setRevisionMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "revisions");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload revised manuscript.");
      }

      setRevisionFileUrl(data.url || data.fileUrl);
      setRevisionMessage({ type: "success", text: `Revised manuscript "${file.name}" uploaded successfully.` });
    } catch (err: any) {
      setRevisionMessage({ type: "error", text: err.message || "Failed to upload file." });
    } finally {
      setUploadingRevision(false);
    }
  };

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionFileUrl) {
      setRevisionMessage({ type: "error", text: "Please upload your revised manuscript document." });
      return;
    }

    if (!rebuttalNotes.trim() || rebuttalNotes.trim().length < 20) {
      setRevisionMessage({ type: "error", text: "Please provide a detailed author response / rebuttal letter addressing reviewer feedback (min 20 characters)." });
      return;
    }

    setSubmittingRevision(true);
    setRevisionMessage(null);

    try {
      const res = await fetch(`/api/review/track/${code}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revisedFileUrl: revisionFileUrl,
          rebuttalNotes: rebuttalNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit revision.");
      }

      setRevisionMessage({ type: "success", text: "Revision and author rebuttal successfully recorded and notified to the peer review desk." });
      setTimeout(() => {
        setShowRevisionModal(false);
      }, 2000);
    } catch (err: any) {
      setRevisionMessage({ type: "error", text: err.message || "Could not submit revision." });
    } finally {
      setSubmittingRevision(false);
    }
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "ACCEPT_AS_IS":
        return { label: "Accept As Is", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
      case "MINOR_REVISION":
        return { label: "Minor Revisions Required", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" };
      case "MAJOR_REVISION":
        return { label: "Major Revisions Required", color: "#b45309", bg: "#fef3c7", border: "#fde68a" };
      case "REJECT_RESUBMIT":
        return { label: "Reject & Resubmit to Alternate Venue", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
      default:
        return { label: rec || "Under Review", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" };
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)", color: "var(--color-text-main)" }}>
      <Header activePage="review" />

      <main style={{ flex: 1, maxWidth: "1000px", margin: "0 auto", padding: "2.5rem 1.5rem 6rem", width: "100%", boxSizing: "border-box" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/review/submit" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Reviewer Portal</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>Tracking: {code}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Retrieving real-time manuscript review status...</div>
          </div>
        ) : error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "2rem", textAlign: "center" }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "2.5rem", color: "#dc2626", marginBottom: "1rem" }}></i>
            <h2 style={{ fontSize: "1.3rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Tracking Record Not Found</h2>
            <p style={{ color: "var(--color-text-body)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{error}</p>
            <Link href="/review/submit" className="btn btn-primary btn-sm" style={{ padding: "0.5rem 1.25rem", textDecoration: "none" }}>
              Lodge a Manuscript
            </Link>
          </div>
        ) : reviewData && (
          <>
            {/* Header Status Card */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "1.75rem 2rem", marginBottom: "2rem", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--color-primary-light)", border: "1px solid rgba(180, 83, 9, 0.25)", color: "var(--color-primary)", padding: "3px 10px", borderRadius: "16px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.5px", marginBottom: "0.5rem" }}>
                    <i className="fa-solid fa-barcode"></i> {reviewData.trackingCode}
                  </div>
                  <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.5rem", lineHeight: 1.3 }}>
                    {reviewData.title}
                  </h1>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "0.84rem", color: "var(--color-text-muted)" }}>
                    <span><i className="fa-solid fa-graduation-cap" style={{ marginRight: "4px", color: "var(--color-primary)" }}></i> {reviewData.discipline}</span>
                    {reviewData.targetJournal && (
                      <span><i className="fa-solid fa-bullseye" style={{ marginRight: "4px", color: "var(--color-primary)" }}></i> Target: {reviewData.targetJournal}</span>
                    )}
                    <span><i className="fa-regular fa-calendar" style={{ marginRight: "4px" }}></i> Lodged {new Date(reviewData.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {reviewData.status === "COMPLETED" && (
                  <button
                    onClick={printDossier}
                    className="btn btn-secondary btn-sm"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.5rem 1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    <i className="fa-solid fa-print"></i> Print Official Dossier
                  </button>
                )}
              </div>

              {/* Progress Milestones */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.75rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
                
                {/* Stage 1 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800 }}>
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--color-text-main)" }}>Lodged &amp; Verified</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>Document verified</div>
                  </div>
                </div>

                {/* Stage 2 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: reviewData.status !== "AWAITING_REVIEWER" ? "#ecfdf5" : "#fef3c7", border: reviewData.status !== "AWAITING_REVIEWER" ? "1px solid #a7f3d0" : "1px solid #fde68a", color: reviewData.status !== "AWAITING_REVIEWER" ? "#059669" : "#b45309", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800 }}>
                    {reviewData.status !== "AWAITING_REVIEWER" ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-clock"></i>}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--color-text-main)" }}>Reviewer Invitation</div>
                    <div style={{ fontSize: "0.74rem", color: reviewData.status === "AWAITING_REVIEWER" ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                      {reviewData.status === "AWAITING_REVIEWER" 
                        ? `${reviewData.currentStage?.countdownHours ?? 48}h response window` 
                        : "Reviewer accepted"}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      style={{ background: "none", border: "none", padding: 0, color: "var(--color-primary)", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "2px" }}
                    >
                      <i className="fa-solid fa-envelope-open-text"></i>
                      <span>View Dispatched Invitation</span>
                    </button>
                  </div>
                </div>

                {/* Stage 3 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: reviewData.status === "COMPLETED" ? "#ecfdf5" : (reviewData.status === "UNDER_REVIEW" ? "#f0f9ff" : "var(--color-bg-card-subtle)"), border: reviewData.status === "COMPLETED" ? "1px solid #a7f3d0" : (reviewData.status === "UNDER_REVIEW" ? "1px solid #bae6fd" : "1px solid var(--color-border)"), color: reviewData.status === "COMPLETED" ? "#059669" : (reviewData.status === "UNDER_REVIEW" ? "#0284c7" : "var(--color-text-muted)"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800 }}>
                    {reviewData.status === "COMPLETED" ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--color-text-main)" }}>Double-Blind Scrutiny</div>
                    <div style={{ fontSize: "0.74rem", color: reviewData.status === "UNDER_REVIEW" ? "#0284c7" : "var(--color-text-muted)" }}>
                      {reviewData.status === "UNDER_REVIEW"
                        ? `${reviewData.currentStage?.deadlineDays ?? 10} days remaining`
                        : (reviewData.status === "COMPLETED" ? "Evaluation completed" : "In queue")}
                    </div>
                  </div>
                </div>

                {/* Stage 4 */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: reviewData.status === "COMPLETED" ? "#ecfdf5" : "var(--color-bg-card-subtle)", border: reviewData.status === "COMPLETED" ? "1px solid #a7f3d0" : "1px solid var(--color-border)", color: reviewData.status === "COMPLETED" ? "#059669" : "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800 }}>
                    <i className="fa-solid fa-stamp"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--color-text-main)" }}>Evaluation Dossier</div>
                    <div style={{ fontSize: "0.74rem", color: reviewData.status === "COMPLETED" ? "#059669" : "var(--color-text-muted)" }}>
                      {reviewData.status === "COMPLETED" ? "Official Seal issued" : "Pending completion"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluation Dossier Output */}
            {reviewData.evaluationReport ? (
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "2.5rem", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)" }}>
                
                {/* Official Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--color-border)", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
                  <div>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                      Afri<span style={{ color: "var(--color-primary)" }}>Journal Index</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                      Standardized Pre-Submission Peer Review Evaluation Report
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Verification Reference</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--color-primary)", fontFamily: "monospace" }}>
                      {reviewData.evaluationReport.certificateVerificationId || "VERIFIED-SEAL"}
                    </div>
                  </div>
                </div>

                {/* Recommendation Banner */}
                {(() => {
                  const badge = getRecommendationBadge(reviewData.evaluationReport.overallRecommendation);
                  return (
                    <div style={{ background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: "10px", padding: "1.25rem 1.5rem", marginBottom: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <div style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: badge.color }}>
                          Peer Review Specialist Verdict
                        </div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", marginTop: "2px" }}>
                          {badge.label}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                          Completed on {new Date(reviewData.evaluationReport.completedAt).toLocaleDateString()}
                        </div>
                        {["MINOR_REVISION", "MAJOR_REVISION"].includes(reviewData.evaluationReport.overallRecommendation) && (
                          <button
                            type="button"
                            onClick={() => setShowRevisionModal(true)}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: "0.82rem", padding: "0.4rem 1rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                          >
                            <i className="fa-solid fa-file-arrow-up"></i>
                            <span>Submit Revised Manuscript &amp; Rebuttal</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 5-Pillar Scorecard Grid */}
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "1rem" }}>
                  Five-Pillar Academic Quality Metric Scorecard
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
                  {[
                    { label: "Methodology & Design", score: reviewData.evaluationReport.methodologyScore, icon: "fa-flask" },
                    { label: "Originality & Novelty", score: reviewData.evaluationReport.originalityScore, icon: "fa-lightbulb" },
                    { label: "Literature Alignment", score: reviewData.evaluationReport.literatureScore, icon: "fa-book-bookmark" },
                    { label: "Academic Integrity", score: reviewData.evaluationReport.integrityScore, icon: "fa-shield-halved" },
                    { label: "Structure & Tone", score: reviewData.evaluationReport.presentationScore, icon: "fa-pen-fancy" }
                  ].map((p, idx) => (
                    <div key={idx} style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem 1rem", textAlign: "center" }}>
                      <i className={`fa-solid ${p.icon}`} style={{ color: "var(--color-primary)", fontSize: "1.2rem", marginBottom: "0.5rem" }}></i>
                      <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                        {p.score ?? "-"}<span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>/5</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px", fontWeight: 600 }}>{p.label}</div>
                    </div>
                  ))}
                </div>

                {/* Actionable Revisions */}
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-list-check" style={{ color: "var(--color-primary)" }}></i>
                    Mandatory Actionable Revisions for Author
                  </h3>
                  <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.5rem", color: "var(--color-text-body)", fontSize: "0.92rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                    {reviewData.evaluationReport.actionableRevisions}
                  </div>
                </div>

                {/* Methodology Specific Critique */}
                {reviewData.evaluationReport.methodologyCritique && (
                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                      Methodology &amp; Empirical Soundness Scrutiny
                    </h4>
                    <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", color: "var(--color-text-body)", fontSize: "0.88rem", lineHeight: 1.55, whiteSpace: "pre-line" }}>
                      {reviewData.evaluationReport.methodologyCritique}
                    </div>
                  </div>
                )}

                {/* Literature Critique */}
                {reviewData.evaluationReport.literatureCritique && (
                  <div style={{ marginBottom: "2rem" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                      Literature Review &amp; Contemporary Citation Gaps
                    </h4>
                    <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem", color: "var(--color-text-body)", fontSize: "0.88rem", lineHeight: 1.55, whiteSpace: "pre-line" }}>
                      {reviewData.evaluationReport.literatureCritique}
                    </div>
                  </div>
                )}

                {/* Seal Footer */}
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    Issued by the AfriJournal Index Peer Review Desk in accordance with international Committee on Publication Ethics (COPE) double-blind standards.
                  </div>
                  {reviewData.evaluationReport.certificateVerificationId && (
                    <Link
                      href={`/reviewer/verify/${reviewData.evaluationReport.certificateVerificationId}`}
                      target="_blank"
                      style={{ fontSize: "0.82rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 700 }}
                    >
                      Audit Official Verification Record &rarr;
                    </Link>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)" }}>
                <i className="fa-solid fa-hourglass-half" style={{ fontSize: "2.5rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                  Independent Review in Progress
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", maxWidth: "600px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                  Your manuscript is currently undergoing double-blind scrutiny. You can bookmark this page—once the evaluation is completed, your complete 5-pillar scorecard and revision dossier will automatically appear here.
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "10px", marginTop: "1rem" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", padding: "8px 16px", borderRadius: "8px", fontSize: "0.84rem", color: "var(--color-text-body)" }}>
                    <i className="fa-solid fa-link" style={{ color: "var(--color-primary)" }}></i>
                    <span>Tracking link: <strong style={{ color: "var(--color-text-main)" }}>{typeof window !== "undefined" ? `${window.location.origin}/review/track/${reviewData.trackingCode}` : `/review/track/${reviewData.trackingCode}`}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/review/track/${reviewData.trackingCode}`;
                      navigator.clipboard.writeText(url);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2500);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: "0.82rem", padding: "0.45rem 1rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <i className={`fa-solid ${copiedUrl ? "fa-check" : "fa-copy"}`}></i>
                    <span>{copiedUrl ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= INVITATION LETTER MODAL ================= */}
            {showInviteModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", width: "100%", maxWidth: "660px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)", boxSizing: "border-box" }}>
                  <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="fa-solid fa-envelope-open-text" style={{ color: "var(--color-primary)" }}></i>
                      <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--color-text-main)" }}>Dispatched Referee Invitation</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      style={{ background: "none", border: "none", fontSize: "1.2rem", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  <div style={{ padding: "1.5rem", fontSize: "0.9rem", color: "var(--color-text-body)", lineHeight: 1.6 }}>
                    <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.82rem" }}>
                      <div><strong>Subject:</strong> [Peer Review Invitation] &quot;{reviewData.title.slice(0, 60)}...&quot; - AfriJournal Index</div>
                      <div><strong>Protocol:</strong> Double-Blind Sequential Cascade (48-Hour Response Limit)</div>
                      <div><strong>Referee Status:</strong> {reviewData.status === "AWAITING_REVIEWER" ? `Pending Response (${reviewData.currentStage?.countdownHours ?? 48}h remaining)` : "Accepted"}</div>
                    </div>

                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem", background: "#ffffff", color: "#1e293b", fontFamily: "Arial, sans-serif" }}>
                      <div style={{ borderBottom: "2px solid #b45309", paddingBottom: "8px", marginBottom: "14px" }}>
                        <strong style={{ color: "#0f172a", fontSize: "1.1rem" }}>AfriJournal Index Peer Review Registry</strong>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Double-Blind Academic Referee Invitation</div>
                      </div>

                      <p style={{ margin: "0 0 10px" }}>Dear Colleague,</p>
                      <p style={{ margin: "0 0 12px", fontSize: "13.5px" }}>
                        Because of your recognized scholarship and peer-reviewed contributions in <strong>{reviewData.discipline}</strong>, you have been invited to conduct a standardized double-blind evaluation for a manuscript titled:
                      </p>

                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 14px", margin: "14px 0", borderRadius: "6px" }}>
                        <strong style={{ color: "#0f172a", fontSize: "14px" }}>&quot;{reviewData.title}&quot;</strong>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Discipline: {reviewData.discipline}</div>
                      </div>

                      <p style={{ fontSize: "13px", margin: "0 0 12px" }}>
                        <strong>Response Window:</strong> In accordance with the AfriJournal sequential cascading protocol, please accept or decline this invitation within <strong>48 hours</strong>.
                      </p>

                      <p style={{ fontSize: "12px", color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: "12px", margin: 0 }}>
                        Upon completion, you will receive an official verifiable <strong>AfriJournal Peer Review Certificate</strong> with CPD credentials and recognition in your scholar profile dossier.
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: "0.85rem 1.5rem", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-card-subtle)", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "0.4rem 1.25rem", fontSize: "0.85rem" }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= AUTHOR REVISION RESUBMISSION MODAL ================= */}
            {showRevisionModal && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", padding: "2rem", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="fa-solid fa-file-arrow-up" style={{ color: "var(--color-primary)" }}></i>
                      <span>Submit Revised Manuscript &amp; Rebuttal</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowRevisionModal(false)}
                      style={{ background: "none", border: "none", fontSize: "1.2rem", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
                    Upload your revised manuscript (PDF or Word) addressing the reviewer&apos;s actionable revisions, accompanied by a point-by-point response letter.
                  </p>

                  {revisionMessage && (
                    <div style={{
                      background: revisionMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
                      border: `1px solid ${revisionMessage.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                      borderRadius: "8px",
                      padding: "0.85rem 1rem",
                      color: revisionMessage.type === "success" ? "#065f46" : "#b91c1c",
                      fontSize: "0.86rem",
                      marginBottom: "1rem"
                    }}>
                      {revisionMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleRevisionSubmit}>
                    {/* File Upload Slot */}
                    <div style={{ marginBottom: "1.25rem" }}>
                      <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.35rem" }}>
                        Revised Manuscript Document (.PDF, .DOCX) <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleRevisionFileUpload}
                        style={{ width: "100%", padding: "0.55rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "0.82rem", color: "var(--color-text-main)" }}
                      />
                      {uploadingRevision && (
                        <div style={{ fontSize: "0.78rem", color: "var(--color-primary)", marginTop: "4px" }}>
                          <i className="fa-solid fa-spinner fa-spin"></i> Uploading revised manuscript file...
                        </div>
                      )}
                      {revisionFileUrl && (
                        <div style={{ fontSize: "0.78rem", color: "#059669", marginTop: "4px", fontWeight: 700 }}>
                          <i className="fa-solid fa-circle-check"></i> Document attached and ready
                        </div>
                      )}
                    </div>

                    {/* Point-by-Point Author Rebuttal Letter */}
                    <div style={{ marginBottom: "1.5rem" }}>
                      <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.35rem" }}>
                        Author Point-by-Point Rebuttal / Response Letter <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <textarea
                        rows={5}
                        value={rebuttalNotes}
                        onChange={(e) => setRebuttalNotes(e.target.value)}
                        placeholder="Detail how each actionable revision was addressed (e.g. 'Revision 1: Added empirical sampling explanation in Section 3.2. Revision 2: Expanded literature review with contemporary African sources...')"
                        required
                        style={{ width: "100%", padding: "0.65rem 0.85rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
                      />
                    </div>

                    {/* Submit Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setShowRevisionModal(false)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingRevision || uploadingRevision || !revisionFileUrl}
                        className="btn btn-primary btn-sm"
                        style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", fontWeight: 700 }}
                      >
                        {submittingRevision ? "Recording Revision..." : "Submit Revised Manuscript"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
