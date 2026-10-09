"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../Header";
import Footer from "../Footer";

function InstitutionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nameParam = searchParams.get("name") || "University of Nairobi";

  const [searchQuery, setSearchQuery] = useState<string>(nameParam);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const featuredUniversities = [
    "University of Nairobi",
    "Makerere University",
    "University of Cape Town",
    "University of Ibadan",
    "Cairo University",
    "Addis Ababa University",
    "University of Ghana"
  ];

  useEffect(() => {
    async function fetchInstitutionMetrics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/institutions/metrics?name=${encodeURIComponent(nameParam)}`);
        const result = await res.json();
        if (result.success && result.institution) {
          setData(result.institution);
        } else {
          setError(result.error || "Failed to load institutional metrics.");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to metrics services.");
      } finally {
        setLoading(false);
      }
    }

    fetchInstitutionMetrics();
  }, [nameParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/institution?name=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectFeatured = (univ: string) => {
    setSearchQuery(univ);
    router.push(`/institution?name=${encodeURIComponent(univ)}`);
  };

  return (
    <div className="theme-dark">
      <Header />

      <main className="container" style={{ padding: "4rem 0 6rem", maxWidth: "1050px" }}>
        
        {/* Search & Selector Card */}
        <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
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
          <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>Quick Select:</span>
            {featuredUniversities.map(univ => (
              <button
                key={univ}
                onClick={() => handleSelectFeatured(univ)}
                style={{
                  background: nameParam === univ ? "rgba(212,160,74,0.2)" : "rgba(255,255,255,0.03)",
                  border: nameParam === univ ? "1px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.08)",
                  color: nameParam === univ ? "var(--color-primary)" : "#e2e2e9",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "15px",
                  cursor: "pointer",
                  fontSize: "0.75rem"
                }}
              >
                {univ}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <p style={{ color: "var(--color-text-muted)" }}>Compiling institutional research rankings and citation impact...</p>
          </div>
        ) : error || !data ? (
          <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
            <i className="fa-solid fa-building-columns" style={{ fontSize: "3rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
            <h2>Institution Metrics Not Found</h2>
            <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 1.5rem" }}>{error || "No indexed records found for this university."}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Institution Header Banner */}
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <span className="journal-tag" style={{ background: "rgba(212,160,74,0.15)", color: "var(--color-primary)", marginBottom: "0.8rem", display: "inline-block", fontWeight: 600 }}>
                <i className="fa-solid fa-graduation-cap" style={{ marginRight: "0.4rem" }}></i>
                Institutional Research Benchmark Console
              </span>
              <h1 style={{ fontSize: "2.2rem", margin: "0.2rem 0 0.5rem", color: "#f8f9fa" }}>{data.name}</h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", margin: 0 }}>
                Aggregated scholarly performance, publication output, and citation velocity across all African peer-reviewed journals in the AJIF registry.
              </p>
            </div>

            {/* Metrics 4-Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
              <div className="glass-card" style={{ padding: "1.8rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Indexed Publications</span>
                <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#fff", margin: "0.5rem 0 0.2rem" }}>
                  {data.totalPublications}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Affiliated Faculty Papers</span>
              </div>

              <div className="glass-card" style={{ padding: "1.8rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Citations</span>
                <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "var(--color-primary)", margin: "0.5rem 0 0.2rem" }}>
                  {data.totalCitations}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Verified CrossRef References</span>
              </div>

              <div className="glass-card" style={{ padding: "1.8rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg. Citations / Paper</span>
                <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#e2e2e9", margin: "0.5rem 0 0.2rem" }}>
                  {data.averageCitations}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Citation Velocity Index</span>
              </div>

              <div className="glass-card" style={{ padding: "1.8rem", textAlign: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Institutional h-Index</span>
                <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "#38bdf8", margin: "0.5rem 0 0.2rem" }}>
                  {data.institutionalHIndex || 1}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>High-Impact Threshold</span>
              </div>
            </div>

            {/* Discipline Research Distribution */}
            {data.disciplineBreakdown && data.disciplineBreakdown.length > 0 && (
              <div className="glass-card" style={{ padding: "2.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.5rem", color: "#f8f9fa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <i className="fa-solid fa-chart-pie" style={{ color: "var(--color-primary)" }}></i>
                  Discipline Research Output Distribution
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  {data.disciplineBreakdown.map((item: any) => (
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
            {data.affiliatedJournals && data.affiliatedJournals.length > 0 && (
              <div className="glass-card" style={{ padding: "2.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1.5rem", color: "#f8f9fa", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <i className="fa-solid fa-book-journal-whills" style={{ color: "var(--color-primary)" }}></i>
                  Primary Affiliated & Published Journals
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {data.affiliatedJournals.map((j: any) => (
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
