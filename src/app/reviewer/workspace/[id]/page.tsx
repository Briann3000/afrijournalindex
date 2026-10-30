"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../../Header";
import Footer from "../../../Footer";

export default function ReviewerWorkspacePage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);

  // Rubric Form State
  const [methodologyScore, setMethodologyScore] = useState<number>(3);
  const [originalityScore, setOriginalityScore] = useState<number>(3);
  const [literatureScore, setLiteratureScore] = useState<number>(3);
  const [integrityScore, setIntegrityScore] = useState<number>(4);
  const [presentationScore, setPresentationScore] = useState<number>(4);
  const [overallRecommendation, setOverallRecommendation] = useState<string>("MINOR_REVISION");

  const [feedbackSummary, setFeedbackSummary] = useState<string>("");
  const [methodologyCritique, setMethodologyCritique] = useState<string>("");
  const [literatureCritique, setLiteratureCritique] = useState<string>("");
  const [actionableRevisions, setActionableRevisions] = useState<string>("");
  const [confidentialNotes, setConfidentialNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedCertId, setSubmittedCertId] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/review/reviewer/workspace/${id}`);
        const result = await res.json();

        if (!res.ok || !result.success) {
          if (res.status === 401) {
            router.push(`/login?redirect=/reviewer/workspace/${id}`);
            return;
          }
          throw new Error(result.error || "Failed to load workspace.");
        }

        setAssignment(result.data);

        if (result.data.rubric) {
          const r = result.data.rubric;
          if (r.methodologyScore) setMethodologyScore(r.methodologyScore);
          if (r.originalityScore) setOriginalityScore(r.originalityScore);
          if (r.literatureScore) setLiteratureScore(r.literatureScore);
          if (r.integrityScore) setIntegrityScore(r.integrityScore);
          if (r.presentationScore) setPresentationScore(r.presentationScore);
          if (r.overallRecommendation) setOverallRecommendation(r.overallRecommendation);
          if (r.feedbackSummary) setFeedbackSummary(r.feedbackSummary);
          if (r.methodologyCritique) setMethodologyCritique(r.methodologyCritique);
          if (r.literatureCritique) setLiteratureCritique(r.literatureCritique);
          if (r.actionableRevisions) setActionableRevisions(r.actionableRevisions);
          if (r.confidentialNotes) setConfidentialNotes(r.confidentialNotes);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionableRevisions.trim() || actionableRevisions.trim().length < 30) {
      alert("Please provide clear, actionable revision requirements for the author (minimum 30 characters).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/review/reviewer/workspace/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          methodologyScore,
          originalityScore,
          literatureScore,
          integrityScore,
          presentationScore,
          overallRecommendation,
          feedbackSummary,
          methodologyCritique,
          literatureCritique,
          actionableRevisions,
          confidentialNotes
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to submit evaluation.");
      }

      setSubmittedCertId(result.certificateVerificationId);
    } catch (err: any) {
      setError(err.message || "Failed to submit evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  const LIKERT_ANCHORS: Record<number, { label: string; desc: string }> = {
    1: { label: "Deficient", desc: "Critical flaws, invalid or missing" },
    2: { label: "Marginal", desc: "Weaknesses outweigh strengths" },
    3: { label: "Sound", desc: "Meets standard academic baseline" },
    4: { label: "Good", desc: "Rigorous and well supported" },
    5: { label: "Exemplary", desc: "Outstanding benchmark quality" },
  };

  const renderRatingGroup = (
    pillarNum: number,
    title: string,
    checkpoint: string,
    value: number,
    onChange: (val: number) => void
  ) => {
    const currentAnchor = LIKERT_ANCHORS[value];
    return (
      <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "var(--color-bg-card-subtle)", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "0.6rem" }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.25rem" }}>
              {pillarNum}. {title}
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", margin: 0, lineHeight: 1.45 }}>
              <strong style={{ color: "var(--color-text-main)" }}>Assessment Checkpoint:</strong> {checkpoint}
            </p>
          </div>
          <div style={{ textAlign: "right", minWidth: "110px" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>
              {value} / 5
            </span>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {currentAnchor?.label}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "0.85rem" }}>
          {[1, 2, 3, 4, 5].map((score) => {
            const isSelected = value === score;
            const anchor = LIKERT_ANCHORS[score];
            return (
              <button
                key={score}
                type="button"
                onClick={() => onChange(score)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.65rem 0.35rem",
                  background: isSelected ? "var(--color-primary)" : "var(--color-bg-card)",
                  color: isSelected ? "#ffffff" : "var(--color-text-main)",
                  border: isSelected ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center"
                }}
                title={anchor.desc}
              >
                <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>{score}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, marginTop: "2px", opacity: isSelected ? 0.95 : 0.75 }}>
                  {anchor.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)", color: "var(--color-text-main)" }}>
      <Header activePage="reviewer" />

      <main style={{ flex: 1, maxWidth: "1050px", margin: "0 auto", padding: "2.5rem 1.5rem 6rem", width: "100%", boxSizing: "border-box" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/reviewer" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Reviewer Workspace</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>Double-Blind Evaluation</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Loading blinded manuscript and rubric...</div>
          </div>
        ) : error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "2rem", textAlign: "center" }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "2.5rem", color: "#dc2626", marginBottom: "1rem" }}></i>
            <h2 style={{ fontSize: "1.3rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Access Denied or Not Found</h2>
            <p style={{ color: "var(--color-text-body)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{error}</p>
            <Link href="/reviewer" className="btn btn-primary btn-sm">Return to Reviewer Hub</Link>
          </div>
        ) : submittedCertId ? (
          /* Submission Complete View */
          <div style={{ background: "var(--color-bg-card)", border: "1px solid #a7f3d0", borderRadius: "14px", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1.25rem" }}>
              <i className="fa-solid fa-certificate"></i>
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.75rem" }}>
              Academic Evaluation Submitted Successfully
            </h2>
            <p style={{ color: "var(--color-text-body)", fontSize: "0.95rem", maxWidth: "620px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
              Thank you for contributing your scholarly expertise to African academic rigor. Your peer review evaluation has been recorded and an official digital Peer Review Certificate has been issued.
            </p>

            <div style={{ display: "inline-block", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "1.25rem 2rem", marginBottom: "2rem" }}>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>Official Verification ID</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-primary)", fontFamily: "monospace", marginTop: "4px" }}>
                {submittedCertId}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <Link href={`/reviewer/verify/${submittedCertId}`} target="_blank" className="btn btn-primary btn-sm" style={{ padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 700, textDecoration: "none" }}>
                <i className="fa-solid fa-eye" style={{ marginRight: "6px" }}></i> View Public Certificate
              </Link>
              <Link href="/reviewer" className="btn btn-secondary btn-sm" style={{ padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none" }}>
                Return to Reviewer Hub
              </Link>
            </div>
          </div>
        ) : assignment && (
          <div>
            {/* Blinded Manuscript Overview Card */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "2rem", marginBottom: "2rem", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "1rem" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7", padding: "4px 10px", borderRadius: "16px", fontSize: "0.78rem", fontWeight: 700 }}>
                  <i className="fa-solid fa-user-secret"></i> Strict Double-Blind Protocol Active
                </div>
                <div style={{ fontSize: "0.84rem", color: "var(--color-primary)", fontWeight: 700 }}>
                  {assignment.manuscript.discipline}
                </div>
              </div>

              <h1 style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "1rem", lineHeight: 1.35 }}>
                {assignment.manuscript.title}
              </h1>

              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
                  Abstract
                </div>
                <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1.25rem", color: "var(--color-text-body)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                  {assignment.manuscript.abstract}
                </div>
              </div>

              {/* Manuscript Document Download */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", background: "var(--color-bg-card-subtle)", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <i className="fa-solid fa-file-pdf" style={{ color: "#dc2626", fontSize: "1.8rem" }}></i>
                  <div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--color-text-main)" }}>Blinded Manuscript File</div>
                    <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>Author credentials sanitized for integrity</div>
                  </div>
                </div>

                <a
                  href={assignment.manuscript.manuscriptFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ padding: "0.45rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="fa-solid fa-download"></i> Open / Download Manuscript
                </a>
              </div>
            </div>

            {/* Evaluation Rubric Form */}
            <form onSubmit={handleSubmit} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "2rem", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)" }}>
              <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.75rem" }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.35rem" }}>
                  Standardized 5-Pillar Academic Quality Rubric
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.86rem", margin: 0 }}>
                  Score each dimension from 1 (deficient) to 5 (exemplary). All 5 dimensions are mandatory.
                </p>
              </div>

              {/* Pillar 1: Methodology */}
              {renderRatingGroup(
                1,
                "Methodology & Research Design",
                "Is the study design appropriate, empirical sampling sufficient, and are statistical/analytical controls valid?",
                methodologyScore,
                setMethodologyScore
              )}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ display: "block", color: "var(--color-text-muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                  Methodology Specific Critique (Optional detailed observations)
                </label>
                <textarea
                  rows={3}
                  value={methodologyCritique}
                  onChange={(e) => setMethodologyCritique(e.target.value)}
                  placeholder="Detail strengths or weaknesses of the sampling framework, analytical methods, or instrument reliability..."
                  style={{ width: "100%", padding: "0.65rem 0.85rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.86rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Pillar 2: Originality */}
              {renderRatingGroup(
                2,
                "Originality & Contextual African Contribution",
                "Does the manuscript advance knowledge, challenge established thinking, or offer high-impact regional insight?",
                originalityScore,
                setOriginalityScore
              )}

              {/* Pillar 3: Literature */}
              {renderRatingGroup(
                3,
                "Literature Alignment & Citation Soundness",
                "Are foundational works and contemporary peer-reviewed studies properly cited, with minimal citation bias?",
                literatureScore,
                setLiteratureScore
              )}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ display: "block", color: "var(--color-text-muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                  Literature &amp; Citation Gaps Critique (Optional)
                </label>
                <textarea
                  rows={3}
                  value={literatureCritique}
                  onChange={(e) => setLiteratureCritique(e.target.value)}
                  placeholder="Note key foundational works, missing contemporary studies, or improper citation formatting..."
                  style={{ width: "100%", padding: "0.65rem 0.85rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.86rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Pillar 4: Academic Integrity */}
              {renderRatingGroup(
                4,
                "Academic Integrity & Research Ethics",
                "Are data provenance, institutional ethical clearances (IRB), and transparent conflict statements accounted for?",
                integrityScore,
                setIntegrityScore
              )}

              {/* Pillar 5: Scientific Presentation */}
              {renderRatingGroup(
                5,
                "Scientific Presentation & Structural Rigor",
                "Is the manuscript logically structured, clearly written, and are figures, tables, and mathematical formulas accurate?",
                presentationScore,
                setPresentationScore
              )}

              {/* Overall Recommendation */}
              <div style={{ marginTop: "2rem", marginBottom: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
                <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                  Overall Scholarly Recommendation <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={overallRecommendation}
                  onChange={(e) => setOverallRecommendation(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-text-main)", fontSize: "0.9rem", outline: "none" }}
                >
                  <option value="ACCEPT_AS_IS">Accept As Is (Ready for publication submission)</option>
                  <option value="MINOR_REVISION">Minor Revisions Required (Needs editorial or citation polishing)</option>
                  <option value="MAJOR_REVISION">Major Revisions Required (Requires substantial methodology/literature re-work)</option>
                  <option value="REJECT_RESUBMIT">Reject &amp; Resubmit to Alternate Venue (Out of scope or fundamentally flawed)</option>
                </select>
              </div>

              {/* Mandatory Actionable Revisions */}
              <div style={{ marginBottom: "2rem" }}>
                <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem" }}>
                  Actionable Revisions for Author <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                  Provide a numbered, actionable list of revisions the author must undertake before lodging to their target outlet.
                </div>
                <textarea
                  rows={6}
                  value={actionableRevisions}
                  onChange={(e) => setActionableRevisions(e.target.value)}
                  placeholder="1. Expand empirical sample from 42 to at least 100 observations to achieve statistical power.&#10;2. Update literature section with recent African regional empirical studies.&#10;3. Clarify ethical clearance documentation for primary field data..."
                  required
                  style={{ width: "100%", padding: "0.75rem 1rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-text-main)", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
                />
              </div>

              {/* Confidential Notes */}
              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.4rem" }}>
                  Confidential Archive Notes (Optional)
                </label>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                  Private notes stored in platform records; not disclosed in the author revision dossier.
                </div>
                <textarea
                  rows={2}
                  value={confidentialNotes}
                  onChange={(e) => setConfidentialNotes(e.target.value)}
                  placeholder="Any private feedback regarding suspected duplicate submission or ethical concerns..."
                  style={{ width: "100%", padding: "0.65rem 0.85rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.86rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Submit Evaluation */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.85rem", fontSize: "1rem", fontWeight: 700, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Submitting Evaluation &amp; Minting Certificate...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-stamp"></i>
                    <span>Submit Academic Evaluation &amp; Issue Certificate</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
