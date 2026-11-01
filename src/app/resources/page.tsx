"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

interface ResourceGuide {
  id: string;
  category: string;
  categoryName: string;
  title: string;
  desc: string;
  href: string;
}

const BASE_GUIDES: ResourceGuide[] = [
  {
    id: "ethics",
    category: "ethics",
    categoryName: "Publication Ethics",
    title: "Publication Ethics & Malpractice Statement (PEMS)",
    desc: "Full COPE-compliant ethical governance protocol detailing mandatory responsibilities of Editors, Reviewers, Authors, and strict sanctions against academic malpractice.",
    href: "/resources/ethics"
  },
  {
    id: "predatory",
    category: "predatory",
    categoryName: "Predatory Journals",
    title: "Identifying & Avoiding Predatory Journals in Africa",
    desc: "Operational criteria for African scholars and university librarians to detect deceptive publishers, counterfeit impact factors, hijacked domains, and official manuscript withdrawal procedures.",
    href: "/resources/predatory-journals"
  },
  {
    id: "open_access",
    category: "open_access",
    categoryName: "Open Access",
    title: "Diamond Open Access & APC Waivers in African Research",
    desc: "Diamond and Green Open Access models for African universities, claiming 100% APC fee waivers, institutional repository archiving, and retaining intellectual property with Creative Commons licenses.",
    href: "/resources/open-access"
  },
  {
    id: "metrics",
    category: "metrics",
    categoryName: "AJCI Metrics",
    title: "AJCI Evaluation & Citation Metrics Guide",
    desc: "The mathematical and editorial framework powering the African Journal Citation Index, including worked formulas for the 2-Year Standard AJCI, 3-Year Citation Average (3-YCA), and Subject Quartiles (Q1–Q4).",
    href: "/resources/ajci-guide"
  },
  {
    id: "peer_review",
    category: "peer_review",
    categoryName: "Peer Review",
    title: "Peer Review Standards & Reviewer Guidelines",
    desc: "Comprehensive standards for rigorous double-blind peer review, referee assessment frameworks, conflict of interest declarations, report templates, and author revision workflows.",
    href: "/resources/peer-review"
  }
];

