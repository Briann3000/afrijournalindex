"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

interface PostItem {
  id: string;
  postType: string;
  title: string | null;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: "DOCUMENT" | "IMAGE" | "AUDIO" | "LINK" | null;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  hasLiked: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: string;
    institution: string | null;
    country: string | null;
    totalCitations: number;
    hIndex: number;
  };
  recentComments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      institution: string | null;
    };
  }>;
}

interface TrendingTag {
  tag: string;
  count: number;
}

function PostsPageContent() {
  const { t } = useLang();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"none" | "profile" | "trending" | "services">("none");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Unified Post Composer State
  const [feedTab, setFeedTab] = useState<"public" | "drafts">("public");
  const [composerMode, setComposerMode] = useState<"POST" | "DRAFT">("POST");
  const [drafts, setDrafts] = useState<PostItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState<boolean>(false);
  const [showComposerModal, setShowComposerModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentType, setAttachmentType] = useState<"DOCUMENT" | "IMAGE" | "AUDIO" | "LINK" | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const [linkInputUrl, setLinkInputUrl] = useState<string>("");
  const [audience, setAudience] = useState<"PUBLIC" | "FOLLOWERS" | "PRIVATE">("PUBLIC");
  const [showAudienceMenu, setShowAudienceMenu] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Dedicated Hidden File Input Refs for Type Whitelist Matching
  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Document Reader State (Split-screen viewer)
  const [activeReaderPost, setActiveReaderPost] = useState<PostItem | null>(null);
  const [citationFormat, setCitationFormat] = useState<"APA" | "HARVARD" | "CHICAGO" | "MLA">("APA");
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  // Lightbox Image Viewer State
  const [activeImagePreview, setActiveImagePreview] = useState<{ url: string; title: string } | null>(null);

  // Social Share Popover State
  const [activeSharePost, setActiveSharePost] = useState<PostItem | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Scholar Profile Drawer State
  const [profileDrawerScholar, setProfileDrawerScholar] = useState<any | null>(null);
  const [profileDrawerTab, setProfileDrawerTab] = useState<"posts" | "likes" | "activity">("posts");
  const [profileDrawerPosts, setProfileDrawerPosts] = useState<PostItem[]>([]);
  const [loadingProfileDrawer, setLoadingProfileDrawer] = useState<boolean>(false);

  // Post 3-Dot Menu State
  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);
  const [followedScholars, setFollowedScholars] = useState<Record<string, boolean>>({});

  // Feed Interaction States
  const [expandedText, setExpandedText] = useState<Record<string, boolean>>({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [repostNotices, setRepostNotices] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedCommentText, setExpandedCommentText] = useState<Record<string, boolean>>({});

  // 1. Check logged-in scholar session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          loadDrafts();
        }
      } catch {
        // Guest mode
      }
    }
    checkAuth();
  }, []);

  const loadDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const res = await fetch("/api/posts?filter=drafts");
      const data = await res.json();
      if (data.success) {
        setDrafts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to load drafts:", err);
    } finally {
      setLoadingDrafts(false);
    }
  };

  const openComposer = (mode: "POST" | "DRAFT") => {
    setEditingDraftId(null);
    setTitle("");
    setContent("");
    setTags("");
    setAttachmentUrl("");
    setAttachmentName("");
    setAttachmentType(null);
    setComposerMode(mode);
    if (mode === "DRAFT") {
      setAudience("PRIVATE");
    } else {
      setAudience("PUBLIC");
    }
    setShowComposerModal(true);
  };

  const handleEditDraft = (draft: PostItem) => {
    setEditingDraftId(draft.id);
    setTitle(draft.title || "");
    setContent(draft.content || "");
    setTags(Array.isArray(draft.tags) ? draft.tags.join(", ") : ((draft.tags as any) || ""));
    setAttachmentUrl(draft.attachmentUrl || "");
    setAttachmentName(draft.attachmentName || "");
    setAttachmentType(draft.attachmentType || null);
    setComposerMode("DRAFT");
    setAudience("PRIVATE");
    setShowComposerModal(true);
  };

  const handlePublishDraft = async (draftId: string) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publishDraft", draftId })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Manuscript successfully published to the public feed!");
        loadDrafts();
        loadPosts();
        setFeedTab("public");
      } else {
        showToast(data.error || "Failed to publish draft.");
      }
    } catch {
      showToast("Network error publishing draft.");
    }
  };

  const handleShareDraft = (draftId: string) => {
    const url = `${window.location.origin}/posts?draftId=${draftId}`;
    navigator.clipboard.writeText(url);
    showToast("Private reviewer link copied to clipboard!");
  };

  // 2. Fetch posts feed & dynamic database trending tags
  const loadPosts = async () => {
    setLoading(true);
    try {
      let url = `/api/posts?limit=30`;
      if (selectedTag) {
        url += `&tag=${encodeURIComponent(selectedTag)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
        if (data.trendingTags) {
          setTrendingTags(data.trendingTags);
        }
      }
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedTag]);

  // Close menus on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-dropdown-container]")) {
        return;
      }
      setActivePostMenuId(null);
      setShowAudienceMenu(false);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  // 3. Handle File Upload (Document, Photo, Audio with strict security validation)
  const handleTriggerUpload = (type: "DOCUMENT" | "IMAGE" | "AUDIO") => {
    if (!user) {
      showToast("Please sign in to upload research documents, figures, or audio.");
      return;
    }
    if (type === "DOCUMENT") {
      docInputRef.current?.click();
    } else if (type === "IMAGE") {
      imageInputRef.current?.click();
    } else if (type === "AUDIO") {
      audioInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, intendedType: "DOCUMENT" | "IMAGE" | "AUDIO") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setComposerError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setComposerError(data.error || "File upload rejected by security validation.");
        return;
      }

      setAttachmentUrl(data.url);
      setAttachmentName(data.filename);
      setAttachmentType(data.mediaType || intendedType);
      setShowComposerModal(true);
    } catch (err: any) {
      setComposerError("Network error while uploading file.");
    } finally {
      setUploadingFile(false);
      // Reset input value so same file can be reselected if needed
      e.target.value = "";
    }
  };

  // 4. Publish Post
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setComposerError("Post content or research statement is required.");
      return;
    }

    setSubmitting(true);
    setComposerError(null);

    try {
      const payload: any = {
        title: title.trim() || null,
        content: content.trim(),
        tags: tags.trim() ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentType: attachmentType || null,
        audience: composerMode === "DRAFT" ? "PRIVATE" : audience,
        isDraft: composerMode === "DRAFT"
      };

      if (editingDraftId) {
        payload.action = "updateDraft";
        payload.draftId = editingDraftId;
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setComposerError(data.error || "Failed to publish post.");
        return;
      }

      if (editingDraftId) {
        showToast("Manuscript draft updated successfully!");
        loadDrafts();
      } else if (composerMode === "DRAFT") {
        setDrafts(prev => [data.post, ...prev]);
        setFeedTab("drafts");
        showToast("Manuscript draft saved privately. Your work is protected.");
      } else {
        setPosts(prev => [data.post, ...prev]);
        showToast("Post shared successfully to AfriJournal!");
      }

      // Reset Composer
      setEditingDraftId(null);
      setTitle("");
      setContent("");
      setTags("");
      setAttachmentUrl("");
      setAttachmentName("");
      setAttachmentType(null);
      setAudience("PUBLIC");
      setComposerMode("POST");
      setShowComposerModal(false);
    } catch (err) {
      setComposerError("Network error publishing post.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to delete post.");
        return;
      }

      setPosts(prev => prev.filter(p => p.id !== postId));
      showToast("Post deleted successfully.");
    } catch {
      showToast("Failed to delete post. Please try again.");
    }
  };

  // 6. Like / Unlike Post
  const handleToggleLike = async (postId: string) => {
    if (!user) {
      showToast("Please sign in to like this post.");
      return;
    }

    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextLiked = !p.hasLiked;
        return {
          ...p,
          hasLiked: nextLiked,
          likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
        };
      }
      return p;
    }));

    try {
      await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  // 7. Add Comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    if (!user) {
      showToast("Please sign in to reply.");
      return;
    }

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text })
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: p.commentsCount + 1,
              recentComments: [...p.recentComments, data.comment]
            };
          }
          return p;
        }));
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        setExpandedComments(prev => ({ ...prev, [postId]: true }));
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // 8. Repost Handler
  const handleRepost = (postId: string) => {
    setRepostNotices(prev => ({ ...prev, [postId]: true }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, sharesCount: p.sharesCount + 1 } : p));
    showToast("Post shared to your academic network!");
    setTimeout(() => {
      setRepostNotices(prev => ({ ...prev, [postId]: false }));
    }, 3000);
  };

  // 9. Follow / Unfollow Scholar
  const handleToggleFollow = (scholarId: string, scholarName: string) => {
    setFollowedScholars(prev => {
      const next = !prev[scholarId];
      showToast(next ? `Now following ${scholarName}` : `Unfollowed ${scholarName}`);
      return { ...prev, [scholarId]: next };
    });
  };

  // 10. Open Scholar Profile Activity Drawer
  const openScholarProfile = async (scholar: any) => {
    setProfileDrawerScholar(scholar);
    setProfileDrawerTab("posts");
    setLoadingProfileDrawer(true);
    try {
      const res = await fetch(`/api/posts?authorId=${scholar.id}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setProfileDrawerPosts(data.posts || []);
      }
    } catch {
      setProfileDrawerPosts([]);
    } finally {
      setLoadingProfileDrawer(false);
    }
  };

  // Switch Profile Drawer Tab
  const handleProfileDrawerTabChange = async (tab: "posts" | "likes" | "activity") => {
    setProfileDrawerTab(tab);
    if (!profileDrawerScholar) return;
    setLoadingProfileDrawer(true);
    try {
      let url = `/api/posts?limit=20`;
      if (tab === "posts") {
        url += `&authorId=${profileDrawerScholar.id}`;
      } else if (tab === "likes") {
        url += `&likedBy=${profileDrawerScholar.id}`;
      } else {
        url += `&authorId=${profileDrawerScholar.id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProfileDrawerPosts(data.posts || []);
      }
    } catch {
      setProfileDrawerPosts([]);
    } finally {
      setLoadingProfileDrawer(false);
    }
  };

  // 11. Generate Citations for Document Reader
  const generateCitation = (post: PostItem, format: "APA" | "HARVARD" | "CHICAGO" | "MLA") => {
    const year = new Date(post.createdAt).getFullYear();
    const titleStr = post.title || "Scholarly Working Paper & Research Analysis";
    const author = post.author.name;
    const url = typeof window !== "undefined" ? `${window.location.origin}/posts#${post.id}` : `https://afrijournal.org/posts#${post.id}`;

    switch (format) {
      case "APA":
        return `${author}. (${year}). ${titleStr}. AfriJournal Preprints & Working Papers. ${url}`;
      case "HARVARD":
        return `${author}, ${year}. ${titleStr}. AfriJournal Preprints. Available at: <${url}> [Accessed ${new Date().toLocaleDateString()}].`;
      case "CHICAGO":
        return `${author}. "${titleStr}." AfriJournal Working Paper Series (${year}). ${url}.`;
      case "MLA":
        return `${author}. "${titleStr}." AfriJournal Preprints, ${year}, ${url}.`;
      default:
        return `${author} (${year}). ${titleStr}.`;
    }
  };

  const copyCitation = (text: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedCitation(true);
      showToast("Citation copied to clipboard!");
      setTimeout(() => setCopiedCitation(false), 2500);
    }
  };

  // Copy canonical post link
  const copyPostLink = (postId: string) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/posts#${postId}` : `https://afrijournal.org/posts#${postId}`;
    navigator.clipboard.writeText(url);
    showToast("Post link copied to clipboard!");
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-body)" }}>
      <Header activePage="posts" />

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#0f172a",
          color: "#ffffff",
          padding: "10px 20px",
          borderRadius: "30px",
          fontSize: "0.88rem",
          fontWeight: 600,
          zIndex: 100000,
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          animation: "fadeIn 0.2s ease"
        }}>
          <i className="fa-solid fa-circle-check" style={{ color: "#22c55e" }}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3 Dedicated Hidden File Inputs for Strict Type Matching */}
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={e => handleFileChange(e, "DOCUMENT")}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        style={{ display: "none" }}
        onChange={e => handleFileChange(e, "IMAGE")}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/x-m4a,audio/ogg,.mp3,.wav,.m4a,.ogg"
        style={{ display: "none" }}
        onChange={e => handleFileChange(e, "AUDIO")}
      />

      <main className="posts-container-main" style={{ flex: 1, padding: "1.5rem 1rem", maxWidth: "1240px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        
        {/* Mobile Twitter/X-Style Top Quick Bar - Visible only on mobile */}
        <div className="posts-mobile-nav-bar" style={{ display: "none", gap: "0.5rem", marginBottom: "0.85rem", overflowX: "auto", paddingBottom: "2px" }}>
          <button
            type="button"
            onClick={() => setMobilePanel(mobilePanel === "profile" ? "none" : "profile")}
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: "0.78rem",
              padding: "0.4rem 0.8rem",
              borderRadius: "20px",
              background: mobilePanel === "profile" ? "var(--color-primary)" : "var(--color-bg-card)",
              color: mobilePanel === "profile" ? "#000" : "var(--color-text-main)",
              borderColor: mobilePanel === "profile" ? "var(--color-primary)" : "var(--color-border)",
              fontWeight: 700,
              whiteSpace: "nowrap"
            }}
          >
            <i className="fa-solid fa-circle-user" style={{ marginRight: "5px" }}></i>
            {user ? user.name.split(" ")[0] : "My Profile"}
          </button>

          {trendingTags.length > 0 && (
            <button
              type="button"
              onClick={() => setMobilePanel(mobilePanel === "trending" ? "none" : "trending")}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: "0.78rem",
                padding: "0.4rem 0.8rem",
                borderRadius: "20px",
                background: mobilePanel === "trending" ? "var(--color-primary)" : "var(--color-bg-card)",
                color: mobilePanel === "trending" ? "#000" : "var(--color-text-main)",
                borderColor: mobilePanel === "trending" ? "var(--color-primary)" : "var(--color-border)",
                fontWeight: 700,
                whiteSpace: "nowrap"
              }}
            >
              <i className="fa-solid fa-arrow-trend-up" style={{ marginRight: "5px" }}></i>
              Trending ({trendingTags.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobilePanel(mobilePanel === "services" ? "none" : "services")}
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: "0.78rem",
              padding: "0.4rem 0.8rem",
              borderRadius: "20px",
              background: mobilePanel === "services" ? "var(--color-primary)" : "var(--color-bg-card)",
              color: mobilePanel === "services" ? "#000" : "var(--color-text-main)",
              borderColor: mobilePanel === "services" ? "var(--color-primary)" : "var(--color-border)",
              fontWeight: 700,
              whiteSpace: "nowrap"
            }}
          >
            <i className="fa-solid fa-compass" style={{ marginRight: "5px" }}></i>
            Explore &amp; Services
          </button>
        </div>

        {/* Mobile Accordion Panel */}
        {mobilePanel !== "none" && (
          <div className="posts-mobile-drawer-content" style={{ display: "none", marginBottom: "1rem" }}>
            {mobilePanel === "profile" && (
              <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1rem" }}>
                {user ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <strong>{user.name}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: 700 }}>{user.institution || "African Scholar"}</span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                      <span><strong style={{ color: "var(--color-primary)" }}>{user.totalCitations || 0}</strong> Citations</span>
                      <span><strong style={{ color: "var(--color-primary)" }}>h-{user.hIndex || 0}</strong> h-Index</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setMobilePanel("none"); openScholarProfile(user); }}
                      className="btn btn-secondary btn-sm"
                      style={{ width: "100%", fontSize: "0.8rem", fontWeight: 700 }}
                    >
                      Open Full Scholar Dossier
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 0.5rem" }}>Sign in to post, draft manuscripts, and engage with continental peers.</p>
                    <Link href="/login" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Sign In / Register</Link>
                  </div>
                )}
              </div>
            )}

            {mobilePanel === "trending" && trendingTags.length > 0 && (
              <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--color-text-main)" }}>Trending Research Topics</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {trendingTags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { setSelectedTag(selectedTag === tag ? null : tag); setMobilePanel("none"); }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.78rem", padding: "0.25rem 0.6rem", borderRadius: "14px", background: selectedTag === tag ? "var(--color-primary)" : "var(--color-bg-alt)", color: selectedTag === tag ? "#000" : "inherit" }}
                    >
                      #{tag} ({count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mobilePanel === "services" && (
              <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem" }}>
                  <Link href="/scholars" onClick={() => setMobilePanel("none")} style={{ color: "var(--color-text-main)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-user-graduate" style={{ color: "var(--color-primary)" }}></i> Find African Scholars
                  </Link>
                  <Link href="/browse" onClick={() => setMobilePanel("none")} style={{ color: "var(--color-text-main)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-book-journal-whills" style={{ color: "#0284c7" }}></i> Browse Indexed Journals
                  </Link>
                  <Link href="/services" onClick={() => setMobilePanel("none")} style={{ color: "var(--color-text-main)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-pen-nib" style={{ color: "var(--color-primary)" }}></i> Article Writing &amp; Review Services
                  </Link>
                  <Link href="/submit" onClick={() => setMobilePanel("none")} style={{ color: "var(--color-text-main)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-arrow-up-from-bracket" style={{ color: "var(--color-primary)" }}></i> Submit Journal for Indexing
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3-Column Feed Layout with Sticky Sidebars */}
        <div className="posts-feed-grid">
          
          {/* LEFT COLUMN: Sticky Scholar Mini-Profile & Fast Links */}
          <div className="posts-sidebar-left">
            
            {/* Scholar Mini-Profile Card */}
            <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", overflow: "hidden", textAlign: "center" }}>
              <div style={{ height: "60px", background: "linear-gradient(135deg, #0f172a, var(--color-primary))" }}></div>
              <div style={{ marginTop: "-30px", marginBottom: "0.5rem" }}>
                <div 
                  onClick={() => user && openScholarProfile(user)}
                  style={{ 
                    width: "60px", 
                    height: "60px", 
                    borderRadius: "50%", 
                    background: "#ffffff", 
                    color: "var(--color-primary)", 
                    margin: "0 auto", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontWeight: 800, 
                    fontSize: "1.2rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    border: "2px solid #ffffff",
                    cursor: user ? "pointer" : "default"
                  }}
                  title={user ? "View your profile & activity" : undefined}
                >
                  {user ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : <i className="fa-solid fa-graduation-cap"></i>}
                </div>
              </div>

              <div style={{ padding: "0 1rem 1.25rem" }}>
                <h3 
                  onClick={() => user && openScholarProfile(user)}
                  style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 0.2rem", color: "var(--color-text-main)", cursor: user ? "pointer" : "default" }}
                >
                  {user ? user.name : "AfriJournal Scholar"}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0 0 1rem", lineHeight: 1.3 }}>
                  {user ? (user.institution || "African Academic Network") : "Join verified continental researchers"}
                </p>

                {user ? (
                  <>
                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", textAlign: "center", marginBottom: "0.75rem" }}>
                      <div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>{user.totalCitations || 0}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Citations</div>
                      </div>
                      <div style={{ borderLeft: "1px solid var(--color-border)" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#16a34a" }}>h-{user.hIndex || 0}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>h-Index</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openScholarProfile(user)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.78rem", fontWeight: 700 }}
                    >
                      <i className="fa-solid fa-user-clock" style={{ marginRight: "5px" }}></i>
                      View My Activity
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="btn btn-primary btn-sm" style={{ width: "100%", padding: "0.4rem" }}>
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px", marginBottom: "0.75rem" }}>
                Scholarly Network
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem" }}>
                <Link
                  href="/scholars"
                  style={{
                    color: "var(--color-text-body)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontWeight: 600
                  }}
                  className="hover-card-bg"
                >
                  <i className="fa-solid fa-user-graduate" style={{ color: "var(--color-primary)", width: "18px" }}></i>
                  Find African Scholars
                </Link>
                <Link
                  href="/browse"
                  style={{
                    color: "var(--color-text-body)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontWeight: 600
                  }}
                  className="hover-card-bg"
                >
                  <i className="fa-solid fa-book-journal-whills" style={{ color: "#0284c7", width: "18px" }}></i>
                  Browse Indexed Journals
                </Link>
                <Link
                  href="/services"
                  style={{
                    color: "var(--color-text-body)",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontWeight: 600
                  }}
                  className="hover-card-bg"
                >
                  <i className="fa-solid fa-hand-holding-hand" style={{ color: "#10b981", width: "18px" }}></i>
                  Article Writing &amp; Review
                </Link>
              </div>
            </div>

            {/* AJI Advisory Mini Card */}
            <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1rem", background: "var(--color-bg-card-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.4rem" }}>
                <i className="fa-solid fa-feather-pointed" style={{ color: "var(--color-primary)", fontSize: "0.85rem" }}></i>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-text-main)" }}>Publishing Assistance</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.6rem", lineHeight: 1.45 }}>
                Need help polishing your manuscript or choosing an indexed target journal? AJI editorial specialists provide peer review and writing support.
              </p>
              <Link href="/services" style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--color-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span>Explore services</span>
                <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.65rem" }}></i>
              </Link>
            </div>

          </div>

          {/* MIDDLE COLUMN: Post Composer & Main Feed */}
          <div className="posts-main-feed" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            {/* Unified Top Composer Widget */}
            <div className="card-surface" style={{ borderRadius: "14px", border: "1px solid var(--color-border)", padding: "1.2rem 1.4rem" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div 
                  onClick={() => user && openScholarProfile(user)}
                  style={{ 
                    width: "44px", 
                    height: "44px", 
                    borderRadius: "50%", 
                    background: "var(--color-primary)", 
                    color: "#ffffff", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontWeight: 800, 
                    fontSize: "0.95rem",
                    flexShrink: 0,
                    cursor: user ? "pointer" : "default"
                  }}
                >
                  {user ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : <i className="fa-solid fa-user"></i>}
                </div>

                <div style={{ flex: 1, display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        showToast("Please sign in to share a research post.");
                        return;
                      }
                      openComposer("POST");
                    }}
                    style={{
                      flex: 1,
                      minWidth: "160px",
                      textAlign: "left",
                      background: "var(--color-bg-card-subtle)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "28px",
                      padding: "0.7rem 1.1rem",
                      color: "var(--color-text-muted)",
                      fontSize: "0.86rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <i className="fa-solid fa-scroll" style={{ color: "var(--color-primary)" }}></i>
                    <span>Submit Scholarly Post...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        showToast("Please sign in to draft an unpublished manuscript.");
                        return;
                      }
                      openComposer("DRAFT");
                    }}
                    style={{
                      background: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      borderRadius: "28px",
                      padding: "0.7rem 1.1rem",
                      color: "var(--color-primary)",
                      fontSize: "0.84rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      whiteSpace: "nowrap"
                    }}
                    title="Draft manuscript privately to safeguard your unpublished research"
                  >
                    <i className="fa-solid fa-lock"></i>
                    <span>Draft Manuscript (Private)</span>
                  </button>
                </div>
              </div>

              {/* 3 Dedicated Media Trigger Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => handleTriggerUpload("DOCUMENT")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0.45rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#dc2626",
                    fontWeight: 700,
                    fontSize: "0.85rem"
                  }}
                >
                  <i className="fa-solid fa-file-pdf"></i>
                  <span>Document (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerUpload("IMAGE")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0.45rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#0284c7",
                    fontWeight: 700,
                    fontSize: "0.85rem"
                  }}
                >
                  <i className="fa-solid fa-image"></i>
                  <span>Photo / Figure</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerUpload("AUDIO")}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0.45rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#16a34a",
                    fontWeight: 700,
                    fontSize: "0.85rem"
                  }}
                >
                  <i className="fa-solid fa-microphone-lines"></i>
                  <span>Audio Recording</span>
                </button>
              </div>
            </div>

            {/* Active Tag Filter Indicator */}
            {selectedTag && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(212, 160, 74, 0.12)", border: "1px solid rgba(212, 160, 74, 0.3)", borderRadius: "10px", padding: "0.6rem 1rem", fontSize: "0.85rem" }}>
                <span>Showing posts tagged <strong>#{selectedTag}</strong></span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer" }}
                >
                  Clear filter <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {/* Feed Tabs: Public Feed vs My Manuscript Drafts */}
            <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setFeedTab("public")}
                style={{
                  background: feedTab === "public" ? "var(--color-primary)" : "none",
                  color: feedTab === "public" ? "#ffffff" : "var(--color-text-muted)",
                  border: "none",
                  borderRadius: "20px",
                  padding: "0.4rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className="fa-solid fa-earth-africa"></i>
                <span>Public Feed ({posts.length})</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => { setFeedTab("drafts"); loadDrafts(); }}
                  style={{
                    background: feedTab === "drafts" ? "#10b981" : "none",
                    color: feedTab === "drafts" ? "#ffffff" : "var(--color-text-muted)",
                    border: "none",
                    borderRadius: "20px",
                    padding: "0.4rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fa-solid fa-lock"></i>
                  <span>My Manuscript Drafts ({drafts.length})</span>
                </button>
              )}
            </div>

            {/* DRAFTS STREAM VIEW */}
            {feedTab === "drafts" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Intellectual Property Protection Info Box */}
                <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", fontWeight: 800, fontSize: "0.88rem", marginBottom: "4px" }}>
                    <i className="fa-solid fa-shield-halved" style={{ color: "var(--color-primary)" }}></i>
                    Intellectual Property Protection Notice
                  </div>
                  <p style={{ color: "var(--color-text-body)", fontSize: "0.8rem", margin: 0, lineHeight: 1.5 }}>
                    Draft manuscripts are strictly <strong>private</strong> and never visible on the public feed, ensuring your unpublished research ideas cannot be plagiarized. You may share with designated reviewers via private link, request AJI expert editorial support, or submit directly to an indexed target journal once finalized.
                  </p>
                </div>

                {loadingDrafts ? (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
                    <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "1.8rem", color: "var(--color-primary)", marginBottom: "0.8rem" }}></i>
                    <p>Loading your private manuscript drafts...</p>
                  </div>
                ) : drafts.length === 0 ? (
                  <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "3rem 1.5rem", textAlign: "center" }}>
                    <i className="fa-solid fa-file-shield" style={{ fontSize: "2.5rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
                    <h3 style={{ color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>No Manuscript Drafts Saved</h3>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", maxWidth: "420px", margin: "0 auto 1.5rem" }}>
                      Draft your working paper privately. It stays confidential until you choose which journal to publish with or publish as a preprint.
                    </p>
                    <button
                      type="button"
                      onClick={() => openComposer("DRAFT")}
                      className="btn btn-primary btn-sm"
                      style={{ background: "#10b981", borderColor: "#059669" }}
                    >
                      <i className="fa-solid fa-pen" style={{ marginRight: "6px" }}></i> Create Private Draft
                    </button>
                  </div>
                ) : (
                  drafts.map(draft => (
                    <div
                      key={draft.id}
                      className="card-surface"
                      style={{
                        borderRadius: "14px",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        padding: "1.5rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.85rem",
                        background: "linear-gradient(180deg, var(--color-bg-card) 0%, rgba(16, 185, 129, 0.02) 100%)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                        <div>
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                            <i className="fa-solid fa-lock" style={{ marginRight: "4px" }}></i> Private Manuscript Draft
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "8px" }}>
                            Saved {new Date(draft.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeletePost(draft.id)}
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem" }}
                          title="Delete draft"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>

                      {draft.title && (
                        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
                          {draft.title}
                        </h3>
                      )}

                      <p style={{ fontSize: "0.9rem", color: "var(--color-text-body)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {draft.content}
                      </p>

                      {draft.attachmentUrl && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0.6rem 0.9rem", background: "var(--color-bg-card-subtle)", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.82rem" }}>
                          <i className="fa-solid fa-file-pdf" style={{ color: "#dc2626" }}></i>
                          <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>{draft.attachmentName || "Attached Manuscript Document"}</span>
                          <a
                            href={draft.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: "auto", color: "var(--color-primary)", fontWeight: 700, textDecoration: "none" }}
                          >
                            Download <i className="fa-solid fa-arrow-down" style={{ fontSize: "0.75rem" }}></i>
                          </a>
                        </div>
                      )}

                      {/* Draft Action Toolbar */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.85rem", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleEditDraft(draft)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.78rem", padding: "0.35rem 0.8rem", color: "var(--color-primary)", borderColor: "var(--color-primary)", fontWeight: 700 }}
                          title="Edit your draft manuscript title, content, or attachments"
                        >
                          <i className="fa-solid fa-pen-to-square" style={{ marginRight: "4px" }}></i> Edit Draft
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareDraft(draft.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                          title="Generate a private review link to share with an advisor or peer reviewer"
                        >
                          <i className="fa-solid fa-link" style={{ marginRight: "4px" }}></i> Share with Reviewer
                        </button>

                        <Link
                          href="/browse"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                        >
                          <i className="fa-solid fa-compass" style={{ marginRight: "4px" }}></i> Explore Journals
                        </Link>

                        <Link
                          href="/services"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}
                        >
                          <i className="fa-solid fa-hand-holding-hand" style={{ marginRight: "4px" }}></i> Get Writing Help
                        </Link>

                        <button
                          type="button"
                          onClick={() => handlePublishDraft(draft.id)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "0.78rem", padding: "0.35rem 0.85rem", marginLeft: "auto" }}
                        >
                          <i className="fa-solid fa-globe" style={{ marginRight: "4px" }}></i> Publish as Preprint
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {/* FEED STREAM */}
            {feedTab === "public" && (
            loading ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-muted)" }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "1.8rem", color: "var(--color-primary)", marginBottom: "0.8rem" }}></i>
                <p>Loading research feed...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "3rem 1.5rem", textAlign: "center" }}>
                <i className="fa-solid fa-feather" style={{ fontSize: "2.5rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
                <h3 style={{ color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>No posts yet</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: "0 0 1rem" }}>
                  Be the first African researcher to share a draft, paper, or research observation.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) { showToast("Please sign in."); return; }
                    setShowComposerModal(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Start a Post
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {posts.map(post => {
                  const isLongText = post.content.length > 280;
                  const isExpanded = expandedText[post.id];
                  const displayedContent = isLongText && !isExpanded ? post.content.slice(0, 280) + "..." : post.content;

                  // Facebook-style comment truncation logic
                  const hasMoreComments = post.recentComments.length > 2;
                  const isCommentsExpanded = expandedComments[post.id];
                  const visibleComments = isCommentsExpanded ? post.recentComments : post.recentComments.slice(-2);

                  return (
                    <article
                      key={post.id}
                      id={post.id}
                      className="card-surface"
                      style={{
                        borderRadius: "14px",
                        border: "1px solid var(--color-border)",
                        padding: "1.25rem 1.5rem",
                        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)"
                      }}
                    >
                      {/* Post Header: Scholar Profile & 3-Dot Options */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <div 
                            onClick={() => openScholarProfile(post.author)}
                            style={{ 
                              width: "46px", 
                              height: "46px", 
                              borderRadius: "50%", 
                              background: "linear-gradient(135deg, var(--color-primary), #0284c7)", 
                              color: "#ffffff", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              fontWeight: 800,
                              fontSize: "0.95rem",
                              cursor: "pointer"
                            }}
                            title="View scholar activity"
                          >
                            {post.author.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span 
                                onClick={() => openScholarProfile(post.author)}
                                style={{ fontWeight: 800, fontSize: "0.98rem", color: "var(--color-text-main)", cursor: "pointer" }}
                              >
                                {post.author.name}
                              </span>
                              <span style={{ fontSize: "0.7rem", background: "#eff6ff", color: "#1d4ed8", padding: "1px 6px", borderRadius: "4px", fontWeight: 700, border: "1px solid #bfdbfe" }}>
                                Scholar
                              </span>
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                              {post.author.institution || "African University"} {post.author.country ? `• ${post.author.country}` : ""}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                              {new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} • <i className="fa-solid fa-earth-africa"></i>
                            </div>
                          </div>
                        </div>

                        {/* 3-Dot Dropdown Menu for Post Actions */}
                        <div data-dropdown-container="true" style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePostMenuId(prev => prev === post.id ? null : post.id);
                            }}
                            style={{
                              background: activePostMenuId === post.id ? "var(--color-bg-card-subtle)" : "none",
                              border: "none",
                              color: activePostMenuId === post.id ? "var(--color-primary)" : "var(--color-text-muted)",
                              padding: "6px 10px",
                              borderRadius: "50%",
                              cursor: "pointer",
                              fontSize: "1rem",
                              transition: "all 0.15s ease"
                            }}
                            title="Post options"
                          >
                            <i className="fa-solid fa-ellipsis"></i>
                          </button>

                          {activePostMenuId === post.id && (
                            <div style={{
                              position: "absolute",
                              right: 0,
                              top: "100%",
                              zIndex: 100,
                              background: "var(--color-bg-card)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "10px",
                              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                              minWidth: "190px",
                              padding: "6px 0"
                            }}>
                              {/* If current user is author or platform admin */}
                              {(user?.id === post.author.id || user?.role === "ADMIN") ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePostMenuId(null);
                                    handleDeletePost(post.id);
                                  }}
                                  style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "8px 14px",
                                    background: "none",
                                    border: "none",
                                    color: "#dc2626",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                  }}
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                  Delete post
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      handleToggleFollow(post.author.id, post.author.name);
                                    }}
                                    style={{
                                      width: "100%",
                                      textAlign: "left",
                                      padding: "8px 14px",
                                      background: "none",
                                      border: "none",
                                      color: "var(--color-text-main)",
                                      fontSize: "0.85rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px"
                                    }}
                                  >
                                    <i className={`fa-solid ${followedScholars[post.author.id] ? "fa-user-check" : "fa-user-plus"}`}></i>
                                    {followedScholars[post.author.id] ? "Following Scholar" : `Follow ${post.author.name.split(" ")[0]}`}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      copyPostLink(post.id);
                                    }}
                                    style={{
                                      width: "100%",
                                      textAlign: "left",
                                      padding: "8px 14px",
                                      background: "none",
                                      border: "none",
                                      color: "var(--color-text-main)",
                                      fontSize: "0.85rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px"
                                    }}
                                  >
                                    <i className="fa-regular fa-copy"></i>
                                    Copy link to post
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      showToast(`Muted updates from ${post.author.name}`);
                                    }}
                                    style={{
                                      width: "100%",
                                      textAlign: "left",
                                      padding: "8px 14px",
                                      background: "none",
                                      border: "none",
                                      color: "var(--color-text-muted)",
                                      fontSize: "0.85rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px"
                                    }}
                                  >
                                    <i className="fa-solid fa-bell-slash"></i>
                                    Mute scholar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      showToast("Thank you for your report. Our academic ethics committee will review it.");
                                    }}
                                    style={{
                                      width: "100%",
                                      textAlign: "left",
                                      padding: "8px 14px",
                                      background: "none",
                                      border: "none",
                                      color: "#dc2626",
                                      fontSize: "0.85rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px"
                                    }}
                                  >
                                    <i className="fa-regular fa-flag"></i>
                                    Report post
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Paper Title (if present) */}
                      {post.title && (
                        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 0.5rem", lineHeight: 1.4 }}>
                          {post.title}
                        </h2>
                      )}

                      {/* Content Body with "see more" */}
                      <div style={{ fontSize: "0.92rem", color: "var(--color-text-body)", lineHeight: 1.6, marginBottom: "0.85rem", whiteSpace: "pre-line" }}>
                        {displayedContent}
                        {isLongText && !isExpanded && (
                          <button
                            type="button"
                            onClick={() => setExpandedText(prev => ({ ...prev, [post.id]: true }))}
                            style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", marginLeft: "6px", fontSize: "0.85rem" }}
                          >
                            ...see more
                          </button>
                        )}
                      </div>

                      {/* MULTI-MEDIA ATTACHMENTS */}

                      {/* 1. DOCUMENT ATTACHMENT: DOCUMENT READER IN-FEED CARD */}
                      {post.attachmentUrl && post.attachmentType === "DOCUMENT" && (
                        <div 
                          style={{ 
                            background: "var(--color-bg-card-subtle)", 
                            borderRadius: "12px", 
                            border: "1px solid var(--color-border)", 
                            overflow: "hidden", 
                            marginBottom: "1rem" 
                          }}
                        >
                          {/* Viewer Header Bar */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 1rem", borderBottom: "1px solid var(--color-border)", background: "rgba(15, 23, 42, 0.03)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <i className="fa-solid fa-file-pdf" style={{ color: "#dc2626", fontSize: "1.1rem" }}></i>
                              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--color-text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {post.attachmentName || "Scholarly_Paper_Draft.pdf"}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", background: "var(--color-bg-card)", padding: "2px 8px", borderRadius: "10px", border: "1px solid var(--color-border)", whiteSpace: "nowrap", flexShrink: 0 }}>
                              PDF Document
                            </span>
                          </div>

                          {/* In-Feed Document Preview Canvas */}
                          <div 
                            onClick={() => setActiveReaderPost(post)}
                            style={{ 
                              padding: "1.75rem 1.5rem", 
                              background: "#ffffff", 
                              cursor: "pointer", 
                              minHeight: "170px", 
                              display: "flex", 
                              flexDirection: "column", 
                              justifyContent: "center",
                              position: "relative",
                              boxShadow: "inset 0 0 10px rgba(0,0,0,0.03)"
                            }}
                          >
                            <div style={{ maxWidth: "580px", margin: "0 auto", textAlign: "center" }}>
                              <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "var(--color-primary)", marginBottom: "0.3rem" }}>
                                Research Paper & Preprint
                              </div>
                              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem", lineHeight: 1.4 }}>
                                {post.title || post.attachmentName || "Scholarly Working Paper"}
                              </h3>
                              <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 1rem", lineHeight: 1.5 }}>
                                {post.content.slice(0, 140)}...
                              </p>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "var(--color-primary)", fontWeight: 700, background: "rgba(212, 160, 74, 0.12)", padding: "0.45rem 1.1rem", borderRadius: "20px", border: "1px solid rgba(212, 160, 74, 0.25)" }}>
                                <i className="fa-solid fa-expand"></i> Open Document Reader
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. PHOTO / FIGURE ATTACHMENT */}
                      {post.attachmentUrl && post.attachmentType === "IMAGE" && (
                        <div 
                          style={{ 
                            borderRadius: "12px", 
                            overflow: "hidden", 
                            marginBottom: "1rem", 
                            border: "1px solid var(--color-border)",
                            background: "#000000",
                            cursor: "pointer",
                            maxHeight: "420px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          onClick={() => setActiveImagePreview({ url: post.attachmentUrl!, title: post.title || post.attachmentName || "Research Figure" })}
                        >
                          <img 
                            src={post.attachmentUrl} 
                            alt={post.attachmentName || "Research figure"} 
                            style={{ width: "100%", maxHeight: "420px", objectFit: "contain" }}
                          />
                        </div>
                      )}

                      {/* 3. AUDIO RECORDING ATTACHMENT */}
                      {post.attachmentUrl && post.attachmentType === "AUDIO" && (
                        <div 
                          style={{ 
                            background: "var(--color-bg-card-subtle)", 
                            borderRadius: "12px", 
                            border: "1px solid var(--color-border)", 
                            padding: "0.9rem 1.1rem", 
                            marginBottom: "1rem" 
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.6rem" }}>
                            <i className="fa-solid fa-microphone-lines" style={{ color: "#16a34a", fontSize: "1.1rem" }}></i>
                            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--color-text-main)" }}>
                              {post.attachmentName || "Scholar Oral Recording / Field Note"}
                            </span>
                          </div>
                          <audio controls style={{ width: "100%", outline: "none" }}>
                            <source src={post.attachmentUrl} />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}

                      {/* 4. EXTERNAL PUBLICATION LINK / ACADEMIC BACKLINK */}
                      {post.attachmentUrl && (post.attachmentType === "LINK" || post.attachmentUrl.startsWith("http")) && post.attachmentType !== "DOCUMENT" && post.attachmentType !== "IMAGE" && post.attachmentType !== "AUDIO" && (
                        <a 
                          href={post.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                            background: "rgba(245, 158, 11, 0.05)",
                            border: "1px solid rgba(245, 158, 11, 0.25)",
                            borderRadius: "12px",
                            padding: "0.85rem 1.15rem",
                            marginBottom: "1rem",
                            textDecoration: "none",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--color-text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {post.attachmentName || "Original Published Article"}
                              </div>
                              <div style={{ fontSize: "0.74rem", color: "var(--color-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {post.attachmentUrl}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, whiteSpace: "nowrap" }}>
                            Read Full Article ↗
                          </span>
                        </a>
                      )}

                      {/* Hashtags */}
                      {post.tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "0.85rem" }}>
                          {post.tags.map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedTag(tag)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--color-primary)",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: "0"
                              }}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Reaction Counts Row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--color-text-muted)", paddingBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", background: "#e11d48", color: "#ffffff", fontSize: "0.6rem" }}>
                            <i className="fa-solid fa-heart"></i>
                          </span>
                          <span>{post.likesCount} {post.likesCount === 1 ? "like" : "likes"}</span>
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <span>{post.commentsCount} comments</span>
                          <span>•</span>
                          <span>{post.sharesCount} reposts</span>
                        </div>
                      </div>

                      {/* Social Interaction Action Bar */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", textAlign: "center" }}>
                        {/* Like */}
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: post.hasLiked ? "#e11d48" : "var(--color-text-body)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          <i className={`fa-${post.hasLiked ? "solid" : "regular"} fa-heart`}></i>
                          <span>{post.hasLiked ? "Liked" : "Like"}</span>
                        </button>

                        {/* Comment */}
                        <button
                          type="button"
                          onClick={() => setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: activeCommentsPostId === post.id ? "var(--color-primary)" : "var(--color-text-body)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          <i className="fa-regular fa-comment"></i>
                          <span>Comment</span>
                        </button>

                        {/* Repost */}
                        <button
                          type="button"
                          onClick={() => handleRepost(post.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: repostNotices[post.id] ? "#047857" : "var(--color-text-body)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          <i className={repostNotices[post.id] ? "fa-solid fa-check" : "fa-solid fa-repeat"}></i>
                          <span>{repostNotices[post.id] ? "Reposted" : "Repost"}</span>
                        </button>

                        {/* Share */}
                        <button
                          type="button"
                          onClick={() => setActiveSharePost(post)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-text-body)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          <i className="fa-solid fa-share-nodes"></i>
                          <span>Share</span>
                        </button>
                      </div>

                      {/* FACEBOOK-STYLE INLINE DISCUSSION & COMMENTS */}
                      <div style={{ marginTop: "0.85rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.85rem" }}>
                        
                        {/* Comment Input */}
                        {user ? (
                          <div style={{ display: "flex", gap: "8px", marginBottom: "0.85rem" }}>
                            <div 
                              onClick={() => openScholarProfile(user)}
                              style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-primary)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0, cursor: "pointer" }}
                            >
                              {user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <input
                              type="text"
                              placeholder="Add a scholarly observation or reply..."
                              value={commentInputs[post.id] || ""}
                              onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddComment(post.id);
                                }
                              }}
                              className="form-control"
                              style={{ flex: 1, padding: "0.45rem 0.85rem", borderRadius: "20px", fontSize: "0.85rem" }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(post.id)}
                              disabled={submittingComment[post.id]}
                              className="btn btn-primary btn-sm"
                              style={{ padding: "0.4rem 0.9rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}
                            >
                              Post
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.85rem" }}>
                            <Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 700 }}>Sign in</Link> to participate in peer discussion.
                          </div>
                        )}

                        {/* Facebook-style Comments List with 2-Item Preview & Expansion */}
                        {post.recentComments.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            
                            {/* Expand previous comments trigger if more than 2 */}
                            {hasMoreComments && !isCommentsExpanded && (
                              <button
                                type="button"
                                onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: true }))}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--color-text-muted)",
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  textAlign: "left",
                                  padding: "0.2rem 0",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px"
                                }}
                              >
                                <i className="fa-solid fa-angle-down"></i>
                                View all {post.commentsCount || post.recentComments.length} comments
                              </button>
                            )}

                            {visibleComments.map(comment => {
                              const isCommentLong = comment.content.length > 150;
                              const isCommentExpanded = expandedCommentText[comment.id];
                              const commentText = isCommentLong && !isCommentExpanded ? comment.content.slice(0, 150) + "..." : comment.content;

                              return (
                                <div key={comment.id} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                                  <div 
                                    onClick={() => openScholarProfile(comment.author)}
                                    style={{ 
                                      width: "30px", 
                                      height: "30px", 
                                      borderRadius: "50%", 
                                      background: "#e2e8f0", 
                                      color: "#334155", 
                                      display: "flex", 
                                      alignItems: "center", 
                                      justifyContent: "center", 
                                      fontSize: "0.72rem", 
                                      fontWeight: 800, 
                                      flexShrink: 0,
                                      cursor: "pointer",
                                      marginTop: "2px"
                                    }}
                                  >
                                    {comment.author.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                                  </div>

                                  <div style={{ 
                                    background: "var(--color-bg-card-subtle)", 
                                    borderRadius: "14px", 
                                    padding: "0.6rem 0.9rem", 
                                    fontSize: "0.84rem",
                                    flex: 1,
                                    maxWidth: "92%"
                                  }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "3px" }}>
                                      <span 
                                        onClick={() => openScholarProfile(comment.author)}
                                        style={{ fontWeight: 700, color: "var(--color-text-main)", cursor: "pointer", fontSize: "0.85rem" }}
                                      >
                                        {comment.author.name}
                                      </span>
                                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                                        {comment.author.institution || "Scholar"}
                                      </span>
                                    </div>
                                    <div style={{ color: "var(--color-text-body)", lineHeight: 1.45, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                                      {commentText}
                                      {isCommentLong && (
                                        <button
                                          type="button"
                                          onClick={() => setExpandedCommentText(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                          style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", marginLeft: "4px", fontSize: "0.78rem" }}
                                        >
                                          {isCommentExpanded ? "Show less" : "Read more"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Collapse button when expanded */}
                            {hasMoreComments && isCommentsExpanded && (
                              <button
                                type="button"
                                onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: false }))}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--color-text-muted)",
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  textAlign: "left",
                                  padding: "0.2rem 0"
                                }}
                              >
                                Show fewer comments
                              </button>
                            )}

                          </div>
                        )}

                      </div>

                    </article>
                  );
                })}
              </div>
            ))}

          </div>

          {/* RIGHT COLUMN: Sticky Database Trending Tags & Publication Card */}
          <div className="posts-sidebar-right">
            
            {/* Dynamic Trending Research Hashtags Card - Only shown when trending tags exist */}
            {trendingTags.length > 0 && (
              <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "0.85rem" }}>
                  <i className="fa-solid fa-arrow-trend-up" style={{ color: "var(--color-primary)" }}></i>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
                    Trending African Research
                  </h4>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {trendingTags.map(({ tag, count }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      style={{
                        background: selectedTag === tag ? "rgba(212, 160, 74, 0.15)" : "transparent",
                        border: "none",
                        padding: "0.2rem 0",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: selectedTag === tag ? "var(--color-primary)" : "var(--color-text-body)",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <span>#{tag}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                        {count} post{count !== 1 ? "s" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formal Publication Promotion Card */}
            <div className="card-surface" style={{ borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1.25rem", textAlign: "center" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.12)", color: "var(--color-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: "0.6rem" }}>
                <i className="fa-solid fa-book-journal-whills"></i>
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 0.3rem", color: "var(--color-text-main)" }}>
                Publish Formally
              </h4>
              <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0 0 0.85rem", lineHeight: 1.4 }}>
                Ready to submit your manuscript for peer review and continental indexation?
              </p>
              <Link href="/submit" className="btn btn-primary btn-sm" style={{ width: "100%", padding: "0.45rem", fontSize: "0.82rem", fontWeight: 700 }}>
                Submit
              </Link>
            </div>

            {/* Platform notice */}
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.5, padding: "0 0.5rem" }}>
              AfriJournal connects verified African researchers across 54 nations.
            </div>

          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* SCHOLARLY DOCUMENT READER MODAL (Split-screen PDF & Discussion) */}
      {/* ========================================================================= */}
      {activeReaderPost && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
          onClick={() => setActiveReaderPost(null)}
        >
          <div 
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "1150px",
              height: "90vh",
              display: "grid",
              gridTemplateColumns: "1fr clamp(300px, 32%, 360px)",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Left Column: Document Canvas & Controls */}
            <div style={{ background: "#334155", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              
              {/* Reader Top Bar */}
              <div style={{ background: "#1e293b", padding: "0.6rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#ffffff", fontSize: "0.82rem", borderBottom: "1px solid #475569" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <i className="fa-solid fa-file-pdf" style={{ color: "#ef4444" }}></i>
                  <span style={{ fontWeight: 700 }}>{activeReaderPost.attachmentName || activeReaderPost.title || "Scholarly Document Viewer"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {activeReaderPost.attachmentUrl && (
                    <a 
                      href={activeReaderPost.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem", background: "#475569", color: "#ffffff", border: "none" }}
                    >
                      <i className="fa-solid fa-arrow-down" style={{ marginRight: "4px" }}></i> Download
                    </a>
                  )}
                </div>
              </div>

              {/* Reader Viewport */}
              <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", display: "flex", justifyContent: "center", background: "#475569" }}>
                {activeReaderPost.attachmentUrl ? (
                  <iframe 
                    src={activeReaderPost.attachmentUrl}
                    style={{ width: "100%", height: "100%", minHeight: "600px", borderRadius: "8px", border: "none", background: "#ffffff" }}
                    title={activeReaderPost.title || "Scholarly Document"}
                  />
                ) : (
                  <div style={{ background: "#ffffff", maxWidth: "650px", width: "100%", padding: "3rem 2.5rem", borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.3)", color: "#0f172a" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem", lineHeight: 1.3 }}>
                      {activeReaderPost.title || "Scholarly Working Paper"}
                    </h1>
                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
                      <strong>{activeReaderPost.author.name}</strong> • {activeReaderPost.author.institution || "African University"}
                    </div>
                    <div style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "#334155", whiteSpace: "pre-line" }}>
                      {activeReaderPost.content}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Metadata & Citation Generator */}
            <div style={{ background: "#ffffff", padding: "1.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", overflowY: "auto" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.72rem", background: "rgba(212, 160, 74, 0.15)", color: "var(--color-primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 800 }}>
                    Document Reader
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setActiveReaderPost(null)}
                    style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer" }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Author attribution */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "1.2rem" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--color-primary)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem" }}>
                    {activeReaderPost.author.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                      {activeReaderPost.author.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {activeReaderPost.author.institution || "African University"}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.8rem", lineHeight: 1.4 }}>
                  {activeReaderPost.title || "Scholarly Working Paper"}
                </h3>

                {/* Abstract snippet */}
                <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6, margin: "0 0 1.25rem", maxHeight: "150px", overflowY: "auto" }}>
                  {activeReaderPost.content}
                </p>

                {/* Citation Generation Block */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "#64748b" }}>
                      Cite This Work
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {(["APA", "HARVARD", "CHICAGO", "MLA"] as const).map(fmt => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setCitationFormat(fmt)}
                          style={{
                            background: citationFormat === fmt ? "var(--color-primary)" : "#ffffff",
                            color: citationFormat === fmt ? "#ffffff" : "#475569",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            padding: "1px 6px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: "0.76rem", color: "#334155", fontStyle: "italic", lineHeight: 1.5, background: "#ffffff", padding: "0.6rem", borderRadius: "6px", border: "1px solid #e2e8f0", marginBottom: "0.5rem" }}>
                    {generateCitation(activeReaderPost, citationFormat)}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyCitation(generateCitation(activeReaderPost, citationFormat))}
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", padding: "0.3rem", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <i className={copiedCitation ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                    <span>{copiedCitation ? "Citation Copied!" : "Copy Formatted Citation"}</span>
                  </button>
                </div>
              </div>

              {/* Reader Footer Actions */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.85rem", display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    handleToggleLike(activeReaderPost.id);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, padding: "0.45rem", fontSize: "0.82rem" }}
                >
                  <i className={`fa-${activeReaderPost.hasLiked ? "solid" : "regular"} fa-heart`} style={{ color: activeReaderPost.hasLiked ? "#e11d48" : "inherit", marginRight: "4px" }}></i>
                  {activeReaderPost.hasLiked ? "Liked" : "Like"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveReaderPost(null);
                    setActiveCommentsPostId(activeReaderPost.id);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, padding: "0.45rem", fontSize: "0.82rem" }}
                >
                  <i className="fa-regular fa-comment" style={{ marginRight: "4px" }}></i>
                  Comment
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOCIAL MEDIA SHARE POPOVER MODAL */}
      {/* ========================================================================= */}
      {activeSharePost && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem"
          }}
          onClick={() => setActiveSharePost(null)}
        >
          <div 
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "460px",
              padding: "1.5rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              border: "1px solid var(--color-border)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-share-nodes" style={{ color: "var(--color-primary)" }}></i>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
                  Share Research Post
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveSharePost(null)}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.1rem" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 1.25rem" }}>
              Amplify African scholarship across your academic and social networks:
            </p>

            {/* Social Platform Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {/* X / Twitter */}
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/posts#${activeSharePost.id}`;
                  const text = `Read "${activeSharePost.title || activeSharePost.content.slice(0, 100)}" on AfriJournal:`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.6rem 0.8rem", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontSize: "0.85rem" }}
              >
                <i className="fa-brands fa-x-twitter"></i>
                <span>Twitter / X</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/posts#${activeSharePost.id}`;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.6rem 0.8rem", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontSize: "0.85rem", color: "#0077b5" }}
              >
                <i className="fa-brands fa-linkedin"></i>
                <span>LinkedIn</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/posts#${activeSharePost.id}`;
                  const text = `Read "${activeSharePost.title || activeSharePost.content.slice(0, 100)}" on AfriJournal: ${url}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.6rem 0.8rem", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontSize: "0.85rem", color: "#25D366" }}
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/posts#${activeSharePost.id}`;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.6rem 0.8rem", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontSize: "0.85rem", color: "#1877F2" }}
              >
                <i className="fa-brands fa-facebook"></i>
                <span>Facebook</span>
              </button>
            </div>

            {/* Direct Link Copy */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? `${window.location.origin}/posts#${activeSharePost.id}` : ""}
                  className="form-control"
                  style={{ flex: 1, padding: "0.45rem 0.75rem", fontSize: "0.8rem" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/posts#${activeSharePost.id}`;
                    navigator.clipboard.writeText(url);
                    setCopiedShareLink(true);
                    showToast("Link copied to clipboard!");
                    setTimeout(() => setCopiedShareLink(false), 2000);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ padding: "0.45rem 0.9rem", fontSize: "0.8rem", fontWeight: 700 }}
                >
                  <i className={copiedShareLink ? "fa-solid fa-check" : "fa-regular fa-copy"} style={{ marginRight: "4px" }}></i>
                  {copiedShareLink ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCHOLAR PROFILE ACTIVITY DRAWER MODAL */}
      {/* ========================================================================= */}
      {profileDrawerScholar && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem"
          }}
          onClick={() => setProfileDrawerScholar(null)}
        >
          <div 
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
              border: "1px solid var(--color-border)"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-primary), #0284c7)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem" }}>
                  {profileDrawerScholar.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
                    {profileDrawerScholar.name}
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    {profileDrawerScholar.institution || "African Academic Network"}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setProfileDrawerScholar(null)}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Scholar Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-card-subtle)", textAlign: "center" }}>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary)" }}>
                  {profileDrawerScholar.totalCitations || 0}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "6px" }}>Citations</span>
              </div>
              <div style={{ borderLeft: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#16a34a" }}>
                  h-{profileDrawerScholar.hIndex || 0}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginLeft: "6px" }}>h-Index</span>
              </div>
            </div>

            {/* Activity Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", padding: "0 1.5rem" }}>
              <button
                type="button"
                onClick={() => handleProfileDrawerTabChange("posts")}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "none",
                  border: "none",
                  borderBottom: profileDrawerTab === "posts" ? "2px solid var(--color-primary)" : "2px solid transparent",
                  color: profileDrawerTab === "posts" ? "var(--color-primary)" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Posts & Papers
              </button>
              <button
                type="button"
                onClick={() => handleProfileDrawerTabChange("likes")}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "none",
                  border: "none",
                  borderBottom: profileDrawerTab === "likes" ? "2px solid var(--color-primary)" : "2px solid transparent",
                  color: profileDrawerTab === "likes" ? "var(--color-primary)" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Liked Posts
              </button>
              <button
                type="button"
                onClick={() => handleProfileDrawerTabChange("activity")}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "none",
                  border: "none",
                  borderBottom: profileDrawerTab === "activity" ? "2px solid var(--color-primary)" : "2px solid transparent",
                  color: profileDrawerTab === "activity" ? "var(--color-primary)" : "var(--color-text-muted)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                Activity & Reposts
              </button>
            </div>

            {/* Activity Feed Container */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {loadingProfileDrawer ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "var(--color-primary)", marginBottom: "0.5rem" }}></i>
                  <p style={{ fontSize: "0.85rem" }}>Loading scholar activity...</p>
                </div>
              ) : profileDrawerPosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--color-text-muted)" }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: "2rem", marginBottom: "0.8rem" }}></i>
                  <p style={{ fontSize: "0.9rem" }}>No {profileDrawerTab} recorded yet.</p>
                </div>
              ) : (
                profileDrawerPosts.map(p => (
                  <div key={p.id} style={{ background: "var(--color-bg-card-subtle)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                    {p.title && (
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 0.3rem", color: "var(--color-navy)" }}>
                        {p.title}
                      </h4>
                    )}
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-body)", margin: 0, lineHeight: 1.5 }}>
                      {p.content.slice(0, 180)}{p.content.length > 180 ? "..." : ""}
                    </p>
                    <div style={{ display: "flex", gap: "12px", marginTop: "0.6rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      <span><i className="fa-solid fa-heart" style={{ color: "#e11d48", marginRight: "3px" }}></i> {p.likesCount}</span>
                      <span><i className="fa-regular fa-comment" style={{ marginRight: "3px" }}></i> {p.commentsCount}</span>
                      {p.attachmentType === "DOCUMENT" && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDrawerScholar(null);
                            setActiveReaderPost(p);
                          }}
                          style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", marginLeft: "auto", fontSize: "0.75rem" }}
                        >
                          <i className="fa-solid fa-book-open-reader" style={{ marginRight: "4px" }}></i>
                          Read Document
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LIGHTBOX FOR PHOTO / FIGURE PREVIEWS */}
      {/* ========================================================================= */}
      {activeImagePreview && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "2rem"
          }}
          onClick={() => setActiveImagePreview(null)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActiveImagePreview(null)}
              style={{ position: "absolute", top: "-40px", right: 0, background: "none", border: "none", color: "#ffffff", fontSize: "1.5rem", cursor: "pointer" }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <img 
              src={activeImagePreview.url} 
              alt={activeImagePreview.title} 
              style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "8px" }}
            />
            <div style={{ color: "#ffffff", fontSize: "0.85rem", marginTop: "8px", textAlign: "center" }}>
              {activeImagePreview.title}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED POST COMPOSER MODAL WITH AUDIENCE SELECTOR */}
      {/* ========================================================================= */}
      {showComposerModal && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
          onClick={() => setShowComposerModal(false)}
        >
          <div 
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              padding: "1.75rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              border: "1px solid var(--color-border)"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--color-primary)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                  {user ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : <i className="fa-solid fa-user"></i>}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-text-main)" }}>
                    {user?.name}
                  </div>
                  
                  {/* Audience Selector Dropdown */}
                  <div data-dropdown-container="true" style={{ position: "relative", marginTop: "2px" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAudienceMenu(prev => !prev);
                      }}
                      style={{
                        background: "var(--color-bg-card-subtle)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "16px",
                        padding: "2px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      <i className={`fa-solid ${audience === "PUBLIC" ? "fa-earth-africa" : audience === "FOLLOWERS" ? "fa-user-group" : "fa-lock"}`}></i>
                      <span>
                        {audience === "PUBLIC" ? "Anyone on AfriJournal" : audience === "FOLLOWERS" ? "Followers & Mutuals" : "Only Me (Draft)"}
                      </span>
                      <i className="fa-solid fa-caret-down" style={{ fontSize: "0.65rem" }}></i>
                    </button>

                    {showAudienceMenu && (
                      <div style={{
                        position: "absolute",
                        left: 0,
                        top: "100%",
                        marginTop: "4px",
                        zIndex: 100,
                        background: "var(--color-bg-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "10px",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                        width: "210px",
                        padding: "6px 0"
                      }}>
                        <button
                          type="button"
                          onClick={() => { setAudience("PUBLIC"); setShowAudienceMenu(false); }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "6px 12px",
                            background: audience === "PUBLIC" ? "rgba(212, 160, 74, 0.1)" : "none",
                            border: "none",
                            color: audience === "PUBLIC" ? "var(--color-primary)" : "var(--color-text-main)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <i className="fa-solid fa-earth-africa" style={{ width: "16px" }}></i>
                          <div>
                            <div>Anyone (Public)</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Visible to all researchers</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setAudience("FOLLOWERS"); setShowAudienceMenu(false); }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "6px 12px",
                            background: audience === "FOLLOWERS" ? "rgba(212, 160, 74, 0.1)" : "none",
                            border: "none",
                            color: audience === "FOLLOWERS" ? "var(--color-primary)" : "var(--color-text-main)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <i className="fa-solid fa-user-group" style={{ width: "16px" }}></i>
                          <div>
                            <div>Followers / Mutuals</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Visible to mutual scholars</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setAudience("PRIVATE"); setShowAudienceMenu(false); }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "6px 12px",
                            background: audience === "PRIVATE" ? "rgba(212, 160, 74, 0.1)" : "none",
                            border: "none",
                            color: audience === "PRIVATE" ? "var(--color-primary)" : "var(--color-text-main)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}
                        >
                          <i className="fa-solid fa-lock" style={{ width: "16px" }}></i>
                          <div>
                            <div>Only Me</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Personal draft mode</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowComposerModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", color: "var(--color-text-muted)", cursor: "pointer" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {composerError && (
              <div style={{ padding: "0.5rem 0.8rem", borderRadius: "8px", background: "#fef2f2", color: "#b91c1c", fontSize: "0.82rem", marginBottom: "0.85rem" }}>
                {composerError}
              </div>
            )}

            {composerMode === "DRAFT" && (
              <div style={{ padding: "0.85rem 1rem", borderRadius: "10px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", marginBottom: "1rem" }}>
                <div style={{ color: "var(--color-primary)", fontWeight: 800, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                  <i className="fa-solid fa-lock" style={{ color: "var(--color-primary)" }}></i>
                  <span>Private Manuscript Draft Mode</span>
                </div>
                <div style={{ color: "var(--color-text-body)", fontSize: "0.78rem", lineHeight: 1.5 }}>
                  This draft is completely private and hidden from the public feed to safeguard your intellectual property. You can review it, share with designated reviewers, or explore which indexed journal to publish with.
                </div>
              </div>
            )}

            <form onSubmit={handlePublishPost}>
              {/* Optional Title input */}
              <div style={{ marginBottom: "0.8rem" }}>
                <input
                  type="text"
                  placeholder={composerMode === "DRAFT" ? "Manuscript Title / Working Header..." : "Title or Topic (optional)..."}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-control"
                  style={{ width: "100%", padding: "0.55rem 0.85rem", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 700 }}
                />
              </div>

              {/* Main Content Textarea */}
              <div style={{ marginBottom: "0.85rem" }}>
                <textarea
                  rows={4}
                  placeholder={composerMode === "DRAFT" ? "Paste or draft your working paper text, abstract, methodology notes, or outline..." : "Share your research findings, preprint, fieldwork observation, or methodology questions..."}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="form-control"
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", fontSize: "0.92rem", resize: "vertical" }}
                  required
                />
              </div>

              {/* Attached Media Pill Preview */}
              {attachmentUrl && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-bg-card-subtle)", padding: "0.5rem 0.85rem", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <i className={`fa-solid ${attachmentType === "LINK" ? "fa-arrow-up-right-from-square" : attachmentType === "IMAGE" ? "fa-image" : attachmentType === "AUDIO" ? "fa-microphone-lines" : "fa-file-pdf"}`} style={{ color: "var(--color-primary)" }}></i>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-main)" }}>
                      {attachmentName || "Attached Resource"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAttachmentUrl(""); setAttachmentName(""); setAttachmentType(null); }}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* External Publication Link Input Dropdown */}
              {showLinkInput && (
                <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.85rem" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "4px" }}>
                    <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginRight: "4px" }}></i>
                    Published Article Link / DOI (External Publisher Backlink)
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="url"
                      placeholder="https://arjess.org/article/... or DOI URL"
                      value={linkInputUrl}
                      onChange={e => setLinkInputUrl(e.target.value)}
                      className="form-control"
                      style={{ flex: 1, padding: "0.4rem 0.65rem", fontSize: "0.82rem", borderRadius: "6px" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (linkInputUrl.trim()) {
                          const clean = linkInputUrl.trim();
                          setAttachmentUrl(clean);
                          try {
                            const u = new URL(clean);
                            setAttachmentName(`Published on ${u.hostname.replace(/^www\./, "")}`);
                          } catch {
                            setAttachmentName("Published Article Link");
                          }
                          setAttachmentType("LINK");
                          setShowLinkInput(false);
                        }
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }}
                    >
                      Attach Link
                    </button>
                  </div>
                </div>
              )}

              {/* Uploading progress indicator */}
              {uploadingFile && (
                <div style={{ padding: "0.5rem 0.8rem", background: "#eff6ff", borderRadius: "8px", color: "#1d4ed8", fontSize: "0.82rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Validating and uploading media securely...</span>
                </div>
              )}

              {/* Tags Input */}
              <div style={{ marginBottom: "1.2rem" }}>
                <input
                  type="text"
                  placeholder="Tags (comma-separated, e.g. HigherEducation, Governance, Kenya)"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="form-control"
                  style={{ width: "100%", padding: "0.45rem 0.75rem", borderRadius: "8px", fontSize: "0.82rem" }}
                />
              </div>

              {/* Modal Footer: Media Attach Buttons + Post Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "0.85rem" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => docInputRef.current?.click()}
                    title="Attach Document or PDF"
                    style={{ background: "none", border: "1px solid var(--color-border)", padding: "0.35rem 0.7rem", borderRadius: "6px", cursor: "pointer", color: "#dc2626", fontSize: "0.85rem" }}
                  >
                    <i className="fa-solid fa-file-pdf"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    title="Attach Photo or Figure"
                    style={{ background: "none", border: "1px solid var(--color-border)", padding: "0.35rem 0.7rem", borderRadius: "6px", cursor: "pointer", color: "#0284c7", fontSize: "0.85rem" }}
                  >
                    <i className="fa-solid fa-image"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    title="Attach Audio Clip"
                    style={{ background: "none", border: "1px solid var(--color-border)", padding: "0.35rem 0.7rem", borderRadius: "6px", cursor: "pointer", color: "#16a34a", fontSize: "0.85rem" }}
                  >
                    <i className="fa-solid fa-microphone-lines"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(!showLinkInput)}
                    title="Attach External Article Link or Publisher URL (e.g. ARJESS, PubMed, Crossref)"
                    style={{ background: showLinkInput ? "var(--color-primary-light)" : "none", border: "1px solid var(--color-border)", padding: "0.35rem 0.7rem", borderRadius: "6px", cursor: "pointer", color: "var(--color-primary)", fontSize: "0.85rem" }}
                  >
                    <i className="fa-solid fa-link"></i>
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDraftId(null);
                      setShowComposerModal(false);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadingFile}
                    className="btn btn-primary btn-sm"
                    style={{
                      padding: "0.45rem 1.4rem",
                      fontSize: "0.85rem",
                      fontWeight: 700
                    }}
                  >
                    {submitting ? "Saving..." : editingDraftId ? "Save Changes" : composerMode === "DRAFT" ? "Save as Private Draft" : "Post"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Posts...</div>}>
      <PostsPageContent />
    </Suspense>
  );
}
