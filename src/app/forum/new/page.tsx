"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../Header";
import Footer from "../../Footer";
import { useLang } from "../../LangContext";

interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export default function NewTopicPage() {
  const router = useRouter();
  const { t } = useLang();
  const f = t.forum || {};

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.authenticated) {
          setUser(data.user);
        } else {
          router.push("/login?redirect=/forum/new");
        }
      } catch {
        router.push("/login?redirect=/forum/new");
      }
    }
    checkAuth();
  }, [router]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/forum/categories");
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setSelectedCategory(data.categories[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedCategory) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId: selectedCategory
        })
      });

      const data = await res.json();
      if (data.success && data.topic) {
        router.push(`/forum/${encodeURIComponent(data.topic.slug)}`);
      } else {
        setError(data.error || "Failed to create discussion topic.");
      }
    } catch {
      setError("Network error publishing discussion topic.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />

      <main style={{ padding: "3rem 0 5rem", background: "var(--color-bg-base)", minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: "800px" }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            <Link href="/forum" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 700 }}>
              <i className="fa-solid fa-arrow-left" style={{ marginRight: "4px" }}></i> {f.title || "AfriScholarChat"}
            </Link>
            <span>/</span>
            <span style={{ color: "var(--color-navy)", fontWeight: 600 }}>{f.start_discussion || "Start New Discussion"}</span>
          </div>

          <div style={{ background: "var(--color-bg-card)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "2.5rem", boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.06)" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(180, 83, 9, 0.1)", border: "1px solid rgba(180, 83, 9, 0.25)", borderRadius: "20px", padding: "0.2rem 0.75rem", fontSize: "0.78rem", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                <i className="fa-solid fa-pen-to-square"></i>
                {f.start_discussion || "New Discussion Thread"}
              </div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--color-navy)", margin: "0 0 0.4rem" }}>
                {f.start_new_title || "Start a Scholarly Conversation"}
              </h1>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: 0 }}>
                {f.start_new_desc || "Pose questions on indexing, exchange peer review experiences, or seek guidance from fellow African scholars and editors."}
              </p>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "10px", padding: "0.85rem 1rem", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "0.4rem" }}></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Category selector */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.4rem" }}>
                  {f.category_label || "Discussion Category"} <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-control"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.9rem",
                    outline: "none"
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.4rem" }}>
                  {f.title_label || "Discussion Title"} <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Best practices for setting up Crossref automated DOI deposits in OJS 3.3..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.92rem",
                    outline: "none"
                  }}
                />
              </div>

              {/* Content */}
              <div style={{ marginBottom: "1.75rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.4rem" }}>
                  {f.content_label || "Detailed Description & Questions"} <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  rows={8}
                  placeholder="Describe your question or discussion context in detail. Include institutional background, challenges encountered, or specific technical setup details..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.85rem",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "0.92rem",
                    outline: "none",
                    fontFamily: "inherit",
                    lineHeight: "1.6"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href="/forum" className="btn btn-secondary" style={{ padding: "0.6rem 1.25rem" }}>
                  {f.cancel || "Cancel"}
                </Link>

                <button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim()}
                  className="btn btn-primary"
                  style={{ padding: "0.65rem 1.75rem", fontSize: "0.92rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>{f.publishing || "Publishing..."}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>{f.publish_btn || "Publish Discussion"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
