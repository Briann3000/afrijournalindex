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
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      <main className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "1100px" }}>
        
        {/* Page Header */}
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-ranking-star"></i>
            African Academic Authority
          </span>
          <h1 className="page-title">
            African University Research League Table
          </h1>
          <p className="page-subtitle" style={{ maxWidth: "750px", margin: "0.5rem auto 0" }}>
            Continental benchmarking portal measuring aggregated scholarly output, CrossRef citation impact, and institutional $h$-index across African universities.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div style={{ background: "#ffffff", padding: "0.35rem", borderRadius: "10px", border: "1px solid var(--color-border)", display: "flex", gap: "0.4rem", boxShadow: "var(--card-shadow)" }}>
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
                color: activeTab === "leaderboard" ? "#ffffff" : "var(--color-text-muted)",
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
                color: activeTab === "profile" ? "#ffffff" : "var(--color-text-muted)",
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
            <div className="card-surface" style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "center" }}>
                
                {/* Search query */}
                <div style={{ position: "relative" }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontSize: "0.85rem" }}></i>
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={e => setTableSearch(e.target.value)}
                    placeholder="Search university or country..."
                    className="form-control"
                    style={{ paddingLeft: "2.4rem" }}
                  />
                </div>

                {/* Country Filter */}
                <div>
                  <select
                    value={selectedCountry}
                    onChange={e => setSelectedCountry(e.target.value)}
                    className="form-select"
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
                    className="form-select"
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
                    className="form-select"
                    style={{ fontWeight: 600, color: "var(--color-primary)" }}
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
            <div className="table-wrapper">
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
                <table className="academic-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px", textAlign: "center" }}>Rank</th>
                      <th>Institution &amp; Country</th>
                      <th style={{ textAlign: "center" }}>Primary Focus</th>
                      <th style={{ textAlign: "right" }}>Publications</th>
                      <th style={{ textAlign: "right" }}>Citations</th>
                      <th style={{ textAlign: "center", width: "120px" }}>Inst. h-Index</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item) => {
                      const isTop3 = item.rank <= 3;
                      const rankBadgeBg = item.rank === 1 ? "#eff6ff" : item.rank === 2 ? "#f1f5f9" : item.rank === 3 ? "#fef3c7" : "var(--color-bg-card-subtle)";
                      const rankBadgeColor = item.rank === 1 ? "var(--color-primary)" : item.rank === 2 ? "#475569" : item.rank === 3 ? "#b45309" : "var(--color-text-muted)";

                      return (
                        <tr key={item.name}>
                          <td style={{ textAlign: "center" }}>
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

                          <td>
                            <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.98rem" }}>
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

                          <td style={{ textAlign: "center" }}>
                            <span className="journal-tag" style={{ fontSize: "0.75rem" }}>
                              {item.topDiscipline}
                            </span>
                          </td>

                          <td style={{ textAlign: "right", fontWeight: 600, color: "var(--color-text-main)" }}>
                            {item.totalPublications.toLocaleString()}
                          </td>

                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                            {item.totalCitations.toLocaleString()}
                          </td>

                          <td style={{ textAlign: "center" }}>
                            <span className="badge badge-blue">
                              {item.institutionalHIndex}
                            </span>
                          </td>

                          <td style={{ textAlign: "right" }}>
                            <button
                              onClick={() => handleSelectUniversity(item.name)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                            >
                              Drill-Down <i className="fa-solid fa-chevron-right" style={{ marginLeft: "0.25rem", fontSize: "0.7rem" }}></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: UNIVERSITY PROFILE DRILL-DOWN CONSOLE */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Search & Selector Card */}
            <div className="card-surface" style={{ padding: "1.75rem" }}>
              <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
                  <i className="fa-solid fa-building-columns" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-primary)" }}></i>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search African University (e.g. Makerere University, University of Nairobi...)"
                    className="form-control"
                    style={{ paddingLeft: "2.6rem" }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
                  Analyze Institution
                </button>
              </form>

              {/* Quick links */}
              <div style={{ marginTop: "1.2rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>Quick Select:</span>
                {featuredUniversities.map(univ => (
                  <button
                    key={univ}
                    onClick={() => handleSelectUniversity(univ)}
                    style={{
                      background: currentUnivName === univ ? "var(--badge-bg)" : "#ffffff",
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
                <p style={{ color: "var(--color-text-muted)" }}>Compiling institutional research rankings and citation impact...</p>
              </div>
            ) : profileError || !profileData ? (
              <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
                <i className="fa-solid fa-building-columns" style={{ fontSize: "3rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
                <h2 style={{ color: "var(--color-text-main)" }}>Institution Metrics Not Found</h2>
                <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 1.5rem" }}>{profileError || "No indexed records found for this university."}</p>
                <button onClick={() => setActiveTab("leaderboard")} className="btn btn-secondary">
                  Return to Leaderboard
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* Institution Header Banner */}
                <div className="card-surface" style={{ padding: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
                        <i className="fa-solid fa-graduation-cap"></i>
                        Institutional Research Benchmark Console
                      </span>
                      <h1 style={{ fontSize: "2rem", margin: "0.2rem 0 0.5rem", color: "var(--color-text-main)", fontWeight: 800 }}>{profileData.name}</h1>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                        <i className="fa-solid fa-location-dot" style={{ color: "var(--color-primary)" }}></i>
                        <span>{profileData.country || "African Academic Institution"}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab("leaderboard")}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      <i className="fa-solid fa-arrow-left"></i> Back to Leaderboard
                    </button>
                  </div>
                </div>

                {/* Metrics 4-Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                  <div className="card-surface" style={{ padding: "1.5rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Indexed Publications</span>
                    <div style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-text-main)", margin: "0.4rem 0 0.2rem" }}>
                      {profileData.totalPublications.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Affiliated Faculty Papers</span>
                  </div>

                  <div className="card-surface" style={{ padding: "1.5rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Total Citations</span>
                    <div style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-primary)", margin: "0.4rem 0 0.2rem" }}>
                      {profileData.totalCitations.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Verified CrossRef References</span>
                  </div>

                  <div className="card-surface" style={{ padding: "1.5rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Avg. Citations / Paper</span>
                    <div style={{ fontSize: "2.2rem", fontWeight: "bold", color: "var(--color-text-main)", margin: "0.4rem 0 0.2rem" }}>
                      {profileData.averageCitations}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Citation Velocity Index</span>
                  </div>

                  <div className="card-surface" style={{ padding: "1.5rem", textAlign: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Institutional h-Index</span>
                    <div style={{ fontSize: "2.2rem", fontWeight: "bold", color: "#0284c7", margin: "0.4rem 0 0.2rem" }}>
                      {profileData.institutionalHIndex || 1}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>High-Impact Threshold</span>
                  </div>
                </div>

                {/* Discipline Research Distribution */}
                {profileData.disciplineBreakdown && profileData.disciplineBreakdown.length > 0 && (
                  <div className="card-surface" style={{ padding: "2rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.25rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-chart-pie" style={{ color: "var(--color-primary)" }}></i>
                      Discipline Research Output Distribution
                    </h3>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                      {profileData.disciplineBreakdown.map((item: any) => (
                        <div key={item.discipline} style={{ background: "var(--color-bg-base)", padding: "1.25rem", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)" }}>
                          <div style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                            {item.discipline}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                            <span>Publications: <strong style={{ color: "var(--color-text-main)" }}>{item.publications}</strong></span>
                            <span>Citations: <strong style={{ color: "var(--color-primary)" }}>{item.citations}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affiliated Journals / Publications */}
                {profileData.affiliatedJournals && profileData.affiliatedJournals.length > 0 && (
                  <div className="card-surface" style={{ padding: "2rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.25rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-book-journal-whills" style={{ color: "var(--color-primary)" }}></i>
                      Primary Affiliated &amp; Published Journals
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {profileData.affiliatedJournals.map((j: any) => (
                        <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "var(--color-bg-base)", borderRadius: "var(--border-radius-sm)", border: "1px solid var(--color-border)", flexWrap: "wrap", gap: "1rem" }}>
                          <div>
                            <a href={`/journal/${j.id}`} style={{ color: "var(--color-text-main)", fontWeight: 600, textDecoration: "none", fontSize: "1rem" }}>
                              {j.name}
                            </a>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                              AJIF Score: <strong style={{ color: "var(--color-primary)" }}>{j.ajifScore?.toFixed(3) || "0.000"}</strong>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <span className="journal-tag">
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
    <Suspense fallback={<div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <InstitutionContent />
    </Suspense>
  );
}
