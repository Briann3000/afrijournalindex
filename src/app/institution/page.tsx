"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

  // Profile states
  const [currentUnivName, setCurrentUnivName] = useState<string>(nameParam || "University of Nairobi");
  const [searchQuery, setSearchQuery] = useState<string>(nameParam || "");
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

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
          if (result.countries && countries.length === 0) {
            setCountries(result.countries);
          }
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoadingLeaderboard(false);
      }
    }

    fetchLeaderboard();
  }, [selectedCountry, selectedDiscipline, sortBy, tableSearch]);

  // Fetch Single Profile
  useEffect(() => {
    if (!currentUnivName) return;

    async function fetchProfile() {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const res = await fetch(`/api/institutions/metrics?name=${encodeURIComponent(currentUnivName)}&detail=true`);
        const result = await res.json();
        if (result.success && result.institution) {
          setProfileData(result.institution);
        } else {
          setProfileError(result.error || "Failed to load institutional profile.");
        }
      } catch (err) {
        console.error(err);
        setProfileError("Error connecting to metrics services.");
      } finally {
        setLoadingProfile(false);
      }
    }

    if (activeTab === "profile") {
      fetchProfile();
    }
  }, [currentUnivName, activeTab]);

  // Handle drill down to a university
  const handleSelectUniversity = (univName: string) => {
    setCurrentUnivName(univName);
    setSearchQuery(univName);
    setActiveTab("profile");
    router.push(`/institution?name=${encodeURIComponent(univName)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSelectUniversity(searchQuery.trim());
    }
  };

  return (
    <div className="theme-dark">
      <Header />

      <main className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "1100px" }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
          <span className="journal-tag" style={{ background: "rgba(212,160,74,0.15)", color: "var(--color-primary)", marginBottom: "0.8rem", display: "inline-block", fontWeight: 600 }}>
            <i className="fa-solid fa-ranking-star" style={{ marginRight: "0.4rem" }}></i>
            African Academic Authority
          </span>
          <h1 style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0.2rem 0 0.6rem", color: "#f8f9fa", letterSpacing: "-0.5px" }}>
            African University Research League Table
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", maxWidth: "750px", margin: "0 auto", lineHeight: "1.6" }}>
            Continental benchmarking portal measuring aggregated scholarly output, CrossRef citation impact, and institutional <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>$h$-index</span> across African universities.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.35rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.4rem" }}>
            <button
              onClick={() => {
                setActiveTab("leaderboard");
                router.push("/institution");
              }}
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "leaderboard" ? "var(--color-primary)" : "transparent",
                color: activeTab === "leaderboard" ? "#0f172a" : "#e2e2e9",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s"
              }}
            >
              <i className="fa-solid fa-list-ol"></i>
              Continental Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "profile" ? "var(--color-primary)" : "transparent",
                color: activeTab === "profile" ? "#0f172a" : "#e2e2e9",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.2s"
              }}
            >
              <i className="fa-solid fa-building-columns"></i>
              University Profile Console
            </button>
          </div>
        </div>

        {/* TAB 1: CONTINENTAL LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Filter Bar */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "center" }}>
                
                {/* Search query */}
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    placeholder="Search university or country..."
                    style={{
                      width: "100%",
                      padding: "0.7rem 1rem 0.7rem 2.4rem",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "var(--border-radius-sm)",
                      color: "#f8f9fa",
                      outline: "none",
                      fontSize: "0.9rem"
                    }}
                  />
                  <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "0.9rem", top: "0.95rem", color: "var(--color-text-muted)", fontSize: "0.85rem" }}></i>
                </div>

                {/* Country Filter */}
                <div>
                  <select
                    value={selectedCountry}
                    onChange={e => setSelectedCountry(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 1rem",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "var(--border-radius-sm)",
                      color: "#f8f9fa",
                      outline: "none",
                      fontSize: "0.9rem"
                    }}
                  >
                    <option value="All">All African Nations</option>
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
                    style={{
                      width: "100%",
                      padding: "0.7rem 1rem",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "var(--border-radius-sm)",
                      color: "#f8f9fa",
                      outline: "none",
                      fontSize: "0.9rem"
                    }}
                  >
                    {disciplinesList.map(d => (
                      <option key={d} value={d}>{d === "All" ? "All Disciplines" : d}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 1rem",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "var(--border-radius-sm)",
                      color: "var(--color-primary)",
                      fontWeight: 600,
                      outline: "none",
                      fontSize: "0.9rem"
                    }}
                  >
                    <option value="rank">Sort: Overall Rank</option>
                    <option value="hIndex">Sort: Institutional h-Index</option>
                    <option value="citations">Sort: Total Citations</option>
                    <option value="publications">Sort: Indexed Output</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
              {loadingLeaderboard ? (
                <div style={{ padding: "4rem", textAlign: "center" }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
                  <p style={{ color: "var(--color-text-muted)" }}>Calculating continental university rankings...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: "2.5rem", marginBottom: "1rem" }}></i>
                  <p>No African institutions match the selected filter criteria.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "1.2rem 1.5rem", width: "80px", textAlign: "center" }}>Rank</th>
                        <th style={{ padding: "1.2rem 1.5rem" }}>Institution & Country</th>
                        <th style={{ padding: "1.2rem 1rem", textAlign: "center" }}>Primary Focus</th>
                        <th style={{ padding: "1.2rem 1rem", textAlign: "right" }}>Publications</th>
                        <th style={{ padding: "1.2rem 1rem", textAlign: "right" }}>Citations</th>
                        <th style={{ padding: "1.2rem 1.5rem", textAlign: "center" }}>Inst. h-Index</th>
                        <th style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((item) => {
                        const isTop3 = item.rank <= 3;
                        const rankBadgeBg = item.rank === 1 ? "rgba(212,160,74,0.25)" : item.rank === 2 ? "rgba(148,163,184,0.25)" : item.rank === 3 ? "rgba(217,119,6,0.2)" : "rgba(255,255,255,0.04)";
                        const rankBadgeColor = item.rank === 1 ? "#d4a04a" : item.rank === 2 ? "#cbd5e1" : item.rank === 3 ? "#f59e0b" : "#94a3b8";

                        return (
                          <tr 
                            key={item.name}
                            style={{ 
                              borderBottom: "1px solid rgba(255,255,255,0.04)",
                              transition: "background 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <td style={{ padding: "1.2rem 1.5rem", textAlign: "center" }}>
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

                            <td style={{ padding: "1.2rem 1.5rem" }}>
                              <div style={{ fontWeight: 700, color: "#f8f9fa", fontSize: "1rem" }}>
                                {item.name}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                <i className="fa-solid fa-location-dot" style={{ color: "var(--color-primary)", fontSize: "0.75rem" }}></i>
                                <span>{item.country}</span>
                                {item.affiliatedJournalsCount > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{item.affiliatedJournalsCount} Hosted Journals</span>
                                  </>
                                )}
                              </div>
                            </td>

                            <td style={{ padding: "1.2rem 1rem", textAlign: "center" }}>
                              <span className="journal-tag" style={{ background: "rgba(255,255,255,0.04)", color: "#cbd5e1", fontSize: "0.75rem" }}>
                                {item.topDiscipline}
                              </span>
                            </td>

                            <td style={{ padding: "1.2rem 1rem", textAlign: "right", fontWeight: 600, color: "#e2e2e9" }}>
                              {item.totalPublications.toLocaleString()}
                            </td>

                            <td style={{ padding: "1.2rem 1rem", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                              {item.totalCitations.toLocaleString()}
                            </td>

                            <td style={{ padding: "1.2rem 1.5rem", textAlign: "center" }}>
                              <span style={{ 
                                padding: "0.25rem 0.6rem", 
                                borderRadius: "12px", 
                                background: "rgba(56,189,248,0.15)", 
                                color: "#38bdf8", 
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                border: "1px solid rgba(56,189,248,0.3)"
                              }}>
                                {item.institutionalHIndex}
                              </span>
                            </td>

                            <td style={{ padding: "1.2rem 1.5rem", textAlign: "right" }}>
                              <button
                                onClick={() => handleSelectUniversity(item.name)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}
                              >
                                View Drill-Down <i className="fa-solid fa-chevron-right" style={{ marginLeft: "0.3rem", fontSize: "0.7rem" }}></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: UNIVERSITY PROFILE DRILL-DOWN CONSOLE */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Search & Selector Card */}
            <div className="glass-card" style={{ padding: "2rem" }}>
              <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search African University (e.g. Makerere University, University of Nairobi...)"
                    style={{
                      width: "100%",
                      padding: "0.8rem 1rem 0.8rem 2.6rem",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "var(--border-radius-sm)",
                      color: "#f8f9fa",
                      outline: "none",
                      fontSize: "0.95rem"
                    }}
                  />
                  <i className="fa-solid fa-building-columns" style={{ position: "absolute", left: "1rem", top: "1.1rem", color: "var(--color-primary)" }}></i>
                </div>
                <button type="submit" className="btn btn-primary" style={{ height: "45px", padding: "0 1.5rem" }}>
                  Analyze Institution
                </button>
              </form>

              {/* Quick links */}
              <div style={{ marginTop: "1.2rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Quick Select:</span>
                {featuredUniversities.map(univ => (
                  <button
                    key={univ}
                    onClick={() => handleSelectUniversity(univ)}
                    style={{
                      background: currentUnivName === univ ? "rgba(212,160,74,0.2)" : "rgba(255,255,255,0.03)",
                      border: currentUnivName === univ ? "1px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.08)",
                      color: currentUnivName === univ ? "var(--color-primary)" : "#e2e2e9",
                      padding: "0.25rem 0.7rem",
                      borderRadius: "15px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: currentUnivName === univ ? 700 : 400
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
                <p style={{ color: "var(--color-text-muted)" }}>Compiling institutional research rankings and citation impact...</p>
              </div>
            ) : profileError || !profileData ? (
              <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
                <i className="fa-solid fa-building-columns" style={{ fontSize: "3rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
                <h2>Institution Metrics Not Found</h2>
                <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 1.5rem" }}>{profileError || "No indexed records found for this university."}</p>
                <button onClick={() => setActiveTab("leaderboard")} className="btn btn-secondary">
                  Return to Leaderboard
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* Institution Header Banner */}
                <div className="glass-card" style={{ padding: "2.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <span className="journal-tag" style={{ background: "rgba(212,160,74,0.15)", color: "var(--color-primary)", marginBottom: "0.8rem", display: "inline-block", fontWeight: 600 }}>
                        <i className="fa-solid fa-graduation-cap" style={{ marginRight: "0.4rem" }}></i>
                        Institutional Research Benchmark Console
                      </span>
                      <h1 style={{ fontSize: "2.2rem", margin: "0.2rem 0 0.5rem", color: "#f8f9fa", fontWeight: 800 }}>{profileData.name}</h1>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                        <i className="fa-solid fa-location-dot" style={{ color: "var(--color-primary)" }}></i>
                        <span>{profileData.country || "African Academic Institution"}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab("leaderboard")}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      <i className="fa-solid fa-arrow-left"></i> Back to Leaderboard
                    </button>
                  </div>
                </div>

                {/* Metrics 4-Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                  <div className="glass-card" style={{ padding: "1.8rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Indexed Publications</span>
                    <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#fff", margin: "0.5rem 0 0.2rem" }}>
                      {profileData.totalPublications.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Affiliated Faculty Papers</span>
                  </div>

                  <div className="glass-card" style={{ padding: "1.8rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Citations</span>
                    <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "var(--color-primary)", margin: "0.5rem 0 0.2rem" }}>
                      {profileData.totalCitations.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Verified CrossRef References</span>
                  </div>

                  <div className="glass-card" style={{ padding: "1.8rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg. Citations / Paper</span>
                    <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#e2e2e9", margin: "0.5rem 0 0.2rem" }}>
                      {profileData.averageCitations}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Citation Velocity Index</span>
                  </div>

                  <div className="glass-card" style={{ padding: "1.8rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Institutional h-Index</span>
                    <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#38bdf8", margin: "0.5rem 0 0.2rem" }}>
                      {profileData.institutionalHIndex || 1}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>High-Impact Threshold</span>
                  </div>
                </div>

                {/* Discipline Research Distribution */}
                {profileData.disciplineBreakdown && profileData.disciplineBreakdown.length > 0 && (
                  <div className="glass-card" style={{ padding: "2.5rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.5rem", color: "#f8f9fa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-chart-pie" style={{ color: "var(--color-primary)" }}></i>
                      Discipline Research Output Distribution
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                      {profileData.disciplineBreakdown.map((item: any) => (
                        <div key={item.discipline} style={{ background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ fontWeight: 600, color: "#f8f9fa", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                            {item.discipline}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                            <span>Publications: <strong style={{ color: "#e2e2e9" }}>{item.publications}</strong></span>
                            <span>Citations: <strong style={{ color: "var(--color-primary)" }}>{item.citations}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affiliated Journals / Publications */}
                {profileData.affiliatedJournals && profileData.affiliatedJournals.length > 0 && (
                  <div className="glass-card" style={{ padding: "2.5rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.5rem", color: "#f8f9fa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-book-journal-whills" style={{ color: "var(--color-primary)" }}></i>
                      Primary Affiliated & Published Journals
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {profileData.affiliatedJournals.map((j: any) => (
                        <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--border-radius-sm)", border: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <a href={`/journal/${j.id}`} style={{ color: "#f8f9fa", fontWeight: 600, textDecoration: "none", fontSize: "1rem" }}>
                              {j.name}
                            </a>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                              AJIF Score: <strong style={{ color: "var(--color-primary)" }}>{j.ajifScore?.toFixed(3) || "0.000"}</strong>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <span className="journal-tag" style={{ background: "rgba(255,255,255,0.05)" }}>
                              {j.articlesCount} Publications
                            </span>
                            <a href={`/journal/${j.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: "0.8rem" }}>
                              View Journal
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
    <Suspense fallback={<div className="theme-dark" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <InstitutionContent />
    </Suspense>
  );
}
