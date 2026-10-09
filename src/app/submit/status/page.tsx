"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "../../LangContext";
import Header from "../../Header";
import Footer from "../../Footer";

function StatusContent() {
  const { t } = useLang();
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
          <p>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "var(--color-bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-main)" }}>
        <div className="card-surface" style={{ maxWidth: "480px", textAlign: "center", padding: "3rem", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-border)" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "3rem", color: "var(--color-primary)", marginBottom: "1.5rem" }}></i>
          <h3 style={{ color: "var(--color-text-main)" }}>{t.common.error}</h3>
          <p style={{ margin: "1rem 0", color: "var(--color-text-muted)" }}>{error || "Submission record not found."}</p>
          <a href="/submit" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>{t.submit_page.title}</a>
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

      <main className="container" style={{ padding: "3.5rem 1rem 6rem", maxWidth: "900px" }}>
        {/* Banner Card */}
        <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-border)", borderLeft: submission.status === "ACCEPTED" ? "6px solid #059669" : submission.status === "REJECTED" ? "6px solid #dc2626" : "6px solid #d97706" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <span className="badge badge-slate" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
                ID: {submission.id.substring(0, 8).toUpperCase()}
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
                color: "var(--color-text-main)"
              }}>
                <span>{displayScore}%</span>
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
                {submission.status === "ACCEPTED" ? t.submit_status_page.status_badge_passed : submission.status === "REJECTED" ? t.submit_status_page.status_badge_failed : t.submit_status_page.status_badge_pending}
              </span>
            </div>
          </div>
        </div>

        {hasImpactFactor && latestReport && (
          <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-primary)" }}>
            <h3 style={{ color: "var(--color-primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
              <i className="fa-solid fa-chart-line"></i> {t.journal_page.impact_metrics_title}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: "1.25rem" }}>
              <div style={{ padding: "1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{t.journal_page.standard_ajif}</span>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-primary)", marginTop: "0.4rem" }}>
                  {latestReport.standardScore.toFixed(3)}
                </div>
              </div>

              <div style={{ padding: "1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{t.journal_page.regional_ajif}</span>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-secondary)", marginTop: "0.4rem" }}>
                  {latestReport.regionalScore ? latestReport.regionalScore.toFixed(3) : "N/A"}
                </div>
              </div>

              <div style={{ padding: "1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{t.journal_page.citations_received}</span>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-text-main)", marginTop: "0.4rem" }}>
                  {latestReport.citationCount}
                </div>
              </div>

              <div style={{ padding: "1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", textAlign: "center", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{t.journal_page.citable_articles}</span>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-text-main)", marginTop: "0.4rem" }}>
                  {latestReport.articleCount}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem 1.25rem", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <i className="fa-solid fa-ribbon" style={{ color: "#059669", fontSize: "1.2rem" }}></i>
                <span style={{ fontSize: "0.88rem", color: "#065f46" }}>
                  {t.journal_page.indexed_badge}: <strong>{journal.qualityGrade || "A"}</strong>.
                </span>
              </div>
              <a 
                href={`/journal/${journal.id}`}
                className="btn btn-primary btn-sm"
              >
                {t.browse_page.view_details}
              </a>
            </div>
          </div>
        )}

        {/* Real-time Crawler Logs */}
        <div className="card-surface" style={{ padding: "2rem", marginBottom: "2rem", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="fa-solid fa-terminal" style={{ color: "var(--color-primary)" }}></i>
            {t.submit_status_page.logs_title}
          </h3>

          <div style={{
            background: "#0f172a",
            color: "#38bdf8",
            padding: "1.25rem",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            maxHeight: "260px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem"
          }}>
            {logsList.map((log: string, idx: number) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ color: "#64748b" }}>&gt;</span>
                <span style={{ color: log.includes("PASS") || log.includes("OK") ? "#4ade80" : log.includes("FAIL") ? "#f87171" : "#e2e8f0" }}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Peer Review Discussion Forum */}
        {journalId && (
          <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", background: "#ffffff", border: "1px solid var(--color-border)" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <i className="fa-solid fa-comments" style={{ color: "var(--color-primary)" }}></i>
              {t.journal_page.reviews_title}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              {t.journal_page.reviews_desc}
            </p>

            {/* Post Comment Form */}
            {user ? (
              <form onSubmit={handlePostComment} style={{ marginBottom: "2rem" }}>
                <div className="form-group">
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder={t.submit_status_page.review_placeholder}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "0.75rem" }}
                  disabled={commentLoading}
                >
                  {commentLoading ? t.journal_page.posting : t.submit_status_page.post_review}
                </button>
              </form>
            ) : (
              <div style={{ background: "var(--color-bg-base)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                  {t.journal_page.must_login}
                </span>
                <a href="/login" className="btn btn-secondary btn-sm">{t.journal_page.login_btn}</a>
              </div>
            )}

            {/* Comment List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {comments.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "1.5rem 0", fontStyle: "italic" }}>
                  {t.journal_page.no_reviews}
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ background: "var(--color-bg-base)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <strong style={{ fontSize: "0.92rem", color: "var(--color-text-main)" }}>
                        {c.user?.name || "Verified Peer Reviewer"}
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "var(--color-text-body)", lineHeight: "1.5", margin: 0 }}>
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <StatusContent />
    </Suspense>
  );
}
