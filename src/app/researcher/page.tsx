"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "../LangContext";
import Header from "../Header";

function ResearcherProfileContent() {
  const { lang, setLang, t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!id) {
      setError("No researcher profile ID provided.");
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/researcher/profile?id=${id}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load researcher profile.");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to database services.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
          <p>Loading researcher dashboard metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div className="glass-card" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem" }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "3rem", color: "var(--color-secondary)", marginBottom: "1.5rem" }}></i>
          <h3>Profile Error</h3>
          <p style={{ margin: "1rem 0", color: "var(--color-text-muted)" }}>{error || "Researcher not found."}</p>
          <a href="/browse" className="btn btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>Back to Catalog</a>
        </div>
      </div>
    );
  }

  const { profile, metrics, articles } = data;

  return (
    <div className="theme-dark">
      {/* Navigation */}
      <Header />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "950px" }}>
        {/* Profile Details Card */}
        <div className="glass-card" style={{ padding: "3rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
            <div>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <span className="journal-tag" style={{ background: "rgba(212,160,74,0.15)", color: "var(--color-primary)" }}>
                  {profile.role}
                </span>
                {profile.orcid && (
                  <a href={`https://orcid.org/${profile.orcid}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem", color: "var(--color-accent-green)" }}>
                    <i className="fa-brands fa-orcid"></i> orcid.org/{profile.orcid}
                  </a>
                )}
              </div>
              <h1 style={{ fontSize: "2.4rem", margin: "0.5rem 0" }}>{profile.name}</h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "1.1rem", margin: "0.5rem 0 0" }}>
                <i className="fa-solid fa-building-columns" style={{ marginRight: "0.5rem" }}></i> {profile.institution || "Independent Researcher"}
              </p>
            </div>

            {/* Metrics Tally Grid */}
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ padding: "1rem 1.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", textAlign: "center", minWidth: "90px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>h-index</span>
                <span style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-primary)" }}>{metrics.hIndex}</span>
              </div>
              <div style={{ padding: "1rem 1.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", textAlign: "center", minWidth: "90px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Citations</span>
                <span style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--color-secondary)" }}>{metrics.totalCitations}</span>
              </div>
              <div style={{ padding: "1rem 1.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", textAlign: "center", minWidth: "90px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Papers</span>
                <span style={{ fontSize: "2rem", fontWeight: "bold" }}>{metrics.publicationsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Publications List Section */}
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.3rem" }}>Authored Publications List</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {articles.length === 0 ? (
            <div className="glass-card" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              No peer-reviewed articles listed in directory index for this researcher.
            </div>
          ) : (
            articles.map((art: any, idx: number) => (
              <div className="glass-card" key={idx} style={{ padding: "2rem", display: "flex", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <span className="journal-tag" style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)", marginBottom: "0.5rem", display: "inline-block" }}>
                    {art.journalName}
                  </span>
                  <h4 style={{ fontSize: "1.15rem", margin: "0.2rem 0 0.5rem", lineHeight: "1.4" }}>{art.title}</h4>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <span><strong>Published:</strong> {new Date(art.publishDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
                    {art.doi && (
                      <a href={`https://doi.org/${art.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
                        DOI: {art.doi}
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "4px", textAlign: "center", minWidth: "90px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Citations</span>
                  <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{art.citationsCount}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResearcherProfile() {
  return (
    <Suspense fallback={<div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading researcher profile...</div>}>
      <ResearcherProfileContent />
    </Suspense>
  );
}
