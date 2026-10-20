"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  topicsCount: number;
  postsCount: number;
  latestTopic: {
    title: string;
    slug: string;
    updatedAt: string;
    author: { name: string; institution: string | null };
  } | null;
}

interface Topic {
  id: string;
  title: string;
  slug: string;
  snippet: string;
  isPinned: boolean;
  isLocked: boolean;
  viewsCount: number;
  category: { name: string; slug: string; icon: string };
  author: {
    id: string;
    name: string;
    role: string;
    institution: string | null;
    country: string | null;
    totalCitations: number;
    hIndex: number;
  };
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function ForumPage() {
  const { t, lang } = useLang();
  const f = t.forum || {};

  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any | null>(null);

  // Check user session
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

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/forum/categories");
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error("Failed to load forum categories:", err);
      }
    }
    loadCategories();
  }, []);

  // Fetch topics
  useEffect(() => {
    async function loadTopics() {
      setLoading(true);
      try {
        const url = `/api/forum/topics?${selectedCategory !== "all" ? `category=${encodeURIComponent(selectedCategory)}&` : ""}${searchQuery.trim() ? `search=${encodeURIComponent(searchQuery.trim())}` : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && Array.isArray(data.topics)) {
          setTopics(data.topics);
        }
      } catch (err) {
        console.error("Failed to load topics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTopics();
  }, [selectedCategory, searchQuery]);

  const totalAllTopics = categories.reduce((sum, c) => sum + c.topicsCount, 0);

  return (
    <div className="page-wrapper">
      <Header activePage="forum" />

      <main style={{ padding: "2.5rem 0 5rem", background: "var(--color-bg-base)", minHeight: "85vh" }}>
        <div className="container" style={{ maxWidth: "1280px" }}>

          {/* Breadcrumb & Section Header */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(180, 83, 9, 0.1)", border: "1px solid rgba(180, 83, 9, 0.25)", borderRadius: "20px", padding: "0.2rem 0.8rem", fontSize: "0.78rem", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>
              <i className="fa-solid fa-comments"></i>
              {f.title || "AfriScholarChat"}
            </div>
            <h1 style={{ fontSize: "2.1rem", fontWeight: 900, color: "var(--color-navy)", margin: "0 0 0.4rem", letterSpacing: "-0.02em" }}>
              {f.subtitle || "Pan-African Scholarly Discourse & Editorial Community"}
            </h1>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.98rem", maxWidth: "800px", margin: 0, lineHeight: "1.6" }}>
              {f.desc || "A peer forum connecting African journal editors, authors, and reviewers to discuss DOAJ indexing, peer review standards, manuscript preparation, and continental scholarship."}
            </p>
          </div>

          {/* 2-Column Responsive Layout: Sticky Sidebar (Left) + Discussions Stream (Right) */}
          <div style={{ display: "grid", gridTemplateColumns: "310px 1fr", gap: "2rem", alignItems: "start" }} className="forum-grid-container">

            {/* LEFT SIDEBAR */}
            <aside style={{ position: "sticky", top: "90px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Primary Call to Action */}
              <Link 
                href={user ? "/forum/new" : "/login?redirect=/forum/new"} 
                className="btn btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.6rem",
                  padding: "0.85rem 1.4rem",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  borderRadius: "12px",
                  boxShadow: "0 6px 20px -4px rgba(180, 83, 9, 0.35)",
                  textDecoration: "none"
                }}
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>{f.start_discussion || "Start Discussion"}</span>
              </Link>

              {/* Category Navigation Card */}
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 14px -4px rgba(15, 23, 42, 0.05)" }}>
                <div style={{ padding: "0.9rem 1.2rem", background: "var(--color-bg-alt)", borderBottom: "1px solid var(--color-border)", fontSize: "0.82rem", fontWeight: 800, color: "var(--color-navy)", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="fa-solid fa-layer-group" style={{ color: "var(--color-primary)" }}></i>
                  <span>{f.browse_categories || "Discussion Categories"}</span>
                </div>

                <div style={{ padding: "0.5rem" }}>
                  {/* All Topics Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.7rem 0.85rem",
                      borderRadius: "8px",
                      border: "none",
                      background: selectedCategory === "all" ? "var(--color-primary-light)" : "transparent",
                      color: selectedCategory === "all" ? "var(--color-primary)" : "var(--color-text-body)",
                      fontWeight: selectedCategory === "all" ? 800 : 600,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      marginBottom: "2px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i className="fa-solid fa-globe" style={{ width: "16px", fontSize: "0.85rem", opacity: 0.8 }}></i>
                      <span>{f.all_topics || "All Discussions"}</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", background: selectedCategory === "all" ? "rgba(180, 83, 9, 0.2)" : "var(--color-bg-alt)", color: selectedCategory === "all" ? "var(--color-primary)" : "var(--color-text-muted)", padding: "0.15rem 0.5rem", borderRadius: "20px", fontWeight: 700 }}>
                      {totalAllTopics}
                    </span>
                  </button>

                  {/* Dynamic Category Rows */}
                  {categories.map((c) => {
                    const isSelected = selectedCategory === c.slug;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.slug)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.7rem 0.85rem",
                          borderRadius: "8px",
                          border: "none",
                          background: isSelected ? "var(--color-primary-light)" : "transparent",
                          color: isSelected ? "var(--color-primary)" : "var(--color-text-body)",
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: "0.88rem",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          marginBottom: "2px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                          <i className={`fa-solid ${c.icon}`} style={{ width: "16px", fontSize: "0.85rem", opacity: 0.8 }}></i>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.name}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.72rem", background: isSelected ? "rgba(180, 83, 9, 0.2)" : "var(--color-bg-alt)", color: isSelected ? "var(--color-primary)" : "var(--color-text-muted)", padding: "0.15rem 0.5rem", borderRadius: "20px", fontWeight: 700 }}>
                          {c.topicsCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Community Standards & Ethics Card */}
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "1.2rem", fontSize: "0.82rem", boxShadow: "0 4px 14px -4px rgba(15, 23, 42, 0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: "#0284c7" }}></i>
                  <span>{f.community_guidelines || "Community Standards"}</span>
                </div>
                <p style={{ color: "var(--color-text-muted)", margin: 0, lineHeight: "1.5" }}>
                  {f.guidelines_text || "AfriScholarChat adheres to COPE publishing ethics. Please maintain constructive, respectful scholarly debate."}
                </p>
              </div>
            </aside>

            {/* RIGHT MAIN CONTENT AREA: SEARCH & TOPICS STREAM */}
            <section style={{ minWidth: 0 }}>

              {/* Search & Active Category Banner */}
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", boxShadow: "0 4px 14px -4px rgba(15, 23, 42, 0.04)" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", fontWeight: 700, color: "var(--color-primary)", letterSpacing: "0.04em" }}>
                    Active View
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-navy)" }}>
                    {selectedCategory === "all" ? (f.all_topics || "All Discussions") : (categories.find(c => c.slug === selectedCategory)?.name || "Category")}
                  </div>
                </div>

                {/* Instant Search Bar */}
                <div style={{ position: "relative", minWidth: "260px", maxWidth: "100%", flex: "1 1 260px" }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontSize: "0.85rem" }}></i>
                  <input
                    type="text"
                    placeholder={f.search_placeholder || "Search discussions, keywords, topics..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.85rem 0.55rem 2.4rem",
                      fontSize: "0.88rem",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      outline: "none",
                      background: "var(--color-bg-base)"
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Topics Stream Container */}
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 16px -4px rgba(15, 23, 42, 0.04)" }}>
                
                {/* Header Row */}
                <div style={{ padding: "0.85rem 1.4rem", background: "var(--color-bg-alt)", borderBottom: "1px solid var(--color-border)", display: "grid", gridTemplateColumns: "1fr 110px 100px", fontWeight: 800, fontSize: "0.8rem", color: "var(--color-navy)", letterSpacing: "0.02em" }}>
                  <span>Topic &amp; Author</span>
                  <span style={{ textAlign: "center" }}>{f.replies || "Replies"}</span>
                  <span style={{ textAlign: "right" }}>Activity</span>
                </div>

                {loading ? (
                  <div style={{ padding: "3.5rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "0.5rem" }}></i> Loading scholarly discussions...
                  </div>
                ) : topics.length === 0 ? (
                  <div style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
                    <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "var(--color-bg-alt)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "1.5rem", marginBottom: "1rem" }}>
                      <i className="fa-solid fa-comments"></i>
                    </div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.4rem" }}>
                      {f.no_discussions || "No discussions found in this section"}
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", margin: "0 0 1.25rem", maxWidth: "460px", marginLeft: "auto", marginRight: "auto" }}>
                      {f.be_first || "Be the first scholar or editor to start a discussion!"}
                    </p>
                    <Link href={user ? "/forum/new" : "/login?redirect=/forum/new"} className="btn btn-primary btn-sm">
                      <i className="fa-solid fa-plus" style={{ marginRight: "0.3rem" }}></i> {f.start_discussion || "Start Discussion"}
                    </Link>
                  </div>
                ) : (
                  topics.map((t) => (
                    <div 
                      key={t.id}
                      style={{
                        padding: "1.15rem 1.4rem",
                        borderBottom: "1px solid var(--color-border)",
                        display: "grid",
                        gridTemplateColumns: "1fr 110px 100px",
                        alignItems: "center",
                        gap: "1rem",
                        transition: "background 0.15s ease"
                      }}
                      className="hover-row"
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                          {t.isPinned && (
                            <span style={{ fontSize: "0.68rem", fontWeight: 800, background: "#fee2e2", color: "#b91c1c", padding: "0.12rem 0.45rem", borderRadius: "4px" }}>
                              <i className="fa-solid fa-thumbtack" style={{ marginRight: "3px" }}></i> {f.pinned || "PINNED"}
                            </span>
                          )}
                          {t.isLocked && (
                            <span style={{ fontSize: "0.68rem", fontWeight: 800, background: "#f1f5f9", color: "#475569", padding: "0.12rem 0.45rem", borderRadius: "4px" }}>
                              <i className="fa-solid fa-lock" style={{ marginRight: "3px" }}></i> {f.locked || "LOCKED"}
                            </span>
                          )}
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "rgba(180, 83, 9, 0.1)", color: "var(--color-primary)", padding: "0.12rem 0.5rem", borderRadius: "4px" }}>
                            {t.category.name}
                          </span>
                        </div>

                        <Link 
                          href={`/forum/${t.slug}`} 
                          style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--color-navy)", textDecoration: "none", lineHeight: "1.4", display: "inline-block" }}
                          className="hover-primary"
                        >
                          {t.title}
                        </Link>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.3rem", fontSize: "0.78rem", color: "var(--color-text-muted)", flexWrap: "wrap" }}>
                          <span>{f.by || "By"} <strong style={{ color: "var(--color-text-main)" }}>{t.author.name}</strong></span>
                          {t.author.institution && (
                            <span>• {t.author.institution}</span>
                          )}
                          {t.author.country && (
                            <span>• {t.author.country}</span>
                          )}
                          {t.author.hIndex > 0 && (
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.72rem" }}>
                              h-{t.author.hIndex}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Replies Counter */}
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--color-navy)", lineHeight: 1 }}>
                          {t.repliesCount}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          {f.replies || "replies"}
                        </div>
                      </div>

                      {/* Last Activity */}
                      <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {new Date(t.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </section>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
