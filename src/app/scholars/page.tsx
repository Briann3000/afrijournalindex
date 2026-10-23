"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../Header";
import Footer from "../Footer";
import { ALL_AFRICAN_COUNTRIES } from "../data/african-countries";

function ScholarsDirectoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryInterest = searchParams.get("interest") || "";
  const querySearch = searchParams.get("q") || "";
  const queryCountry = searchParams.get("country") || "";
  const querySort = searchParams.get("sort") || "citations";
  const queryPage = parseInt(searchParams.get("page") || "1", 10);
  const queryLimit = parseInt(searchParams.get("limit") || "15", 10);
  const queryDiaspora = searchParams.get("diaspora") === "true";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scholars, setScholars] = useState<any[]>([]);
  const [broadDisciplines, setBroadDisciplines] = useState<{ name: string; count: number }[]>([]);
  const [topSubDisciplines, setTopSubDisciplines] = useState<{ name: string; count: number }[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0, totalPages: 1 });
  
  const [searchTerm, setSearchTerm] = useState<string>(querySearch);
  const [selectedInterest, setSelectedInterest] = useState<string>(queryInterest);
  const [selectedCountry, setSelectedCountry] = useState<string>(queryCountry);
  const [selectedSort, setSelectedSort] = useState<string>(querySort);
  const [pageSize, setPageSize] = useState<number>(queryLimit);
  const [includeDiaspora, setIncludeDiaspora] = useState<boolean>(queryDiaspora);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.authenticated) {
          setCurrentUser(json.user);
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      }
    }
    checkAuth();
  }, []);

  const loadScholars = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (selectedInterest.trim()) params.set("interest", selectedInterest.trim());
      if (selectedCountry.trim()) params.set("country", selectedCountry.trim());
      if (selectedSort) params.set("sort", selectedSort);
      if (includeDiaspora) params.set("diaspora", "true");
      params.set("page", queryPage.toString());
      params.set("limit", pageSize.toString());

      const res = await fetch(`/api/scholars?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setScholars(json.data.scholars || []);
        setBroadDisciplines(json.data.broadDisciplines || []);
        setTopSubDisciplines(json.data.topSubDisciplines || []);
        setPagination(json.data.pagination || { page: 1, limit: pageSize, totalCount: 0, totalPages: 1 });
      }
    } catch (e) {
      console.error("Failed to load scholars:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScholars();
  }, [selectedInterest, selectedCountry, selectedSort, queryPage, pageSize, includeDiaspora]);

  // Load followed state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const followed: string[] = [];
        scholars.forEach(s => {
          if (localStorage.getItem(`afri_follow_${s.id}`) === "true") {
            followed.push(s.id);
          }
        });
        setFollowedIds(followed);
      } catch {}
    }
  }, [scholars]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchTerm.trim(), page: "1" });
    loadScholars();
  };

  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`/scholars?${params.toString()}`);
  };

  const handleSelectInterest = (interestName: string) => {
    const next = selectedInterest === interestName ? "" : interestName;
    setSelectedInterest(next);
    updateUrl({ interest: next, page: "1" });
  };

  const handleCountryChange = (countryName: string) => {
    setSelectedCountry(countryName);
    updateUrl({ country: countryName, page: "1" });
  };

  const handleSortChange = (sortKey: string) => {
    setSelectedSort(sortKey);
    updateUrl({ sort: sortKey, page: "1" });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    updateUrl({ limit: newSize.toString(), page: "1" });
  };

  const handleToggleFollow = (scholarId: string, scholarName: string) => {
    if (!currentUser) {
      setShowLoginPromptModal(true);
      return;
    }
    const isFollowed = followedIds.includes(scholarId);
    const updated = isFollowed 
      ? followedIds.filter(id => id !== scholarId)
      : [...followedIds, scholarId];
    setFollowedIds(updated);
    if (typeof window !== "undefined") {
      if (isFollowed) {
        localStorage.removeItem(`afri_follow_${scholarId}`);
        showToast(`Unfollowed ${scholarName}`);
      } else {
        localStorage.setItem(`afri_follow_${scholarId}`, "true");
        showToast(`You are now following ${scholarName}!`);
      }
    }
  };

  // Country Flag Resolver
  const getCountryFlag = (countryName: string) => {
    const found = ALL_AFRICAN_COUNTRIES.find(
      c => c.name.toLowerCase() === (countryName || "").toLowerCase()
    );
    return found ? found.flag : "🌍";
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 1. Global Navigation Header */}
      <Header activePage="scholars" />

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: "#181820",
            color: "#ffffff",
            padding: "0.75rem 1.25rem",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 9999,
            fontSize: "0.85rem",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: "#10b981" }}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Wide Layout (Optimized for Scholar Table Density) */}
      <main className="scholars-main-container" style={{ flex: 1, padding: "2rem", maxWidth: "1440px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        
        {/* 1. Header Banner */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.25rem" }}>
            <i className="fa-solid fa-graduation-cap"></i>
            <span>Continental Academic Index</span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.35rem", letterSpacing: "-0.5px" }}>
            African Scholar Directory
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--color-text-muted)", maxWidth: "880px", margin: 0, lineHeight: 1.5 }}>
            Verified African researchers, faculty members, and scholars across African universities with authentic citation counts, h-indices, and institutional domains.
          </p>
        </div>

        {/* 2. Industry-Standard Search & Filter Console (Clean Horizontal Layout) */}
        <div 
          className="card-surface" 
          style={{ 
            padding: "1.1rem 1.4rem", 
            borderRadius: "14px", 
            border: "1px solid var(--color-border)", 
            background: "var(--color-bg-card)",
            marginBottom: "1.5rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
          }}
        >
          {/* Row 1: Primary Search Input & Action */}
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "0.6rem", width: "100%", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search African scholars by name, university, or research field..."
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 2.4rem 0 2.5rem",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-base)",
                  fontSize: "0.92rem",
                  color: "var(--color-text-main)",
                  outline: "none"
                }}
              />
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontSize: "0.9rem" }}></i>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => { setSearchTerm(""); updateUrl({ q: "" }); }}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "2px" }}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: "44px",
                padding: "0 1.5rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.9rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                whiteSpace: "nowrap",
                flexShrink: 0
              }}
            >
              <i className="fa-solid fa-magnifying-glass"></i>
              <span>Search</span>
            </button>
          </form>

          {/* Row 2: Clean Inline Horizontal Filter Ribbon */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.9rem", paddingTop: "0.85rem", borderTop: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Filter by:
            </span>

            {/* Country Selector */}
            <select
              value={selectedCountry}
              onChange={e => handleCountryChange(e.target.value)}
              style={{
                height: "36px",
                padding: "0 0.8rem",
                borderRadius: "7px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-base)",
                color: "var(--color-text-main)",
                fontSize: "0.82rem",
                minWidth: "165px",
                cursor: "pointer"
              }}
            >
              <option value="">All African Countries</option>
              {ALL_AFRICAN_COUNTRIES.map(c => (
                <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={selectedSort}
              onChange={e => handleSortChange(e.target.value)}
              style={{
                height: "36px",
                padding: "0 0.8rem",
                borderRadius: "7px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-base)",
                color: "var(--color-text-main)",
                fontSize: "0.82rem",
                minWidth: "165px",
                cursor: "pointer"
              }}
            >
              <option value="citations">Sort: Most Cited</option>
              <option value="hindex">Sort: Highest h-index</option>
              <option value="publications">Sort: Most Articles</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            {/* Page Size Selector */}
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              style={{
                height: "36px",
                padding: "0 0.65rem",
                borderRadius: "7px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-base)",
                color: "var(--color-text-main)",
                fontSize: "0.82rem",
                minWidth: "110px",
                cursor: "pointer"
              }}
            >
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            {/* Diaspora Inclusion Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const nextDiaspora = !includeDiaspora;
                setIncludeDiaspora(nextDiaspora);
                updateUrl({ diaspora: nextDiaspora ? "true" : "", page: "1" });
              }}
              style={{
                height: "36px",
                padding: "0 0.85rem",
                borderRadius: "7px",
                fontSize: "0.8rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                border: "1px solid",
                background: includeDiaspora ? "rgba(139, 92, 246, 0.12)" : "var(--color-bg-base)",
                borderColor: includeDiaspora ? "#8b5cf6" : "var(--color-border)",
                color: includeDiaspora ? "#7c3aed" : "var(--color-text-body)",
                transition: "all 0.15s ease"
              }}
              title="Toggle to include verified African scholars affiliated with international universities abroad"
            >
              <i className="fa-solid fa-earth-africa" style={{ color: includeDiaspora ? "#7c3aed" : "var(--color-text-muted)" }}></i>
              <span>{includeDiaspora ? "Diaspora Included" : "Include Diaspora"}</span>
              {includeDiaspora && <i className="fa-solid fa-check" style={{ fontSize: "0.72rem" }}></i>}
            </button>

            {/* Active Filters Clear Button */}
            {(selectedInterest || selectedCountry || searchTerm || includeDiaspora) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedInterest("");
                  setSelectedCountry("");
                  setSearchTerm("");
                  router.push("/scholars");
                }}
                className="btn btn-secondary"
                style={{
                  height: "36px",
                  padding: "0 0.85rem",
                  borderRadius: "7px",
                  fontSize: "0.8rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  cursor: "pointer"
                }}
              >
                <i className="fa-solid fa-rotate-left"></i>
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Disciplinary Taxonomy (Standardized Continental Broad Disciplines) */}
        <div style={{ marginBottom: "1.4rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem", marginBottom: "0.55rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Academic Disciplines
            </div>

            {/* Sub-discipline Dropdown for Granular Research Areas */}
            {topSubDisciplines.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>Specialization:</span>
                <select
                  value={topSubDisciplines.some(sd => sd.name === selectedInterest) ? selectedInterest : ""}
                  onChange={e => handleSelectInterest(e.target.value)}
                  style={{
                    height: "32px",
                    padding: "0 0.6rem",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-card)",
                    color: "var(--color-text-main)",
                    fontSize: "0.78rem"
                  }}
                >
                  <option value="">All Specializations</option>
                  {topSubDisciplines.map(sd => (
                    <option key={sd.name} value={sd.name}>{sd.name} ({sd.count})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Clean Broad Discipline Pills (Single Line / Clean Wrap) */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => handleSelectInterest("")}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                border: "1px solid",
                background: selectedInterest === "" ? "var(--color-primary)" : "var(--color-bg-card)",
                color: selectedInterest === "" ? "#ffffff" : "var(--color-text-main)",
                borderColor: selectedInterest === "" ? "var(--color-primary)" : "var(--color-border)",
                transition: "all 0.15s ease"
              }}
            >
              All Disciplines
            </button>
            {broadDisciplines.map(disc => {
              const isSelected = selectedInterest.toLowerCase() === disc.name.toLowerCase();
              return (
                <button
                  key={disc.name}
                  type="button"
                  onClick={() => handleSelectInterest(disc.name)}
                  style={{
                    padding: "0.35rem 0.85rem",
                    borderRadius: "20px",
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 700 : 600,
                    cursor: "pointer",
                    border: "1px solid",
                    background: isSelected ? "var(--color-primary)" : "var(--color-bg-card)",
                    color: isSelected ? "#ffffff" : "var(--color-text-body)",
                    borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>{disc.name}</span>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    opacity: isSelected ? 0.9 : 0.7,
                    background: isSelected ? "rgba(255,255,255,0.2)" : "var(--color-bg-card-subtle)",
                    padding: "1px 5px",
                    borderRadius: "10px"
                  }}>
                    {disc.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Table Header Stats & Showing Count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          <div>
            Showing <strong>{pagination.totalCount > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</strong> – <strong>{Math.min(pagination.page * pagination.limit, pagination.totalCount)}</strong> of <strong>{pagination.totalCount.toLocaleString()}</strong> indexed African scholars
          </div>
          <div>
            Sorted by <strong>{selectedSort === "citations" ? "Most Cited" : selectedSort === "hindex" ? "Highest h-index" : selectedSort === "publications" ? "Most Articles" : "Name (A-Z)"}</strong>
          </div>
        </div>

        {/* 5. Scholars Table Format with Continuous Index Numbering (#) */}
        <div 
          className="card-surface" 
          style={{ 
            borderRadius: "14px", 
            border: "1px solid var(--color-border)", 
            background: "var(--color-bg-card)",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)"
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-muted)" }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2.2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
              <p style={{ fontSize: "1rem", fontWeight: 600 }}>Loading African scholars catalog...</p>
            </div>
          ) : scholars.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
              <i className="fa-solid fa-user-graduate" style={{ fontSize: "3rem", color: "var(--color-text-lighter)", marginBottom: "1rem" }}></i>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
                No Scholars Found
              </h3>
              <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", maxWidth: "460px", margin: "0 auto 1.5rem", lineHeight: 1.5 }}>
                No researchers match your search or filter criteria. Try adjusting your country or discipline filter.
              </p>
              <button
                onClick={() => {
                  setSelectedInterest("");
                  setSelectedCountry("");
                  setSearchTerm("");
                  router.push("/scholars");
                }}
                className="btn btn-secondary btn-sm"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="scholars-desktop-table" style={{ overflowX: "auto", width: "100%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg-card-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                      {/* Continuous Continental Number Column */}
                      <th style={{ padding: "0.9rem 0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textAlign: "center", width: "55px", minWidth: "55px" }}>
                        #
                      </th>
                      <th 
                        onClick={() => handleSortChange("name")}
                        style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--color-text-main)", cursor: "pointer", userSelect: "none", minWidth: "280px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>Scholar</span>
                          {selectedSort === "name" && <i className="fa-solid fa-arrow-down-a-z" style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>}
                        </div>
                      </th>
                      <th style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--color-text-main)", minWidth: "220px" }}>
                        Affiliation & Country
                      </th>
                      <th 
                        onClick={() => handleSortChange("citations")}
                        style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--color-text-main)", textAlign: "right", cursor: "pointer", userSelect: "none", minWidth: "120px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          <span>Citations</span>
                          {selectedSort === "citations" && <i className="fa-solid fa-arrow-down-wide-short" style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortChange("hindex")}
                        style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--color-text-main)", textAlign: "center", cursor: "pointer", userSelect: "none", minWidth: "100px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <span>h-index</span>
                          {selectedSort === "hindex" && <i className="fa-solid fa-arrow-down-wide-short" style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortChange("publications")}
                        style={{ padding: "0.9rem 1rem", fontWeight: 700, color: "var(--color-text-main)", textAlign: "center", cursor: "pointer", userSelect: "none", minWidth: "100px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <span>Articles</span>
                          {selectedSort === "publications" && <i className="fa-solid fa-arrow-down-wide-short" style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>}
                        </div>
                      </th>
                      <th style={{ padding: "0.9rem 1.25rem", fontWeight: 700, color: "var(--color-text-main)", textAlign: "right", minWidth: "140px" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scholars.map((scholar: any, idx: number) => {
                      const rowNumber = (pagination.page - 1) * pagination.limit + idx + 1;
                      const initials = scholar.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      const isFollowed = followedIds.includes(scholar.id);

                      return (
                        <tr 
                          key={scholar.id}
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                            background: idx % 2 === 0 ? "transparent" : "var(--color-bg-card-subtle)",
                            transition: "background 0.15s ease"
                          }}
                        >
                          {/* Column 0: Numbering (#) */}
                          <td style={{ padding: "1rem 0.75rem", textAlign: "center", fontWeight: 800, color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                            <span style={{ 
                              display: "inline-flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              minWidth: "28px",
                              height: "26px",
                              padding: "0 6px",
                              borderRadius: "6px",
                              background: "var(--color-bg-card-subtle)",
                              border: "1px solid var(--color-border)",
                              fontSize: "0.78rem"
                            }}>
                              {rowNumber}
                            </span>
                          </td>

                          {/* Column 1: Scholar Info */}
                          <td style={{ padding: "1rem 1.25rem" }}>
                            <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                              <div 
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "50%",
                                  background: "linear-gradient(135deg, var(--color-primary), #0369a1)",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: "0.95rem",
                                  flexShrink: 0,
                                  marginTop: "2px"
                                }}
                              >
                                {initials}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <a 
                                  href={`/researcher?id=${scholar.id}`}
                                  style={{ 
                                    color: "var(--color-text-main)", 
                                    fontWeight: 700, 
                                    fontSize: "0.98rem", 
                                    textDecoration: "none",
                                    display: "inline-block",
                                    marginBottom: "2px"
                                  }}
                                >
                                  {scholar.name}
                                </a>

                                {scholar.isVerified && (
                                  <div style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                                    <i className="fa-solid fa-shield-halved" style={{ fontSize: "0.7rem" }}></i>
                                    <span>Verified at {scholar.verifiedDomain}</span>
                                  </div>
                                )}

                                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "4px", alignItems: "center" }}>
                                  {/* Primary Broad Discipline Badge */}
                                  <span style={{
                                    background: "rgba(2, 132, 199, 0.08)",
                                    border: "1px solid rgba(2, 132, 199, 0.25)",
                                    borderRadius: "4px",
                                    padding: "0.15rem 0.5rem",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: "var(--color-primary)"
                                  }}>
                                    {scholar.broadDiscipline}
                                  </span>

                                  {/* Specific Research Interests */}
                                  {scholar.researchInterests.slice(0, 2).map((tag: string) => {
                                    if (tag === scholar.broadDiscipline) return null;
                                    return (
                                      <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleSelectInterest(tag)}
                                        title={`Filter scholars in ${tag}`}
                                        style={{
                                          background: "var(--color-bg-card)",
                                          border: "1px solid var(--color-border)",
                                          borderRadius: "4px",
                                          padding: "0.15rem 0.45rem",
                                          fontSize: "0.7rem",
                                          fontWeight: 600,
                                          color: "var(--color-text-muted)",
                                          cursor: "pointer"
                                        }}
                                      >
                                        {tag}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Affiliation & Country */}
                          <td style={{ padding: "1rem" }}>
                            <div style={{ fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>
                              <a 
                                href={`/institution?name=${encodeURIComponent(scholar.institution)}`}
                                style={{ color: "inherit", textDecoration: "none" }}
                                title="View Institution Profile"
                              >
                                {scholar.institution}
                              </a>
                            </div>
                            {scholar.isDiaspora ? (
                              <span style={{ background: "rgba(139, 92, 246, 0.12)", border: "1px solid rgba(139, 92, 246, 0.3)", padding: "0.15rem 0.55rem", borderRadius: "999px", fontSize: "0.74rem", fontWeight: 700, color: "#7c3aed", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <i className="fa-solid fa-earth-africa"></i>
                                <span>{scholar.originCountry && scholar.originCountry !== "African Diaspora" ? `${getCountryFlag(scholar.originCountry)} ${scholar.originCountry} (Diaspora)` : "African Diaspora"}</span>
                              </span>
                            ) : (
                              <span style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", padding: "0.15rem 0.5rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <span>{getCountryFlag(scholar.institutionCountry)}</span>
                                <span>{scholar.institutionCountry}</span>
                              </span>
                            )}
                          </td>

                          {/* Column 3: Citations */}
                          <td style={{ padding: "1rem", textAlign: "right" }}>
                            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-primary)", display: "block" }}>
                              {scholar.totalCitations.toLocaleString()}
                            </span>
                          </td>

                          {/* Column 4: h-index */}
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <span 
                              style={{ 
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0.2rem 0.65rem", 
                                borderRadius: "6px", 
                                fontWeight: 800, 
                                fontSize: "0.85rem",
                                background: scholar.hIndex >= 20 ? "rgba(22, 163, 74, 0.12)" : "rgba(2, 132, 199, 0.1)",
                                color: scholar.hIndex >= 20 ? "#16a34a" : "var(--color-primary)",
                                border: `1px solid ${scholar.hIndex >= 20 ? "rgba(22, 163, 74, 0.3)" : "rgba(2, 132, 199, 0.25)"}`
                              }}
                            >
                              h-{scholar.hIndex}
                            </span>
                          </td>

                          {/* Column 5: Articles Count */}
                          <td style={{ padding: "1rem", textAlign: "center" }}>
                            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                              {scholar.articlesCount}
                            </span>
                          </td>

                          {/* Column 6: Actions */}
                          <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "0.45rem", justifyContent: "flex-end", alignItems: "center" }}>
                              {!scholar.isClaimed && (
                                <a
                                  href={`/researcher?id=${scholar.id}&claim=true`}
                                  style={{
                                    background: "rgba(234, 88, 12, 0.1)",
                                    color: "#ea580c",
                                    border: "1px solid rgba(234, 88, 12, 0.3)",
                                    padding: "0.32rem 0.65rem",
                                    fontSize: "0.74rem",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    borderRadius: "6px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                  title="Are you this scholar? Claim your verified profile"
                                >
                                  <i className="fa-solid fa-key" style={{ fontSize: "0.68rem" }}></i>
                                  <span>Claim</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleToggleFollow(scholar.id, scholar.name)}
                                className={isFollowed ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                                style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                                title={currentUser ? (isFollowed ? "Unfollow scholar" : "Follow scholar") : "Sign in to follow scholar"}
                              >
                                <i className={isFollowed ? "fa-solid fa-check" : "fa-solid fa-user-plus"} style={{ marginRight: "4px" }}></i>
                                {isFollowed ? "Following" : "Follow"}
                              </button>

                              <a
                                href={`/researcher?id=${scholar.id}`}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
                                title="View Scholar Profile"
                              >
                                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (Strict Responsive Zero Overflow) */}
              <div className="scholars-mobile-cards" style={{ display: "none", flexDirection: "column", gap: "0.75rem", padding: "0.75rem" }}>
                {scholars.map((scholar: any, idx: number) => {
                  const rowNumber = (pagination.page - 1) * pagination.limit + idx + 1;
                  const initials = scholar.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const isFollowed = followedIds.includes(scholar.id);

                  return (
                    <div 
                      key={scholar.id} 
                      style={{
                        background: "var(--color-bg-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "10px",
                        padding: "0.9rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0 }}>
                          <span style={{ 
                            fontSize: "0.74rem", 
                            fontWeight: 800, 
                            color: "var(--color-text-muted)",
                            background: "var(--color-bg-card-subtle)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid var(--color-border)"
                          }}>
                            #{rowNumber}
                          </span>
                          <div 
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, var(--color-primary), #0369a1)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              flexShrink: 0
                            }}
                          >
                            {initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <a 
                              href={`/researcher?id=${scholar.id}`}
                              style={{ 
                                color: "var(--color-text-main)", 
                                fontWeight: 700, 
                                fontSize: "0.92rem", 
                                textDecoration: "none",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {scholar.name}
                            </a>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {scholar.institution}
                            </div>
                          </div>
                        </div>

                        <span 
                          style={{ 
                            padding: "0.15rem 0.5rem", 
                            borderRadius: "5px", 
                            fontWeight: 800, 
                            fontSize: "0.78rem",
                            background: scholar.hIndex >= 20 ? "rgba(22, 163, 74, 0.12)" : "rgba(2, 132, 199, 0.1)",
                            color: scholar.hIndex >= 20 ? "#16a34a" : "var(--color-primary)",
                            border: `1px solid ${scholar.hIndex >= 20 ? "rgba(22, 163, 74, 0.3)" : "rgba(2, 132, 199, 0.25)"}`,
                            flexShrink: 0
                          }}
                        >
                          h-{scholar.hIndex}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)", fontSize: "0.78rem" }}>
                        <div>
                          <strong style={{ color: "var(--color-primary)", fontSize: "0.9rem" }}>{scholar.totalCitations.toLocaleString()}</strong> citations • <strong>{scholar.articlesCount}</strong> articles
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleFollow(scholar.id, scholar.name)}
                            className={isFollowed ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                            style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
                          >
                            {isFollowed ? "Following" : "Follow"}
                          </button>
                          <a
                            href={`/researcher?id=${scholar.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.72rem", padding: "0.25rem 0.55rem" }}
                          >
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 6. Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1.2rem", borderTop: "1px solid var(--color-border)", flexWrap: "wrap", gap: "1rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalCount.toLocaleString()} indexed scholars{includeDiaspora ? " • Continental & Diaspora" : " • Continental Africa"})
            </span>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  const nextDiaspora = !includeDiaspora;
                  setIncludeDiaspora(nextDiaspora);
                  updateUrl({ diaspora: nextDiaspora ? "true" : "", page: "1" });
                }}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: "0.78rem",
                  padding: "0.35rem 0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: includeDiaspora ? "rgba(139, 92, 246, 0.12)" : undefined,
                  borderColor: includeDiaspora ? "#8b5cf6" : undefined,
                  color: includeDiaspora ? "#7c3aed" : undefined
                }}
              >
                <i className="fa-solid fa-earth-africa"></i>
                <span>{includeDiaspora ? "Diaspora Included" : "Include Diaspora"}</span>
              </button>

              <button
                disabled={pagination.page <= 1}
                onClick={() => updateUrl({ page: (pagination.page - 1).toString() })}
                className="btn btn-secondary btn-sm"
                style={{ opacity: pagination.page <= 1 ? 0.45 : 1, padding: "0.35rem 0.85rem" }}
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => updateUrl({ page: (pagination.page + 1).toString() })}
                className="btn btn-secondary btn-sm"
                style={{ opacity: pagination.page >= pagination.totalPages ? 0.45 : 1, padding: "0.35rem 0.85rem" }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Modal: Sign In Required to Follow Scholars */}
      {showLoginPromptModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem"
          }}
        >
          <div 
            className="card-surface" 
            style={{
              width: "100%",
              maxWidth: "460px",
              padding: "2rem",
              borderRadius: "16px",
              background: "var(--color-bg-card)",
              textAlign: "center",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)"
            }}
          >
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(2, 132, 199, 0.12)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 1.2rem" }}>
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
              Sign In to Follow African Scholars
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              Follow verified African researchers to track their upcoming publications, co-authorship networks, and citation velocity updates.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <a 
                href="/login" 
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.65rem 1rem", fontSize: "0.9rem", fontWeight: 700 }}
              >
                <i className="fa-solid fa-right-to-bracket" style={{ marginRight: "6px" }}></i>
                Sign In to Continue
              </a>
              <a 
                href="/register" 
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", padding: "0.6rem 1rem", fontSize: "0.85rem" }}
              >
                Create Free Researcher Account
              </a>
              <button
                type="button"
                onClick={() => setShowLoginPromptModal(false)}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "0.82rem", cursor: "pointer", marginTop: "0.4rem" }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function ScholarsDirectoryPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading African Scholar Directory...</div>}>
      <ScholarsDirectoryContent />
    </Suspense>
  );
}
