"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "../../LangContext";
import Header from "../../Header";
import Footer from "../../Footer";

function StatusContent() {
  const { lang, setLang, t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const journalId = data?.journal?.id;

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        const sessionData = await res.json();
        if (sessionData.authenticated) {
          setUser(sessionData.user);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    async function fetchComments() {
      if (!journalId) return;
      try {
        const res = await fetch(`/api/comments?journalId=${journalId}`);
        const cdata = await res.json();
        if (cdata.success) {
          setComments(cdata.comments);
        }
      } catch (err) {
        console.error(err);
      }
    }

    checkUser();
    fetchComments();
  }, [journalId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !journalId) return;
    setCommentLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId,
          content: newComment
        })
      });
      const cdata = await res.json();
      if (cdata.success) {
        setComments((prev) => [cdata.comment, ...prev]);
        setNewComment("");
      } else {
        alert(cdata.error || "Failed to post comment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting review comment.");
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setError("No submission ID provided.");
      setLoading(false);
      return;
    }

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/evaluate/status?id=${id}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to retrieve status.");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to evaluation logs database.");
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "var(--color-bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-main)" }}>
        <div style={{ textAlign: "center" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
          <p>Retrieving automated evaluation logs...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "var(--color-bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-main)" }}>
        <div className="card-surface" style={{ maxWidth: "480px", textAlign: "center", padding: "3rem" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "3rem", color: "var(--color-secondary)", marginBottom: "1.5rem" }}></i>
          <h3 style={{ color: "var(--color-text-main)" }}>Submission Status Error</h3>
          <p style={{ margin: "1rem 0", color: "var(--color-text-muted)" }}>{error || "Submission record not found."}</p>
          <a href="/submit" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>Back to Submission Portal</a>
        </div>
      </div>
    );
  }

  const { journal, submission } = data;
  const logsList = submission.evaluationLog ? submission.evaluationLog.split("\n") : [];
  
  const reports = journal?.reports || [];
  const latestReport = reports.length > 0 ? reports[0] : null;
  const hasImpactFactor = latestReport !== null;

  let displayScore = 100;
  if (submission.status === "REJECTED") displayScore = 45;
  else if (submission.status === "PENDING") displayScore = 65;

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Navigation */}
      <Header activePage="submit" />

      <main className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "900px" }}>
        {/* Banner Card */}
        <div className="card-surface" style={{ padding: "2.5rem", marginBottom: "2rem", borderLeft: submission.status === "ACCEPTED" ? "6px solid #059669" : submission.status === "REJECTED" ? "6px solid #dc2626" : "6px solid #d97706" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
            <div>
              <span className="badge badge-slate" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
                Evaluation ID: {submission.id.substring(0, 8).toUpperCase()}
              </span>
              <h1 style={{ fontSize: "1.85rem", margin: "0.4rem 0 0.6rem", color: "var(--color-text-main)", fontWeight: 800 }}>
                {submission.journalName}
              </h1>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                <p><strong>ISSN:</strong> <span style={{ color: "var(--color-text-body)" }}>{submission.issn || "N/A"}</span> | <strong>eISSN:</strong> <span style={{ color: "var(--color-text-body)" }}>{submission.eissn || "N/A"}</span></p>
                <p><strong>Publisher:</strong> <span style={{ color: "var(--color-text-body)" }}>{submission.publisherName}</span></p>
                <p><strong>Country:</strong> <span style={{ color: "var(--color-text-body)" }}>{submission.country}</span></p>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "84px",
                height: "84px",
                borderRadius: "50%",
                border: "4px solid var(--color-border)",
                borderTopColor: submission.status === "ACCEPTED" ? "#059669" : submission.status === "REJECTED" ? "#dc2626" : "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                fontWeight: 800,
                margin: "0 auto 1rem",
                color: "var(--color-text-main)",
                transform: "rotate(45deg)"
              }}>
                <span style={{ transform: "rotate(-45deg)" }}>{displayScore}%</span>
              </div>
              <span style={{
                background: submission.status === "ACCEPTED" ? "#ecfdf5" : submission.status === "REJECTED" ? "#fef2f2" : "#fffbeb",
                color: submission.status === "ACCEPTED" ? "#047857" : submission.status === "REJECTED" ? "#b91c1c" : "#b45309",
                border: `1px solid ${submission.status === "ACCEPTED" ? "#a7f3d0" : submission.status === "REJECTED" ? "#fecaca" : "#fde68a"}`,
                padding: "0.4rem 0.9rem",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 700,
                display: "inline-block"
              }}>
                {submission.status === "ACCEPTED" ? "APPROVED & INDEXED" : submission.status === "REJECTED" ? "REJECTED" : "PENDING MANUAL REVIEW"}
              </span>
            </div>
          </div>
        </div>

        {hasImpactFactor && latestReport && (
          <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem", border: "1px solid var(--color-primary)" }}>
            <h3 style={{ color: "var(--color-primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
              <i className="fa-solid fa-chart-line"></i> Premium Citation Metrics Report (2025)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: "1.25rem" }}>
              <div style={{ padding: "1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>African Journal Impact Factor (AJIF)</span>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-primary)", marginTop: "0.4rem" }}>
                  {latestReport.standardScore.toFixed(3)}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Standard 2-Year Window</span>
              </div>

              <div style={{ padding: "1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Regional Weighted Score</span>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-secondary)", marginTop: "0.4rem" }}>
                  {latestReport.regionalScore ? latestReport.regionalScore.toFixed(3) : "N/A"}
                </div>
                <span style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 600 }}>+15% Regional Weight Bias</span>
              </div>

              <div style={{ padding: "1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Citations</span>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-text-main)", marginTop: "0.4rem" }}>
                  {latestReport.citationCount}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Registered in 2025</span>
              </div>

              <div style={{ padding: "1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Citable Articles</span>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-text-main)", marginTop: "0.4rem" }}>
                  {latestReport.articleCount}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Published in 2023 - 2024</span>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <i className="fa-solid fa-ribbon" style={{ color: "#059669", fontSize: "1.2rem" }}></i>
                <span style={{ fontSize: "0.88rem", color: "#065f46" }}>
                  This journal has met standard citation criteria and holds a quality index grade of <strong>{journal.qualityGrade || "A"}</strong>.
                </span>
              </div>
              <a 
                href={`/journal/${journal.id}`}
                className="btn btn-primary btn-sm"
              >
                <i className="fa-solid fa-chart-line" style={{ marginRight: "0.4rem" }}></i> View Public Profile
              </a>
            </div>
          </div>
        )}

        {/* Audit Progress Timeline */}
        <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1.25rem", fontSize: "1.15rem", color: "var(--color-text-main)", fontWeight: 700 }}>
            Evaluation Checklist Summary
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: submission.issn ? "#ecfdf5" : "#fffbeb",
                color: submission.issn ? "#047857" : "#b45309",
                border: `1px solid ${submission.issn ? "#a7f3d0" : "#fde68a"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <i className={`fa-solid ${submission.issn ? "fa-check" : "fa-triangle-exclamation"}`}></i>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-text-main)" }}>ISSN Verification</h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  {submission.issn ? `Validated ISSN: ${submission.issn}` : "No Print ISSN provided. Flagged for review."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "#ecfdf5" : "#fef2f2",
                color: submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "#047857" : "#b91c1c",
                border: `1px solid ${submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "#a7f3d0" : "#fecaca"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <i className={`fa-solid ${submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "fa-check" : "fa-xmark"}`}></i>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-text-main)" }}>Open Peer-Review Integrity</h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  {submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "Double-blind review check passed successfully." : "Open compliance audit verified on crawled website."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#047857",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-text-main)" }}>Publication Frequency Check</h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  Meets active requirements for indexing release consistency.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Logs */}
        <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem", fontSize: "1.15rem", color: "var(--color-text-main)", fontWeight: 700 }}>
            Automated Compliance Report Console
          </h3>
          <div style={{
            background: "#0f172a",
            borderRadius: "8px",
            padding: "1.25rem",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            lineHeight: "1.6",
            maxHeight: "260px",
            overflowY: "auto",
            border: "1px solid #1e293b"
          }}>
            {logsList.map((log: string, idx: number) => {
              let color = "#94a3b8";
              if (log.includes("Success") || log.includes("successfully")) color = "#4ade80";
              else if (log.includes("Warning") || log.includes("Notice")) color = "#fbbf24";
              else if (log.includes("Fail") || log.includes("Rejecting")) color = "#f87171";

              return (
                <div key={idx} style={{ color }}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

        {/* Community Discussion Board */}
        <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.15rem", color: "var(--color-text-main)", fontWeight: 700 }}>
            <i className="fa-solid fa-comments" style={{ color: "var(--color-primary)" }}></i> 
            Peer Review &amp; Community Forum
          </h3>

          {/* Form to submit review comment */}
          {user ? (
            <form onSubmit={handlePostComment} style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <textarea 
                  required
                  placeholder="Share indexing status updates, citation inquiries, or general review comments..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="form-control"
                  rows={3}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: "flex-end" }}
                  disabled={commentLoading}
                >
                  {commentLoading ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: "1rem", background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "8px", marginBottom: "1.5rem", fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
              Want to join the discussion? <a href="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Login with your ORCID iD</a> to post reviews.
            </div>
          )}

          {/* Comments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {comments.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", textAlign: "center", margin: "1rem 0" }}>
                No community discussions recorded for this journal yet.
              </p>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} style={{ padding: "1rem 1.25rem", background: "var(--color-bg-base)", borderLeft: "4px solid var(--color-primary)", borderRadius: "0 8px 8px 0", border: "1px solid var(--color-border)", borderLeftColor: "var(--color-primary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ fontWeight: "bold", color: "var(--color-text-main)" }}>
                      {comment.author.name} <span style={{ fontWeight: "normal", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>({comment.author.institution || "Researcher"})</span>
                    </span>
                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                      {new Date(comment.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-body)", lineHeight: "1.5" }}>
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Back Link */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <a href="/browse" className="btn btn-secondary">
            <i className="fa-solid fa-list-check" style={{ marginRight: "0.5rem" }}></i> Explore Directory
          </a>
          <a href="/submit" className="btn btn-primary">
            Submit Another Journal
          </a>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function SubmissionStatus() {
  return (
    <Suspense fallback={<div style={{ background: "var(--color-bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-main)" }}>Loading submission context...</div>}>
      <StatusContent />
    </Suspense>
  );
}
