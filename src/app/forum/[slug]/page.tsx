"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../Header";
import Footer from "../../Footer";
import { useLang } from "../../LangContext";

interface Author {
  id: string;
  name: string;
  role: string;
  institution: string | null;
  department: string | null;
  country: string | null;
  totalCitations: number;
  hIndex: number;
  googleScholarId: string | null;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface Topic {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewsCount: number;
  category: { id: string; name: string; slug: string; icon: string };
  author: Author;
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLang();
  const f = t.forum || {};
  const slug = params?.slug as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reply state
  const [replyContent, setReplyContent] = useState<string>("");
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.authenticated) {
          setUser(data.user);
        }
      } catch {
        // Guest mode
      }
    }
    checkAuth();
  }, []);

  // Fetch topic thread
  useEffect(() => {
    async function loadThread() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/forum/topics/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.success && data.topic) {
          setTopic(data.topic);
        } else {
          setError(data.error || "Discussion thread not found.");
        }
      } catch {
        setError("Network error loading discussion thread.");
      } finally {
        setLoading(false);
      }
    }
    loadThread();
  }, [slug]);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !topic) return;

    if (!user) {
      router.push(`/login?redirect=/forum/${encodeURIComponent(topic.slug)}`);
      return;
    }

    setSubmittingReply(true);
    setReplyError(null);

    try {
      const res = await fetch(`/api/forum/topics/${encodeURIComponent(topic.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim() })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setTopic(prev => prev ? {
          ...prev,
          replies: [...prev.replies, data.reply]
        } : null);
        setReplyContent("");
      } else {
        setReplyError(data.error || "Failed to post reply.");
      }
    } catch {
      setReplyError("Network error submitting your reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />

      <main style={{ padding: "2.5rem 0 5rem", background: "var(--color-bg-base)", minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: "980px" }}>

          {/* Breadcrumb Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            <Link href="/forum" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 700 }}>
              <i className="fa-solid fa-arrow-left" style={{ marginRight: "4px" }}></i> {f.title || "AfriScholarChat"}
            </Link>
            <span>/</span>
            {topic?.category && (
              <>
                <Link href={`/forum?category=${topic.category.slug}`} style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                  {topic.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span style={{ color: "var(--color-navy)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {topic?.title || "Discussion Thread"}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.5rem" }}></i> Loading thread...
            </div>
          ) : error || !topic ? (
            <div style={{ padding: "3rem", background: "var(--color-bg-card)", borderRadius: "14px", border: "1px solid var(--color-border)", textAlign: "center" }}>
              <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "2rem", color: "#dc2626", marginBottom: "0.8rem" }}></i>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-navy)" }}>{error || "Thread Not Found"}</h3>
              <Link href="/forum" className="btn btn-primary btn-sm" style={{ marginTop: "1rem" }}>
                {f.return_to_chat || "Return to AfriScholarChat"}
              </Link>
            </div>
          ) : (
            <div>

              {/* Original Post (Topic Question) Card */}
              <div style={{ background: "var(--color-bg-card)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "2rem", marginBottom: "2rem", boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.06)" }}>
                {/* Topic Metadata Badges */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, background: "rgba(180, 83, 9, 0.12)", color: "var(--color-primary)", padding: "0.2rem 0.65rem", borderRadius: "6px" }}>
                      <i className={`fa-solid ${topic.category.icon}`} style={{ marginRight: "4px" }}></i>
                      {topic.category.name}
                    </span>
                    {topic.isPinned && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, background: "#fee2e2", color: "#b91c1c", padding: "0.2rem 0.65rem", borderRadius: "6px" }}>
                        <i className="fa-solid fa-thumbtack" style={{ marginRight: "4px" }}></i> {f.pinned || "Pinned"}
                      </span>
                    )}
                    {topic.isLocked && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, background: "#f1f5f9", color: "#475569", padding: "0.2rem 0.65rem", borderRadius: "6px" }}>
                        <i className="fa-solid fa-lock" style={{ marginRight: "4px" }}></i> {f.locked || "Locked"}
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    <i className="fa-regular fa-eye" style={{ marginRight: "4px" }}></i> {topic.viewsCount} {f.views || "views"}
                  </span>
                </div>

                <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--color-navy)", margin: "0 0 1.25rem", lineHeight: "1.3" }}>
                  {topic.title}
                </h1>

                {/* Author Badge Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.85rem 1rem", background: "var(--color-bg-alt)", borderRadius: "10px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--color-primary)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.95rem" }}>
                    {topic.author.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--color-navy)" }}>
                      {topic.author.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      {topic.author.institution || "African Scholar"} {topic.author.country ? `• ${topic.author.country}` : ""}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    {f.started_on || "Started on"} {new Date(topic.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </div>
                </div>

                {/* Body Content */}
                <div style={{ fontSize: "1rem", lineHeight: "1.8", color: "var(--color-text-body)", whiteSpace: "pre-wrap" }}>
                  {topic.content}
                </div>
              </div>

              {/* Replies Counter */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-navy)", margin: 0 }}>
                  {f.peer_responses || "Peer Responses"} ({topic.replies.length})
                </h3>
              </div>

              {/* Replies List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2.5rem" }}>
                {topic.replies.length === 0 ? (
                  <div style={{ padding: "2rem", background: "var(--color-bg-card)", borderRadius: "12px", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
                    {f.no_replies || "No responses yet. Share your experience or guidance below!"}
                  </div>
                ) : (
                  topic.replies.map((reply, idx) => (
                    <div 
                      key={reply.id} 
                      style={{ 
                        background: "var(--color-bg-card)", 
                        borderRadius: "14px", 
                        border: "1px solid var(--color-border)", 
                        padding: "1.5rem",
                        boxShadow: "0 2px 10px -2px rgba(15, 23, 42, 0.04)"
                      }}
                    >
                      {/* Reply Author Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#0284c7", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>
                            {reply.author.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--color-navy)" }}>
                              {reply.author.name}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              {reply.author.institution || "Scholar"} {reply.author.country ? `• ${reply.author.country}` : ""}
                            </div>
                          </div>
                        </div>

                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          #{idx + 1} • {new Date(reply.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      {/* Reply Text */}
                      <div style={{ fontSize: "0.95rem", lineHeight: "1.75", color: "var(--color-text-body)", whiteSpace: "pre-wrap" }}>
                        {reply.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Box */}
              {topic.isLocked ? (
                <div style={{ padding: "1.5rem", background: "#f1f5f9", borderRadius: "12px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: "0.4rem" }}></i>
                  {f.locked_message || "This discussion thread is locked for new replies."}
                </div>
              ) : (
                <div style={{ background: "var(--color-bg-card)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "1.75rem", boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.06)" }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 1rem" }}>
                    {f.post_response || "Post a Scholarly Response"}
                  </h4>

                  {replyError && (
                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.85rem", marginBottom: "1rem" }}>
                      {replyError}
                    </div>
                  )}

                  {!user ? (
                    <div style={{ textAlign: "center", padding: "1.5rem", background: "var(--color-bg-alt)", borderRadius: "10px" }}>
                      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 1rem" }}>
                        {f.sign_in_prompt || "Sign in with your verified researcher or editor profile to contribute to this discussion."}
                      </p>
                      <Link 
                        href={`/login?redirect=/forum/${encodeURIComponent(topic.slug)}`}
                        className="btn btn-primary btn-sm"
                      >
                        {f.sign_in_to_reply || "Sign In to Reply"}
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handlePostReply}>
                      <textarea
                        rows={5}
                        placeholder={f.reply_placeholder || "Share your professional insights, advice, or empirical references..."}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.85rem",
                          borderRadius: "10px",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.92rem",
                          outline: "none",
                          fontFamily: "inherit",
                          lineHeight: "1.6",
                          marginBottom: "1rem"
                        }}
                      />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                          {f.posting_as || "Posting as"} <strong style={{ color: "var(--color-navy)" }}>{user.name}</strong> ({user.role})
                        </span>

                        <button
                          type="submit"
                          disabled={submittingReply || !replyContent.trim()}
                          className="btn btn-primary"
                          style={{ padding: "0.55rem 1.4rem", fontSize: "0.88rem" }}
                        >
                          {submittingReply ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.4rem" }}></i>
                              {f.posting || "Posting..."}
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-paper-plane" style={{ marginRight: "0.4rem" }}></i>
                              {f.submit_response || "Submit Response"}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
