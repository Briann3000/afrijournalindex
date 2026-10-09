"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./LangContext";
import africaPaths from "./data/africa-nations-paths.json";
import { COUNTRY_META_MAP, ALL_AFRICAN_COUNTRIES, AfricanCountryMeta } from "./data/african-countries";

interface CountryLiveStats {
  journals: number;
  articles: number;
  topDiscipline: string;
}

export default function AfricaMap() {
  const { t } = useLang();
  const router = useRouter();
  
  // Real database metrics state
  const [liveCountryStats, setLiveCountryStats] = useState<Record<string, CountryLiveStats>>({});
  const [totalLiveJournals, setTotalLiveJournals] = useState<number>(0);
  const [activeCountryMeta, setActiveCountryMeta] = useState<AfricanCountryMeta>(COUNTRY_META_MAP["Kenya"] || ALL_AFRICAN_COUNTRIES[0]);
  const [hoveredCountryMeta, setHoveredCountryMeta] = useState<AfricanCountryMeta | null>(null);

  // Fetch real data from the database
  useEffect(() => {
    async function fetchLiveDistribution() {
      try {
        const res = await fetch("/api/journals/list");
        const data = await res.json();
        if (data.success && Array.isArray(data.journals)) {
          const statsMap: Record<string, { journals: number; articles: number; disciplineCounts: Record<string, number> }> = {};
          let totalCount = 0;

          data.journals.forEach((j: any) => {
            const countryName = (j.country || "Kenya").trim();
            if (!statsMap[countryName]) {
              statsMap[countryName] = { journals: 0, articles: 0, disciplineCounts: {} };
            }
            statsMap[countryName].journals += 1;
            totalCount += 1;

            // Articles approximation or real count
            const articleCount = Array.isArray(j.articles) ? j.articles.length : (j.qualityGrade === "A" ? 45 : 20);
            statsMap[countryName].articles += articleCount;

            // Discipline breakdown
            const desc = `${j.name} ${j.description || ""}`.toLowerCase();
            let disc = "Multidisciplinary";
            if (desc.includes("health") || desc.includes("medic") || desc.includes("biomed")) disc = "Health Sciences";
            else if (desc.includes("education") || desc.includes("teaching")) disc = "Education";
            else if (desc.includes("social") || desc.includes("humanit")) disc = "Social Sciences";
            else if (desc.includes("management") || desc.includes("business")) disc = "Business & Management";
            else if (desc.includes("environment") || desc.includes("agri")) disc = "Agricultural & Environmental";

            statsMap[countryName].disciplineCounts[disc] = (statsMap[countryName].disciplineCounts[disc] || 0) + 1;
          });

          // Final mapped live metrics
          const finalizedStats: Record<string, CountryLiveStats> = {};
          Object.keys(statsMap).forEach((cName) => {
            const item = statsMap[cName];
            const sortedDiscs = Object.entries(item.disciplineCounts).sort((a, b) => b[1] - a[1]);
            const topDiscipline = sortedDiscs.length > 0 ? sortedDiscs[0][0] : "Multidisciplinary";

            finalizedStats[cName] = {
              journals: item.journals,
              articles: item.articles,
              topDiscipline
            };
            finalizedStats[cName.toLowerCase()] = finalizedStats[cName];
          });

          setLiveCountryStats(finalizedStats);
          setTotalLiveJournals(totalCount);
        }
      } catch (err) {
        console.error("Failed to load live map stats:", err);
      }
    }

    fetchLiveDistribution();
  }, []);

  const currentMeta = hoveredCountryMeta || activeCountryMeta;
  const currentLive = liveCountryStats[currentMeta.name] || liveCountryStats[currentMeta.name.toLowerCase()] || {
    journals: 0,
    articles: 0,
    topDiscipline: "Unindexed / Emerging Hub"
  };

  const handleCountryClick = (countryName: string) => {
    router.push(`/browse?country=${encodeURIComponent(countryName)}`);
  };

  // Dynamic Choropleth Fill based on TRUE Database Counts
  const getFillColor = (name: string, isHovered: boolean) => {
    if (isHovered) return "#0284c7"; // Bright interactive blue on hover
    
    const live = liveCountryStats[name] || liveCountryStats[name.toLowerCase()];
    const count = live?.journals || 0;

    if (count > 25) return "#1e3a8a"; // Deep Royal Navy (Major Hubs: Kenya, South Africa, Nigeria)
    if (count > 10) return "#2271b1"; // Medium Brand Blue
    if (count > 3)  return "#60a5fa"; // Light Blue
    if (count > 0)  return "#93c5fd"; // Soft Accent Blue
    return "#e2e8f0"; // Neutral Slate 200 for unindexed nations
  };

  // Calculate real Regional Percentages
  const regionalBreakdown = useMemo(() => {
    const regionCounts: Record<string, number> = {
      East: 0,
      West: 0,
      South: 0,
      North: 0,
      Central: 0
    };

    ALL_AFRICAN_COUNTRIES.forEach((c) => {
      const stats = liveCountryStats[c.name] || liveCountryStats[c.name.toLowerCase()];
      if (stats && stats.journals > 0) {
        regionCounts[c.region] = (regionCounts[c.region] || 0) + stats.journals;
      }
    });

    const total = totalLiveJournals || 1;
    return [
      { region: "East Africa", count: regionCounts.East, percentage: Math.round((regionCounts.East / total) * 100), color: "#2271b1", icon: "fa-compass" },
      { region: "West Africa", count: regionCounts.West, percentage: Math.round((regionCounts.West / total) * 100), color: "#0284c7", icon: "fa-sun" },
      { region: "Southern Africa", count: regionCounts.South, percentage: Math.round((regionCounts.South / total) * 100), color: "#10b981", icon: "fa-mountain-sun" },
      { region: "North Africa", count: regionCounts.North, percentage: Math.round((regionCounts.North / total) * 100), color: "#f59e0b", icon: "fa-landmark" },
      { region: "Central Africa", count: regionCounts.Central, percentage: Math.round((regionCounts.Central / total) * 100), color: "#8b5cf6", icon: "fa-tree" }
    ];
  }, [liveCountryStats, totalLiveJournals]);

  return (
    <div className="africa-map-wrapper" style={{ width: "100%", margin: "0 auto" }}>
      
      {/* Interactive Map Canvas Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", alignItems: "center" }}>
        
        {/* Left Column: True D3 Topology Vector Map */}
        <div style={{ position: "relative", background: "#ffffff", borderRadius: "16px", padding: "1.5rem", border: "1px solid var(--color-border)", boxShadow: "0 4px 20px -4px rgba(15, 23, 42, 0.06)" }}>
          <svg
            viewBox="0 0 520 540"
            style={{ width: "100%", height: "auto", maxHeight: "450px", filter: "drop-shadow(0 8px 16px rgba(15, 23, 42, 0.08))" }}
          >
            <g>
              {africaPaths.map((item) => {
                const isHovered = hoveredCountryMeta?.name === item.name;
                const isSelected = activeCountryMeta?.name === item.name;
                const countryMeta = COUNTRY_META_MAP[item.name] || COUNTRY_META_MAP[item.name.toLowerCase()];
                const liveCount = (liveCountryStats[item.name] || liveCountryStats[item.name.toLowerCase()])?.journals || 0;
                const fillColor = getFillColor(item.name, isHovered);

                return (
                  <path
                    key={item.code}
                    d={item.path}
                    fill={fillColor}
                    stroke={isSelected ? "#0f172a" : "#ffffff"}
                    strokeWidth={isSelected ? "2" : "0.75"}
                    style={{
                      cursor: "pointer",
                      transition: "fill 0.2s ease, stroke 0.2s ease",
                    }}
                    onMouseEnter={() => {
                      if (countryMeta) {
                        setHoveredCountryMeta(countryMeta);
                      } else {
                        setHoveredCountryMeta({
                          code: item.code,
                          name: item.name,
                          region: "Central",
                          flag: "🌍",
                          defaultJournals: 0,
                          defaultArticles: 0,
                          topDiscipline: "Unindexed"
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCountryMeta(null);
                    }}
                    onClick={() => {
                      if (countryMeta) {
                        setActiveCountryMeta(countryMeta);
                        handleCountryClick(countryMeta.name);
                      } else {
                        handleCountryClick(item.name);
                      }
                    }}
                  >
                    <title>{item.name} ({liveCount} {t.stats.journals})</title>
                  </path>
                );
              })}
            </g>
          </svg>

          {/* Map Overlay Prompt */}
          <div style={{ position: "relative", marginTop: "10px", fontSize: "0.82rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
            <i className="fa-solid fa-hand-pointer" style={{ color: "var(--color-primary)" }}></i>
            <span>{t.map_section.hint}</span>
          </div>
        </div>

        {/* Right Column: Dynamic Country Insight Card & Regional Tally */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Active Highlight Card */}
          <div style={{ background: "#ffffff", border: "1px solid var(--color-primary)", borderRadius: "16px", padding: "1.8rem", boxShadow: "0 10px 25px -5px rgba(34, 113, 177, 0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.8rem" }}>{currentMeta.flag}</span>
                <div>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-navy)", margin: 0 }}>
                    {currentMeta.name}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    {currentMeta.region} {t.map_section.active_countries}
                  </span>
                </div>
              </div>

              {currentLive.journals > 0 ? (
                <button
                  onClick={() => handleCountryClick(currentMeta.name)}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: "0.78rem" }}
                >
                  {t.map_section.view_country_journals} <i className="fa-solid fa-arrow-right" style={{ fontSize: "0.7rem", marginLeft: "0.3rem" }}></i>
                </button>
              ) : (
                <a
                  href="/submit"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.78rem" }}
                >
                  {t.nav.submit} <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "0.7rem", marginLeft: "0.3rem" }}></i>
                </a>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 600 }}>{t.map_section.journals_count}</span>
                <span style={{ fontSize: "1.6rem", fontWeight: 900, color: currentLive.journals > 0 ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                  {currentLive.journals}
                </span>
              </div>

              <div style={{ background: "var(--color-bg-card-subtle)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", display: "block", fontWeight: 600 }}>{t.journal_page.citable_articles}</span>
                <span style={{ fontSize: "1.6rem", fontWeight: 900, color: currentLive.articles > 0 ? "var(--color-navy)" : "var(--color-text-muted)" }}>
                  {currentLive.articles.toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              <strong>{t.rankings_page.col_discipline}:</strong>{" "}
              <span style={{ color: currentLive.journals > 0 ? "var(--color-navy)" : "var(--color-text-muted)", fontWeight: 600 }}>
                {currentLive.journals > 0 ? currentLive.topDiscipline : "Emerging Research Hub"}
              </span>
            </div>
          </div>

          {/* Regional Output Distribution Breakdown (Live Data) */}
          <div style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "16px", padding: "1.5rem" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--color-navy)", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <i className="fa-solid fa-chart-pie" style={{ color: "var(--color-primary)" }}></i>
              {t.valprop.regional_title}
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {regionalBreakdown.map((item) => (
                <div key={item.region}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--color-navy)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: "0.75rem" }}></i>
                      {item.region}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      <strong style={{ color: "var(--color-navy)" }}>{item.count}</strong> {t.stats.journals} ({item.percentage}%)
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${item.percentage}%`, background: item.color, height: "100%", borderRadius: "3px" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
