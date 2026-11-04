"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../../Header";
import Footer from "../../../Footer";

export default function ReviewerTokenInvitePage() {
  const params = useParams();
  const token = (params?.token as string) || "";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);

  const [responding, setResponding] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Decline Modal State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("Workload and scheduling constraints");
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [nomineeInstitution, setNomineeInstitution] = useState("");

  useEffect(() => {
    async function loadInvitation() {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/review/reviewer/invite/${token}`);
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || "Failed to load review invitation.");
        }

        setInviteData(result.data);
      } catch (err: any) {
        setError(err.message || "An error occurred while loading this invitation.");
      } finally {
        setLoading(false);
      }
    }
    loadInvitation();
  }, [token]);

  const handleAccept = async () => {
    setResponding(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/review/reviewer/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to accept review invitation.");
      }

      setActionMessage({ type: "success", text: data.message });
      if (data.workspaceUrl) {
        setTimeout(() => {
          router.push(data.workspaceUrl);
        }, 1200);
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Could not accept invitation." });
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponding(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/review/reviewer/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DECLINE",
          declineReason,
          nominatedColleague: nomineeName.trim() ? {
            name: nomineeName.trim(),
            email: nomineeEmail.trim() || undefined,
            institution: nomineeInstitution.trim() || undefined
          } : undefined
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to decline invitation.");
      }

      setShowDeclineModal(false);
      setInviteData((prev: any) => prev ? { ...prev, status: "DECLINED" } : null);
      setActionMessage({ type: "success", text: data.message });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Could not decline invitation." });
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)", color: "var(--color-text-main)" }}>
      <Header activePage="reviewer" />

      <main style={{ flex: 1, maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem 6rem", width: "100%", boxSizing: "border-box" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/reviewer" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Peer Review Portal</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>Referee Invitation</span>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div style={{
            background: actionMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${actionMessage.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            borderRadius: "8px",
            padding: "1rem 1.25rem",
            color: actionMessage.type === "success" ? "#065f46" : "#b91c1c",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <i className={`fa-solid ${actionMessage.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`}></i>
            <span>{actionMessage.text}</span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Loading peer review invitation details...</div>
          </div>
        ) : error ? (
          <div style={{ background: "var(--color-bg-card)", border: "1px solid #fecaca", borderRadius: "14px", padding: "3rem 2rem", textAlign: "center" }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "2.5rem", color: "#dc2626", marginBottom: "1rem" }}></i>
            <h2 style={{ fontSize: "1.35rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Invitation Unavailable</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", maxWidth: "540px", margin: "0 auto 1.5rem" }}>{error}</p>
            <Link href="/reviewer" className="btn btn-primary btn-sm">Return to Peer Review Portal</Link>
          </div>
        ) : inviteData && (
          <div>
            {/* Main Invitation Card */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "2.5rem 2rem", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)", marginBottom: "2rem" }}>
              
              {/* Header Badge & Timer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "1.25rem", marginBottom: "1.75rem" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--color-primary-light)", border: "1px solid rgba(180, 83, 9, 0.25)", color: "var(--color-primary)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <i className="fa-solid fa-graduation-cap"></i> African Scholarly Peer Review Registry
                </div>

                {inviteData.status === "INVITED" && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef3c7", border: "1px solid #fde68a", color: "#b45309", padding: "4px 12px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700 }}>
                    <i className="fa-solid fa-clock"></i>
                    <span>{inviteData.hoursRemaining} hours left to respond</span>
                  </div>
                )}

                {inviteData.status === "ACCEPTED" && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "4px 12px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700 }}>
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Invitation Accepted</span>
                  </div>
                )}

                {inviteData.status === "DECLINED" && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "4px 12px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700 }}>
                    <i className="fa-solid fa-circle-xmark"></i>
                    <span>Invitation Declined</span>
                  </div>
                )}
              </div>

              {/* Salutation */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
                  Double-Blind Academic Referee Invitation
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
                  Dear <strong>{inviteData.reviewerName}</strong>{inviteData.reviewerInstitution ? ` (${inviteData.reviewerInstitution})` : ""}, because of your recognized research and publication contributions in <strong>{inviteData.manuscript.discipline}</strong>, you have been invited to conduct a standardized double-blind peer review.
                </p>
              </div>

              {/* Blinded Manuscript Card */}
              <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "0.6rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Blinded Manuscript Submission
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    Field: <strong style={{ color: "var(--color-text-main)" }}>{inviteData.manuscript.discipline}</strong>
                  </span>
                </div>

                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.75rem", lineHeight: 1.35 }}>
                  {inviteData.manuscript.title}
                </h2>

                <div style={{ fontSize: "0.86rem", color: "var(--color-text-body)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                  {inviteData.manuscript.abstract}
                </div>
              </div>

              {/* Credential & Evaluation Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ color: "var(--color-primary)", fontSize: "1.1rem", marginBottom: "0.4rem" }}>
                    <i className="fa-solid fa-stopwatch"></i>
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-text-main)" }}>10-Day Evaluation Window</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", marginTop: "2px" }}>Structured 5-pillar rubric to minimize referee fatigue</div>
                </div>

                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ color: "#059669", fontSize: "1.1rem", marginBottom: "0.4rem" }}>
                    <i className="fa-solid fa-certificate"></i>
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-text-main)" }}>Verifiable Certificate</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", marginTop: "2px" }}>Tamper-proof CERT ID with CPD recognition</div>
                </div>

                <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1rem" }}>
                  <div style={{ color: "#2563eb", fontSize: "1.1rem", marginBottom: "0.4rem" }}>
                    <i className="fa-solid fa-user-shield"></i>
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--color-text-main)" }}>Strict Double-Blind</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", marginTop: "2px" }}>Author identities and affiliations sanitized</div>
                </div>
              </div>

              {/* Action Buttons */}
              {inviteData.status === "INVITED" && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: "1.75rem" }}>
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={responding}
                    className="btn btn-primary"
                    style={{ padding: "0.75rem 1.75rem", fontSize: "0.95rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <i className={`fa-solid ${responding ? "fa-spinner fa-spin" : "fa-check"}`}></i>
                    <span>Accept Review (10-Day Window)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeclineModal(true)}
                    disabled={responding}
                    className="btn btn-secondary"
                    style={{ padding: "0.75rem 1.5rem", fontSize: "0.95rem", fontWeight: 600, color: "#dc2626", border: "1px solid #fecaca", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                    <span>Decline Invitation</span>
                  </button>
                </div>
              )}

              {inviteData.status === "ACCEPTED" && (
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                    You have accepted this review assignment. You can evaluate the manuscript directly in your workspace.
                  </span>
                  <Link
                    href={`/reviewer/workspace/${inviteData.assignmentId}`}
                    className="btn btn-primary btn-sm"
                    style={{ padding: "0.6rem 1.5rem", fontSize: "0.88rem", fontWeight: 700 }}
                  >
                    Open Reviewer Workspace &rarr;
                  </Link>
                </div>
              )}

              {inviteData.status === "DECLINED" && (
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                  You have declined this review invitation. The sequential cascading system has notified the editorial desk and advanced to the next specialist candidate. Thank you for notifying us.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decline Modal */}
        {showDeclineModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", width: "100%", maxWidth: "560px", padding: "2rem", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)", boxSizing: "border-box" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
                Decline Peer Review Invitation
              </h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", lineHeight: 1.5, margin: "0 0 1.25rem" }}>
                Your feedback helps our editorial desk maintain sequential cascade efficiency in accordance with COPE standards.
              </p>

              <form onSubmit={handleDecline}>
                {/* Reason Select */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                    Reason for Declining
                  </label>
                  <select
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.84rem", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="Workload and scheduling constraints">Workload / scheduling constraints</option>
                    <option value="Topic is outside my core sub-disciplinary expertise">Topic is outside my core sub-disciplinary expertise</option>
                    <option value="Potential conflict of interest">Potential conflict of interest</option>
                    <option value="Leave or sabbatical">On research leave / sabbatical</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Optional Colleague Nomination */}
                <div style={{ marginBottom: "1.5rem", padding: "0.85rem", background: "var(--color-bg-card-subtle)", border: "1px dashed var(--color-border)", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.25rem" }}>
                    Nominate an Alternate Referee (Optional)
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.6rem" }}>
                    Suggest a qualified colleague in this field to be prioritized in the evaluation cascade.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "6px" }}>
                    <input
                      type="text"
                      placeholder="Colleague Full Name"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      style={{ padding: "0.45rem 0.65rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--color-text-main)", outline: "none" }}
                    />
                    <input
                      type="email"
                      placeholder="Colleague Email (if known)"
                      value={nomineeEmail}
                      onChange={(e) => setNomineeEmail(e.target.value)}
                      style={{ padding: "0.45rem 0.65rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--color-text-main)", outline: "none" }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Colleague Institution / University"
                    value={nomineeInstitution}
                    onChange={(e) => setNomineeInstitution(e.target.value)}
                    style={{ width: "100%", padding: "0.45rem 0.65rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "6px", fontSize: "0.8rem", color: "var(--color-text-main)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Modal Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowDeclineModal(false)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.84rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={responding}
                    className="btn btn-primary btn-sm"
                    style={{ padding: "0.5rem 1.25rem", fontSize: "0.84rem", fontWeight: 700, background: "#dc2626", borderColor: "#dc2626" }}
                  >
                    {responding ? "Declining..." : "Confirm Decline"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