export default function ResourcesPage() {
  const { t } = useLang();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedPems, setCopiedPems] = useState<boolean>(false);
  const [allGuides, setAllGuides] = useState<ResourceGuide[]>(BASE_GUIDES);

  useEffect(() => {
    async function loadDynamicResources() {
      try {
        const res = await fetch("/api/resources");
        const json = await res.json();
        if (json.success && Array.isArray(json.resources)) {
          if (json.resources.length > 0) {
            const dbGuides: ResourceGuide[] = json.resources.map((r: any) => ({
              id: r.id,
              category: (r.category || "General").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
              categoryName: r.category || "General",
              title: r.title,
              desc: r.summary || (r.content ? r.content.slice(0, 160) + "..." : "Scholarly guide."),
              href: `/resources/${r.slug}`
            }));
            setAllGuides(dbGuides);
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic resources:", err);
      }
    }
    loadDynamicResources();
  }, []);

  // Compute category list dynamically based on all active guides
  const categoryMap = new Map<string, { id: string; name: string; count: number }>();
  allGuides.forEach(g => {
    const existing = categoryMap.get(g.category);
    if (existing) {
      existing.count += 1;
    } else {
      categoryMap.set(g.category, { id: g.category, name: g.categoryName, count: 1 });
    }
  });

  const categories = [
    { id: "all", name: "All Resources", count: allGuides.length },
    ...Array.from(categoryMap.values())
  ];

  const filteredGuides = selectedCategory === "all" 
    ? allGuides 
    : allGuides.filter(g => g.category === selectedCategory);

  const samplePemsQuickCopy = `PUBLICATION ETHICS AND MALPRACTICE STATEMENT
Adhering to Committee on Publication Ethics (COPE) guidelines.
1. Editors' Responsibilities: Fair evaluation, publication decisions, confidentiality, corrections.
2. Reviewers' Responsibilities: Objective contribution, timeliness, conflict disclosure.
3. Authors' Responsibilities: Originality, data access, authorship criteria, no duplicate submission.
4. Penalties: Immediate review termination, formal notification to author's institution head, and 5-year journal blacklist.`;

  const copyPems = () => {
    navigator.clipboard.writeText(samplePemsQuickCopy);
    setCopiedPems(true);
    setTimeout(() => setCopiedPems(false), 2500);
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header activePage="resources" />

      <main className="container reading-container" style={{ padding: "3rem clamp(1rem, 2vw, 1.5rem) 5rem", maxWidth: "1160px" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>{t?.nav?.home || "Home"}</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>{t?.nav?.resources || "Resources"}</span>
        </div>

        {/* Page Header */}
        <header style={{ marginBottom: "2.5rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.3rem)", fontWeight: 800, margin: "0 0 0.5rem", color: "var(--color-navy)", letterSpacing: "-0.01em" }}>
            Academic Publishing &amp; Indexing Knowledge Hub
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--color-text-muted)", margin: 0, maxWidth: "780px", lineHeight: 1.6 }}>
            Authoritative guidelines, evaluation frameworks, and ethical governance standards for African scholarly journals, editorial boards, and researchers.
          </p>
        </header>

        {/* Content Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr min(300px, 30%)", gap: "2.5rem", alignItems: "start" }}>
          
          {/* LEFT COLUMN: GUIDES DIRECTORY */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {filteredGuides.map((g) => (
              <div
                key={g.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: "14px",
                  padding: "1.5rem",
                  boxShadow: "0 4px 15px -3px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)", letterSpacing: "0.04em" }}>
                    {g.categoryName}
                  </span>
                </div>

                <Link href={g.href} style={{ textDecoration: "none" }}>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-navy)", margin: 0, lineHeight: 1.35 }} className="hover-text-primary">
                    {g.title}
                  </h2>
                </Link>

                <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.65, margin: 0 }}>
                  {g.desc}
                </p>

                <div style={{ paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Link
                    href={g.href}
                    style={{
                      color: "var(--color-primary)",
                      fontWeight: 700,
                      fontSize: "0.86rem",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    Read Guide →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT COLUMN: SLIM CATEGORIES & QUICK ACTIONS */}
          <aside style={{ position: "sticky", top: "85px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            {/* Slim Categories Navigation */}
            <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--color-navy)", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                Categories
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.45rem 0.6rem",
                      borderRadius: "6px",
                      border: "none",
                      background: selectedCategory === c.id ? "#f1f5f9" : "transparent",
                      color: selectedCategory === c.id ? "var(--color-navy)" : "#475569",
                      fontWeight: selectedCategory === c.id ? 700 : 500,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <span>{c.name}</span>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      {c.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model PEMS Quick Copy */}
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.35rem" }}>
                Model PEMS Statement
              </div>
              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.85rem", lineHeight: 1.5 }}>
                Standard COPE-aligned publication ethics boilerplate ready to incorporate into journal editorial policies.
              </p>

              <button
                type="button"
                onClick={copyPems}
                className="btn btn-secondary"
                style={{
                  width: "100%",
                  fontSize: "0.78rem",
                  padding: "0.45rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  borderRadius: "6px"
                }}
              >
                <i className={`fa-solid ${copiedPems ? "fa-check" : "fa-copy"}`}></i>
                {copiedPems ? "Copied to Clipboard!" : "Copy Statement"}
              </button>
            </div>

            {/* Submit Inquiries Card */}
            <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.35rem" }}>
                Need Custom Advisory?
              </div>
              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.85rem", lineHeight: 1.5 }}>
                Our indexing editorial team assists African university presses with OJS migration, indexing gap audits, and COPE compliance.
              </p>
              <Link
                href="/services"
                className="btn btn-primary"
                style={{
                  display: "block",
                  textAlign: "center",
                  fontSize: "0.78rem",
                  padding: "0.45rem",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: 700
                }}
              >
                Explore Services →
              </Link>
            </div>

          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
