"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

interface UniversityRankItem {
  rank: number;
  name: string;
  country: string;
  totalPublications: number;
  totalCitations: number;
  averageCitations: string;
  institutionalHIndex: number;
  topDiscipline: string;
  affiliatedJournalsCount: number;
}

function InstitutionContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const nameParam = searchParams.get("name");

  // Tab state: "leaderboard" or "profile"
  const [activeTab, setActiveTab] = useState<"leaderboard" | "profile">(nameParam ? "profile" : "leaderboard");
  
  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<UniversityRankItem[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("rank");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Profile states
  const [currentUnivName, setCurrentUnivName] = useState<string>(nameParam || "University of Nairobi");
  const [searchQuery, setSearchQuery] = useState<string>(nameParam || "");
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Faculty Roster Interactive States
  const [facultySearch, setFacultySearch] = useState<string>("");
  const [facultySort, setFacultySort] = useState<"citations" | "hIndex" | "articles">("citations");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followedFacultyIds, setFollowedFacultyIds] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const featuredUniversities = [
    "University of Cape Town",
    "University of Nairobi",
    "Makerere University",
    "University of Ibadan",
    "Cairo University",
    "Stellenbosch University",
    "Addis Ababa University",
    "University of Ghana"
  ];

  const disciplinesList = [
    "All",
    "Health Sciences",
    "Physical Sciences & Engineering",
    "Agricultural & Environmental Sciences",
    "Social Sciences & Humanities",
    "Business & Economics",
    "Education & Pedagogy"
  ];

  // Check session authentication on mount
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

  // Fetch Leaderboard
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoadingLeaderboard(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("view", "leaderboard");
        if (selectedCountry !== "All") queryParams.set("country", selectedCountry);
        if (selectedDiscipline !== "All") queryParams.set("discipline", selectedDiscipline);
        if (sortBy) queryParams.set("sortBy", sortBy);
        if (tableSearch.trim()) queryParams.set("q", tableSearch.trim());

        const res = await fetch(`/api/institutions/metrics?${queryParams.toString()}`);
        const result = await res.json();
        if (result.success && result.leaderboard) {
          setLeaderboard(result.leaderboard);
          if (result.countries) setCountries(result.countries);
        }
      } catch (err) {
        console.error("Failed to load institution leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    if (activeTab === "leaderboard") {
      fetchLeaderboard();
    }
  }, [activeTab, selectedCountry, selectedDiscipline, sortBy, tableSearch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCountry, selectedDiscipline, sortBy, tableSearch]);

  // Pagination calculation
  const totalItems = leaderboard.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeaderboard = leaderboard.slice(startIndex, endIndex);

  // Fetch University Profile Drilldown
  const loadUniversityProfile = async (univName: string) => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch(`/api/institutions/metrics?name=${encodeURIComponent(univName)}`);
      const result = await res.json();
      const instData = result.data || result.institution;
      if (result.success && instData) {
        setProfileData(instData);
      } else {
        setProfileError(result.error || "University record not found in index.");
      }
    } catch (err) {
      console.error(err);
      setProfileError("Could not connect to database.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (activeTab === "profile" && currentUnivName) {
      loadUniversityProfile(currentUnivName);
    }
  }, [activeTab, currentUnivName]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentUnivName(searchQuery.trim());
      setActiveTab("profile");
      router.push(`/institution?name=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectUniversity = (univName: string) => {
    setCurrentUnivName(univName);
    setSearchQuery(univName);
    setActiveTab("profile");
    router.push(`/institution?name=${encodeURIComponent(univName)}`);
  };

  const handleToggleFollowFaculty = (facultyId: string, facultyName: string) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    const isFollowed = followedFacultyIds.includes(facultyId);
    let nextList: string[];
    if (isFollowed) {
      nextList = followedFacultyIds.filter(id => id !== facultyId);
      localStorage.removeItem(`afri_follow_${facultyId}`);
      showToast(`Unfollowed ${facultyName}.`);
    } else {
      nextList = [...followedFacultyIds, facultyId];
      localStorage.setItem(`afri_follow_${facultyId}`, "true");
      showToast(`You are now following ${facultyName}!`);
    }
    setFollowedFacultyIds(nextList);
  };

  // Load followed faculty from localStorage when profileData changes
  useEffect(() => {
    if (typeof window !== "undefined" && profileData?.facultyLeaderboard) {
      const followed: string[] = [];
      profileData.facultyLeaderboard.forEach((f: any) => {
        if (localStorage.getItem(`afri_follow_${f.id}`) === "true") {
          followed.push(f.id);
        }
      });
      setFollowedFacultyIds(followed);
    }
  }, [profileData]);

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header activePage="rankings" />

      <main className="container institution-page-container" style={{ maxWidth: "1140px" }}>
        
        {/* Page Header */}
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-building-columns"></i>
            {t.top_institutions.title}
          </span>
          <h1 className="page-title">
            {t.institution_page.title}
          </h1>
          <p className="page-subtitle" style={{ maxWidth: "750px", margin: "0.5rem auto 0" }}>
            {t.institution_page.subtitle}
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div className="institution-tabs-wrapper" style={{ background: "var(--color-bg-card)", padding: "0.35rem", borderRadius: "12px", border: "1px solid var(--color-border)", display: "flex", gap: "0.4rem", boxShadow: "var(--card-shadow)", width: "100%", maxWidth: "440px" }}>
            <button
              onClick={() => {
                setActiveTab("leaderboard");
                router.push("/institution");
              }}
              style={{
                flex: 1,
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "leaderboard" ? "var(--color-primary)" : "transparent",
                color: activeTab === "leaderboard" ? "#ffffff" : "var(--color-text-muted)",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s"
              }}
            >
              <i className="fa-solid fa-list-ol"></i>
              <span>{t.institution_page.tab_leaderboard}</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              style={{
                flex: 1,
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "profile" ? "var(--color-primary)" : "transparent",
                color: activeTab === "profile" ? "#ffffff" : "var(--color-text-muted)",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s"
              }}
            >
              <i className="fa-solid fa-building-columns"></i>
              <span>{t.institution_page.tab_profile}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CONTINENTAL LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Filter Bar */}
            <div className="card-surface" style={{ padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "center" }}>
                
                {/* Search query */}
                <div style={{ position: "relative" }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontSize: "0.85rem" }}></i>
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    placeholder={t.institution_page.search_table}
                    className="form-control"
                    style={{ paddingLeft: "2.4rem" }}
                  />
                </div>

                {/* Country Filter */}
                <div>
                  <select
                    value={selectedCountry}
                    onChange={e => setSelectedCountry(e.target.value)}
                    className="form-control"
                  >
                    <option value="All">{t.rankings_page.all_countries}</option>
                    {countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Discipline Filter */}
                <div>
                  <select
                    value={selectedDiscipline}
                    onChange={e => setSelectedDiscipline(e.target.value)}
                    className="form-control"
                  >
                    {disciplinesList.map(d => (
                      <option key={d} value={d}>{d === "All" ? t.rankings_page.all_disciplines : d}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="form-control"
                    style={{ fontWeight: 600, color: "var(--color-primary)" }}
                  >
                    <option value="rank">{t.institution_page.sort_by}: {t.top_institutions.rank}</option>
                    <option value="hIndex">{t.institution_page.sort_by}: {t.top_institutions.h_index}</option>
                    <option value="citations">{t.institution_page.sort_by}: {t.top_institutions.citations}</option>
                    <option value="publications">{t.institution_page.sort_by}: {t.top_institutions.publications}</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Leaderboard Table / Cards Container */}
            {loadingLeaderboard ? (
              <div style={{ background: "var(--color-bg-card)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "4rem", textAlign: "center" }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
                <p style={{ color: "var(--color-text-muted)" }}>{t.rankings_page.loading}</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div style={{ background: "var(--color-bg-card)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "4rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: "2.5rem", marginBottom: "1rem", color: "var(--color-text-muted)" }}></i>
                <p>{t.institution_page.no_results}</p>
              </div>
            ) : (
              <>
                {/* 1. Mobile Cards View (Shown on screens <= 768px) */}
                <div className="institution-mobile-cards" style={{ display: "none", flexDirection: "column", gap: "0.85rem" }}>
                  {paginatedLeaderboard.map((item) => {
                    const isTop3 = item.rank <= 3;
                    const rankIcon = item.rank === 1 ? "🥇 1" : item.rank === 2 ? "🥈 2" : item.rank === 3 ? "🥉 3" : `#${item.rank}`;
                    const rankBadgeBg = item.rank === 1 ? "#eff6ff" : item.rank === 2 ? "#f1f5f9" : item.rank === 3 ? "#fef3c7" : "var(--color-bg-base)";
                    const rankBadgeColor = item.rank === 1 ? "var(--color-primary)" : item.rank === 2 ? "#475569" : item.rank === 3 ? "#b45309" : "var(--color-text-muted)";

                    return (
                      <div
                        key={item.name}
                        className="card-surface"
                        style={{
                          padding: "1.15rem",
                          borderRadius: "14px",
                          border: isTop3 ? "1.5px solid rgba(13, 148, 136, 0.3)" : "1px solid var(--color-border)",
                          boxShadow: "var(--card-shadow)",
                          background: "var(--color-bg-card)"
                        }}
                      >
                        {/* Header: Rank + University + Country + h-Index */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.6rem", marginBottom: "0.85rem" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", flex: 1 }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0.25rem 0.55rem",
                              borderRadius: "8px",
                              background: rankBadgeBg,
                              color: rankBadgeColor,
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap"
                            }}>
                              {rankIcon}
                            </span>
                            <div>
                              <div 
                                onClick={() => handleSelectUniversity(item.name)}
                                style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.98rem", lineHeight: 1.35, cursor: "pointer" }}
                              >
                                {item.name}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                                <i className="fa-solid fa-location-dot" style={{ color: "var(--color-primary)", fontSize: "0.72rem" }}></i>
                                <span>{item.country}</span>
                                {item.affiliatedJournalsCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{item.affiliatedJournalsCount} {t.showcase.title}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "0.25rem 0.6rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                            h-{item.institutionalHIndex}
                          </span>
                        </div>

                        {/* Metrics Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", background: "var(--color-bg-base)", padding: "0.65rem 0.8rem", borderRadius: "10px", marginBottom: "0.85rem", textAlign: "center" }}>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{t.institution_page.col_publications}</div>
                            <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.92rem", marginTop: "2px" }}>
                              {item.totalPublications.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{t.institution_page.col_citations}</div>
                            <div style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "0.92rem", marginTop: "2px" }}>
                              {item.totalCitations.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>{t.institution_page.col_avg_citations}</div>
                            <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.92rem", marginTop: "2px" }}>
                              {item.averageCitations}
                            </div>
                          </div>
                        </div>

                        {/* Footer: Lead Field & Action Button */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span className="journal-tag" style={{ fontSize: "0.75rem", padding: "0.22rem 0.55rem" }}>
                            {item.topDiscipline}
                          </span>
                          <button
                            onClick={() => handleSelectUniversity(item.name)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                          >
                            <span>{t.institution_page.view_details}</span>
                            <i className="fa-solid fa-chevron-right" style={{ fontSize: "0.68rem" }}></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Desktop Table View (Shown on screens > 768px) */}
                <div className="institution-desktop-table table-responsive" style={{ background: "var(--color-bg-card)", borderRadius: "16px", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)", overflowX: "auto" }}>
                  <table className="academic-table" style={{ width: "100%", minWidth: "720px", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "var(--color-bg-alt)", borderBottom: "1px solid var(--color-border)" }}>
                        <th style={{ width: "80px", textAlign: "center", padding: "1rem" }}>{t.institution_page.col_rank}</th>
                        <th style={{ padding: "1rem" }}>{t.institution_page.col_institution}</th>
                        <th style={{ textAlign: "center", padding: "1rem" }}>{t.institution_page.col_top_discipline}</th>
                        <th style={{ textAlign: "right", padding: "1rem" }}>{t.institution_page.col_publications}</th>
                        <th style={{ textAlign: "right", padding: "1rem" }}>{t.institution_page.col_citations}</th>
                        <th style={{ textAlign: "center", width: "120px", padding: "1rem" }}>{t.institution_page.col_hindex}</th>
                        <th style={{ textAlign: "right", padding: "1rem" }}>{t.institution_page.col_action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeaderboard.map((item) => {
                        const isTop3 = item.rank <= 3;
                        const rankBadgeBg = item.rank === 1 ? "#eff6ff" : item.rank === 2 ? "#f1f5f9" : item.rank === 3 ? "#fef3c7" : "var(--color-bg-card-subtle)";
                        const rankBadgeColor = item.rank === 1 ? "var(--color-primary)" : item.rank === 2 ? "#475569" : item.rank === 3 ? "#b45309" : "var(--color-text-muted)";

                        return (
                          <tr key={item.name} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }} className="hover-row">
                            <td style={{ textAlign: "center", padding: "1rem" }}>
                              <span style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                width: "32px", 
                                height: "32px", 
                                borderRadius: "50%", 
                                background: rankBadgeBg, 
                                color: rankBadgeColor, 
                                fontWeight: 800, 
                                fontSize: "0.85rem",
                                border: isTop3 ? `1px solid ${rankBadgeColor}` : "none"
                              }}>
                                {item.rank}
                              </span>
                            </td>

                            <td style={{ padding: "1rem" }}>
                              <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.98rem" }}>
                                {item.name}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                <i className="fa-solid fa-location-dot" style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>
                                <span>{item.country}</span>
                                {item.affiliatedJournalsCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{item.affiliatedJournalsCount} {t.showcase.title}</span>
                                  </>
                                )}
                              </div>
                            </td>

                            <td style={{ textAlign: "center", padding: "1rem" }}>
                              <span className="journal-tag" style={{ fontSize: "0.75rem" }}>
                                {item.topDiscipline}
                              </span>
                            </td>

                            <td style={{ textAlign: "right", fontWeight: 600, color: "var(--color-text-main)", padding: "1rem" }}>
                              {item.totalPublications.toLocaleString()}
                            </td>

                            <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)", padding: "1rem" }}>
                              {item.totalCitations.toLocaleString()}
                            </td>

                            <td style={{ textAlign: "center", padding: "1rem" }}>
                              <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "0.25rem 0.65rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem" }}>
                                h-{item.institutionalHIndex}
                              </span>
                            </td>

                            <td style={{ textAlign: "right", padding: "1rem" }}>
                              <button
                                onClick={() => handleSelectUniversity(item.name)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                              >
                                {t.institution_page.view_details} <i className="fa-solid fa-chevron-right" style={{ marginLeft: "0.25rem", fontSize: "0.7rem" }}></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalItems > 0 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginTop: "1.5rem",
                    padding: "1rem 1.25rem",
                    background: "var(--color-bg-card)",
                    borderRadius: "14px",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--card-shadow)"
                  }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      Showing <strong style={{ color: "var(--color-navy)" }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> to <strong style={{ color: "var(--color-navy)" }}>{endIndex}</strong> of <strong style={{ color: "var(--color-navy)" }}>{totalItems}</strong> institutions
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                      >
                        <i className="fa-solid fa-chevron-left" style={{ marginRight: "4px" }}></i> Previous
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          return (
                            <React.Fragment key={p}>
                              {prev && p - prev > 1 && (
                                <span style={{ padding: "0 4px", color: "var(--color-text-muted)", fontSize: "0.82rem" }}>...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(p)}
                                style={{
                                  minWidth: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                  border: currentPage === p ? "none" : "1px solid var(--color-border)",
                                  background: currentPage === p ? "var(--color-primary)" : "#ffffff",
                                  color: currentPage === p ? "#ffffff" : "var(--color-text-main)",
                                  fontWeight: 700,
                                  fontSize: "0.82rem",
                                  cursor: "pointer"
                                }}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem", opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                      >
                        Next <i className="fa-solid fa-chevron-right" style={{ marginLeft: "4px" }}></i>
                      </button>

                      <div style={{ marginLeft: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Per page:</span>
                        <select
                          value={pageSize}
                          onChange={e => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="form-control"
                          style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.82rem", height: "32px" }}
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: UNIVERSITY PROFILE DRILL-DOWN CONSOLE */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Search & Selector Card */}
            <div className="card-surface" style={{ padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
              <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                  <i className="fa-solid fa-building-columns" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-primary)" }}></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t.institution_page.search_univ_placeholder}
                    className="form-control"
                    style={{ paddingLeft: "2.6rem" }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", minHeight: "44px" }}>
                  {t.common.search}
                </button>
              </form>

              {/* Quick links */}
              <div style={{ marginTop: "1.2rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>{t.institution_page.featured_label}</span>
                {featuredUniversities.map(univ => (
                  <button
                    key={univ}
                    onClick={() => handleSelectUniversity(univ)}
                    style={{
                      background: currentUnivName === univ ? "#eff6ff" : "#ffffff",
                      border: currentUnivName === univ ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      color: currentUnivName === univ ? "var(--color-primary)" : "var(--color-text-muted)",
                      padding: "0.25rem 0.7rem",
                      borderRadius: "15px",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      fontWeight: currentUnivName === univ ? 700 : 500
                    }}
                  >
                    {univ}
                  </button>
                ))}
              </div>
            </div>

            {loadingProfile ? (
              <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
                <p style={{ color: "var(--color-text-muted)" }}>{t.rankings_page.loading}</p>
              </div>
            ) : profileError || !profileData ? (
              <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
                <i className="fa-solid fa-building-columns" style={{ fontSize: "3rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
                <h2 style={{ color: "var(--color-text-main)" }}>{t.institution_page.no_results}</h2>
                <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 1.5rem" }}>{profileError || t.institution_page.no_results}</p>
                <button onClick={() => setActiveTab("leaderboard")} className="btn btn-secondary">
                  {t.institution_page.back_to_leaderboard}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* Institution Header Banner */}
                <div className="card-surface" style={{ padding: "1.75rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ flex: 1, minWidth: "260px" }}>
                      <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
                        <i className="fa-solid fa-graduation-cap"></i>
                        {t.institution_page.tab_profile}
                      </span>
                      <h1 style={{ fontSize: "clamp(1.3rem, 4vw, 2rem)", margin: "0.2rem 0 0.5rem", color: "var(--color-text-main)", fontWeight: 800, lineHeight: 1.3 }}>
                        {profileData.name}
                      </h1>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                        <i className="fa-solid fa-location-dot" style={{ color: "var(--color-primary)" }}></i>
                        <span>{profileData.country || "African Academic Institution"}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                      <a 
                        href={`/scholars?q=${encodeURIComponent(profileData.name)}`}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.45rem", whiteSpace: "nowrap" }}
                        title={`Explore all ${profileData.name} researchers in the continental directory`}
                      >
                        <i className="fa-solid fa-users"></i> Explore Scholars in Directory
                      </a>

                      <button 
                        onClick={() => setActiveTab("leaderboard")}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}
                      >
                        <i className="fa-solid fa-arrow-left"></i> {t.institution_page.back_to_leaderboard}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metrics 4-Grid */}
                <div className="institution-metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                  <div className="card-surface institution-metric-card" style={{ padding: "1.5rem", textAlign: "center", borderRadius: "14px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>{t.institution_page.stats_pubs}</span>
                    <div className="metric-big-number" style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-text-main)", margin: "0.4rem 0 0.2rem" }}>
                      {profileData.totalPublications.toLocaleString()}
                    </div>
                  </div>

                  <div className="card-surface institution-metric-card" style={{ padding: "1.5rem", textAlign: "center", borderRadius: "14px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>{t.institution_page.stats_cites}</span>
                    <div className="metric-big-number" style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-primary)", margin: "0.4rem 0 0.2rem" }}>
                      {profileData.totalCitations.toLocaleString()}
                    </div>
                  </div>

                  <div className="card-surface institution-metric-card" style={{ padding: "1.5rem", textAlign: "center", borderRadius: "14px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>{t.researcher_page.avg_citations}</span>
                    <div className="metric-big-number" style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-text-main)", margin: "0.4rem 0 0.2rem" }}>
                      {profileData.averageCitations}
                    </div>
                  </div>

                  <div className="card-surface institution-metric-card" style={{ padding: "1.5rem", textAlign: "center", borderRadius: "14px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>{t.institution_page.stats_hindex}</span>
                    <div className="metric-big-number" style={{ fontSize: "2.2rem", fontWeight: "bold", color: "#0284c7", margin: "0.4rem 0 0.2rem" }}>
                      h-{profileData.institutionalHIndex || 1}
                    </div>
                  </div>
                </div>

                {/* Discipline Research Distribution */}
                {profileData.disciplineBreakdown && profileData.disciplineBreakdown.length > 0 && (
                  <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.25rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-chart-pie" style={{ color: "var(--color-primary)" }}></i>
                      {t.institution_page.departments_heading}
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                      {profileData.disciplineBreakdown.map((item: any) => (
                        <div key={item.discipline} style={{ background: "var(--color-bg-base)", padding: "1.25rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                          <div style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                            {item.discipline}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                            <span>{t.top_institutions.publications}: <strong style={{ color: "var(--color-text-main)" }}>{item.publications}</strong></span>
                            <span>{t.top_institutions.citations}: <strong style={{ color: "var(--color-primary)" }}>{item.citations}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affiliated Journals / Publications */}
                {profileData.affiliatedJournals && profileData.affiliatedJournals.length > 0 && (
                  <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.25rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-book-journal-whills" style={{ color: "var(--color-primary)" }}></i>
                      {t.institution_page.affiliated_journals}
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {profileData.affiliatedJournals.map((j: any) => (
                        <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <a href={`/journal/${j.id}`} style={{ color: "var(--color-text-main)", fontWeight: 600, textDecoration: "none", fontSize: "1rem" }}>
                              {j.name}
                            </a>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                              {t.browse_page.score}: <strong style={{ color: "var(--color-primary)" }}>{(j.ajciScore ?? j.ajifScore)?.toFixed(3) || "0.000"}</strong>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <span className="journal-tag">
                              {j.articlesCount} {t.top_institutions.publications}
                            </span>
                            <a href={`/journal/${j.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: "0.8rem" }}>
                              {t.browse_page.view_details}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Affiliated Academic Faculty Roster Section */}
                <div className="card-surface" style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--color-border)", background: "var(--color-bg-card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <i className="fa-solid fa-user-graduate" style={{ color: "var(--color-primary)", fontSize: "1.2rem" }}></i>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)" }}>
                          Affiliated Academic Faculty
                        </h3>
                        <span style={{ background: "rgba(2, 132, 199, 0.1)", color: "var(--color-primary)", padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700 }}>
                          {profileData.totalFacultyIndexed ?? (profileData.facultyLeaderboard?.length || 0)} Verified
                        </span>
                      </div>
                      <p style={{ margin: "0.4rem 0 0", fontSize: "0.86rem", color: "var(--color-text-muted)" }}>
                        Verified professors, principal investigators, and scholars affiliated with {profileData.name}.
                      </p>
                    </div>

                    {/* Faculty Search & Sort Controls */}
                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ position: "relative", minWidth: "200px" }}>
                        <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontSize: "0.8rem" }}></i>
                        <input
                          type="text"
                          value={facultySearch}
                          onChange={e => setFacultySearch(e.target.value)}
                          placeholder="Search faculty..."
                          className="form-control"
                          style={{ height: "36px", paddingLeft: "2rem", fontSize: "0.82rem" }}
                        />
                      </div>

                      <select
                        value={facultySort}
                        onChange={e => setFacultySort(e.target.value as any)}
                        className="form-control"
                        style={{ height: "36px", width: "auto", fontSize: "0.82rem", padding: "0 0.8rem" }}
                      >
                        <option value="citations">Sort by Citations</option>
                        <option value="hIndex">Sort by h-index</option>
                        <option value="articles">Sort by Articles</option>
                      </select>
                    </div>
                  </div>

                  {/* Faculty Table / List */}
                  {(() => {
                    const rawList = profileData.facultyLeaderboard || [];
                    const filteredFaculty = rawList
                      .filter((f: any) => {
                        if (!facultySearch.trim()) return true;
                        const q = facultySearch.toLowerCase();
                        return (
                          f.name.toLowerCase().includes(q) ||
                          (f.discipline && f.discipline.toLowerCase().includes(q)) ||
                          (f.orcid && f.orcid.toLowerCase().includes(q))
                        );
                      })
                      .sort((a: any, b: any) => {
                        if (facultySort === "citations") return b.totalCitations - a.totalCitations;
                        if (facultySort === "hIndex") return b.hIndex - a.hIndex;
                        if (facultySort === "articles") return b.articlesCount - a.articlesCount;
                        return 0;
                      });

                    if (filteredFaculty.length === 0) {
                      return (
                        <div style={{ padding: "2.5rem", textAlign: "center", background: "var(--color-bg-base)", borderRadius: "8px", border: "1px dashed var(--color-border)" }}>
                          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "0.9rem" }}>
                            {facultySearch ? "No faculty members match your search query." : "No faculty members currently indexed for this university."}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="table-responsive" style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                              <th style={{ padding: "0.75rem 0.5rem", width: "45px", textAlign: "center" }}>#</th>
                              <th style={{ padding: "0.75rem 1rem" }}>Scholar & Field</th>
                              <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Citations</th>
                              <th style={{ padding: "0.75rem 1rem", textAlign: "center", width: "90px" }}>h-index</th>
                              <th style={{ padding: "0.75rem 1rem", textAlign: "center", width: "90px" }}>Articles</th>
                              <th style={{ padding: "0.75rem 1rem", textAlign: "right", minWidth: "140px" }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredFaculty.map((f: any, idx: number) => {
                              const initials = f.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();
                              const isFollowed = followedFacultyIds.includes(f.id);

                              return (
                                <tr key={f.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.15s ease" }}>
                                  <td style={{ padding: "0.85rem 0.5rem", textAlign: "center", fontWeight: 700, color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                                    {idx + 1}
                                  </td>

                                  <td style={{ padding: "0.85rem 1rem" }}>
                                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                      <div style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, var(--color-primary), #0369a1)",
                                        color: "#ffffff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 800,
                                        fontSize: "0.82rem",
                                        flexShrink: 0
                                      }}>
                                        {initials}
                                      </div>

                                      <div>
                                        <a 
                                          href={`/researcher?id=${f.id}`}
                                          style={{ color: "var(--color-text-main)", fontWeight: 700, textDecoration: "none", fontSize: "0.92rem", display: "inline-block" }}
                                        >
                                          {f.name}
                                        </a>

                                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "2px", flexWrap: "wrap" }}>
                                          {f.discipline && f.discipline !== "Unspecified" && (
                                            <span style={{ fontSize: "0.72rem", background: "rgba(2, 132, 199, 0.08)", color: "var(--color-primary)", padding: "0.1rem 0.45rem", borderRadius: "4px", fontWeight: 600 }}>
                                              {f.discipline}
                                            </span>
                                          )}

                                          {f.verifiedDomain && (
                                            <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                              <i className="fa-solid fa-circle-check" style={{ fontSize: "0.65rem" }}></i>
                                              {f.verifiedDomain}
                                            </span>
                                          )}

                                          {f.googleScholarUrl && (
                                            <a 
                                              href={f.googleScholarUrl} 
                                              target="_blank" 
                                              rel="noreferrer"
                                              style={{ fontSize: "0.72rem", color: "#0284c7", fontWeight: 600, textDecoration: "none" }}
                                            >
                                              <i className="fa-brands fa-google-scholar"></i> Scholar
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 800, color: "var(--color-primary)" }}>
                                    {f.totalCitations.toLocaleString()}
                                  </td>

                                  <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                                    <span style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      padding: "0.15rem 0.5rem",
                                      borderRadius: "6px",
                                      fontSize: "0.78rem",
                                      fontWeight: 800,
                                      background: f.hIndex >= 20 ? "rgba(22, 163, 74, 0.1)" : "rgba(2, 132, 199, 0.08)",
                                      color: f.hIndex >= 20 ? "#16a34a" : "var(--color-primary)"
                                    }}>
                                      h-{f.hIndex}
                                    </span>
                                  </td>

                                  <td style={{ padding: "0.85rem 1rem", textAlign: "center", fontWeight: 600, color: "var(--color-text-main)" }}>
                                    {f.articlesCount}
                                  </td>

                                  <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                                    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", alignItems: "center" }}>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleFollowFaculty(f.id, f.name)}
                                        className={isFollowed ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem" }}
                                      >
                                        <i className={isFollowed ? "fa-solid fa-check" : "fa-solid fa-user-plus"} style={{ marginRight: "3px" }}></i>
                                        {isFollowed ? "Following" : "Follow"}
                                      </button>

                                      <a
                                        href={`/researcher?id=${f.id}`}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: "0.25rem 0.55rem", fontSize: "0.75rem" }}
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
                    );
                  })()}
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function InstitutionPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <InstitutionContent />
    </Suspense>
  );
}
