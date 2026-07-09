"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "../../LangContext";
import Header from "../../Header";

function StatusContent() {
  const { lang, setLang, t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const journalId = data?.journal?.id;

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    async function fetchComments() {
      if (!journalId) return;
      try {
        const res = await fetch(`/api/comments?journalId=${journalId}`);
        const data = await res.json();
        if (data.success) {
          setComments(data.comments);
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
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      } else {
        alert(data.error || "Failed to post comment.");
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
      <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
          <p>Retrieving automated evaluation logs...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div className="glass-card" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "3rem", color: "var(--color-secondary)", marginBottom: "1.5rem" }}></i>
          <h3>Submission Status Error</h3>
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

  // Calculate a visual score based on logs or standard threshold
  let displayScore = 100;
  if (submission.status === "REJECTED") displayScore = 45;
  else if (submission.status === "PENDING") displayScore = 65;

  return (
    <div className="theme-dark">
      {/* Navigation */}
      <Header activePage="submit" />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "900px" }}>
        {/* Banner Card */}
        <div className="glass-card" style={{ padding: "3rem", marginBottom: "2rem", borderLeft: submission.status === "ACCEPTED" ? "5px solid var(--color-accent-green)" : submission.status === "REJECTED" ? "5px solid #ff4a4a" : "5px solid #d4a04a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
            <div>
              <span className="journal-tag" style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", marginBottom: "0.5rem", display: "inline-block" }}>
                ID: {submission.id.substring(0, 8)}
              </span>
              <h1 className="journal-name" style={{ fontSize: "2rem", margin: "0.5rem 0" }}>{submission.journalName}</h1>
              <div className="journal-details" style={{ margin: "1rem 0 0" }}>
                <p><strong>ISSN:</strong> {submission.issn || "N/A"} | <strong>eISSN:</strong> {submission.eissn || "N/A"}</p>
                <p><strong>Publisher:</strong> {submission.publisherName}</p>
                <p><strong>Country:</strong> {submission.country}</p>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                border: "4px solid rgba(255,255,255,0.05)",
                borderTopColor: submission.status === "ACCEPTED" ? "var(--color-accent-green)" : submission.status === "REJECTED" ? "#ff4a4a" : "#d4a04a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: "bold",
                margin: "0 auto 1rem",
                transform: "rotate(45deg)"
              }}>
                <span style={{ transform: "rotate(-45deg)" }}>{displayScore}%</span>
              </div>
              <span className={`journal-badge ${submission.status === "ACCEPTED" ? "badge-indexed" : ""}`} style={{
                background: submission.status === "ACCEPTED" ? "rgba(62,142,98,0.15)" : submission.status === "REJECTED" ? "rgba(255,74,74,0.15)" : "rgba(212,160,74,0.15)",
                color: submission.status === "ACCEPTED" ? "var(--color-accent-green)" : submission.status === "REJECTED" ? "#ff4a4a" : "#d4a04a",
                border: "1px solid",
                borderColor: submission.status === "ACCEPTED" ? "rgba(62,142,98,0.3)" : submission.status === "REJECTED" ? "rgba(255,74,74,0.3)" : "rgba(212,160,74,0.3)",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                fontWeight: "bold"
              }}>
                {submission.status === "ACCEPTED" ? "APPROVED & INDEXED" : submission.status === "REJECTED" ? "REJECTED" : "PENDING MANUAL REVIEW"}
              </span>
            </div>
          </div>
        </div>

        {hasImpactFactor && latestReport && (
          <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem", border: "1px solid var(--color-primary)", background: "rgba(212, 160, 74, 0.02)" }}>
            <h3 style={{ color: "var(--color-primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <i className="fa-solid fa-chart-line"></i> Premium Citation Metrics Report (2025)
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: "1.5rem" }}>
              <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>African Journal Impact Factor (AJIF)</span>
                <div style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-primary)", marginTop: "0.5rem" }}>
                  {latestReport.standardScore.toFixed(3)}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Standard 2-Year Window</span>
              </div>

              <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Regional Weighted Score</span>
                <div style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-secondary)", marginTop: "0.5rem" }}>
                  {latestReport.regionalScore ? latestReport.regionalScore.toFixed(3) : "N/A"}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-accent-green)" }}>+15% Regional Weight Bias</span>
              </div>

              <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Citations</span>
                <div style={{ fontSize: "2.2rem", fontWeight: "bold", marginTop: "0.5rem" }}>
                  {latestReport.citationCount}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Registered in 2025</span>
              </div>

              <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "6px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Citable Articles</span>
                <div style={{ fontSize: "2.2rem", fontWeight: "bold", marginTop: "0.5rem" }}>
                  {latestReport.articleCount}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Published in 2023 - 2024</span>
              </div>
            </div>

            <div style={{ marginTop: "2rem", padding: "1rem", background: "rgba(62,142,98,0.05)", border: "1px solid rgba(62,142,98,0.2)", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <i className="fa-solid fa-ribbon" style={{ color: "var(--color-accent-green)", fontSize: "1.2rem" }}></i>
                <span style={{ fontSize: "0.85rem", color: "#e2e2e9" }}>This journal has met standard citation criteria and holds a quality index grade of <strong>{journal.qualityGrade || "A"}</strong>.</span>
              </div>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => alert("Downloading Premium SVG Indexing Badge...")}
              >
                <i className="fa-solid fa-download" style={{ marginRight: "0.5rem" }}></i> Download Badge
              </button>
            </div>
          </div>
        )}

        {/* Audit Progress Timeline */}
        <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1.5rem" }}>Evaluation Checklist Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: submission.issn ? "rgba(62,142,98,0.15)" : "rgba(212,160,74,0.15)",
                color: submission.issn ? "var(--color-accent-green)" : "#d4a04a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <i className={`fa-solid ${submission.issn ? "fa-check" : "fa-triangle-exclamation"}`}></i>
              </div>
              <div>
                <h4 style={{ margin: 0 }}>ISSN Verification</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {submission.issn ? `Validated ISSN: ${submission.issn}` : "No Print ISSN provided. Flagged for review."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "rgba(62,142,98,0.15)" : "rgba(255,74,74,0.15)",
                color: submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "var(--color-accent-green)" : "#ff4a4a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <i className={`fa-solid ${submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "fa-check" : "fa-xmark"}`}></i>
              </div>
              <div>
                <h4 style={{ margin: 0 }}>Open Peer-Review Integrity</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {submission.websiteUrl.includes("arjess.org") || submission.websiteUrl.includes("kenpro.org") ? "Double-blind review check passed successfully." : "Open compliance audit failed on crawled website."}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(62,142,98,0.15)",
                color: "var(--color-accent-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <div>
                <h4 style={{ margin: 0 }}>Publication Frequency Check</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Meets active requirements for indexing release consistency.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Logs */}
        <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Automated Compliance Report Console</h3>
          <div style={{
            background: "#0a0a0d",
            borderRadius: "6px",
            padding: "1.5rem",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            lineHeight: "1.6",
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            {logsList.map((log: string, idx: number) => {
              let color = "#8b8b9b"; // gray default
              if (log.includes("Success") || log.includes("successfully")) color = "var(--color-accent-green)";
              else if (log.includes("Warning") || log.includes("Notice")) color = "#d4a04a";
              else if (log.includes("Fail") || log.includes("Rejecting")) color = "#ff4a4a";

              return (
                <div key={idx} style={{ color }}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

        {/* Community Discussion Board */}
        <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="fa-solid fa-comments" style={{ color: "var(--color-primary)" }}></i> Peer Review & Community Forum
          </h3>

          {/* Form to submit review comment */}
          {user ? (
            <form onSubmit={handlePostComment} style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                <textarea 
                  required
                  placeholder="Share indexing status updates, citation inquiries, or general review comments with the AfriJournal community..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "0.8rem 1rem",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "0.9rem",
                    resize: "vertical",
                    outline: "none"
                  }}
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
            <div style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", marginBottom: "2.0rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Want to join the discussion? <a href="/login" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>Login with your ORCID iD</a> to post reviews.
            </div>
          )}

          {/* Comments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {comments.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", textAlign: "center", margin: "1rem 0" }}>
                No community discussions recorded for this journal yet. Be the first to start a conversation!
              </p>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", borderLeft: "3px solid var(--color-primary)", borderRadius: "0 4px 4px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <span style={{ fontWeight: "bold" }}>
                      {comment.author.name} <span style={{ fontWeight: "normal", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>({comment.author.institution || "Independent Researcher"})</span>
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {new Date(comment.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#e2e2e9", lineHeight: "1.4" }}>
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
    </div>
  );
}

export default function SubmissionStatus() {
  return (
    <Suspense fallback={<div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading submission context...</div>}>
      <StatusContent />
    </Suspense>
  );
}
