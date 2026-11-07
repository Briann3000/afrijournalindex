import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../Header";
import Footer from "../../Footer";
import { TOP_DISCIPLINE_SLUGS } from "../../data/seo-slugs";
import { prisma } from "../../../lib/db";

export default async function DisciplineRankingsPage({
  params,
}: {
  params: Promise<{ discipline: string }>;
}) {
  const { discipline: disciplineSlug } = await params;
  const disciplineName = TOP_DISCIPLINE_SLUGS[disciplineSlug];

  if (!disciplineName) {
    notFound();
  }

  // Keywords to match journals in this discipline
  const keyword = disciplineSlug.split("-")[0];

  const journals = await prisma.journal.findMany({
    where: {
      isIndexed: true,
      OR: [
        { name: { contains: keyword } },
        { description: { contains: keyword } }
      ]
    },
    take: 50,
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      name: true,
      issn: true,
      eissn: true,
      country: true,
      publisherName: true,
      qualityGrade: true,
      reports: {
        orderBy: { year: "desc" },
        take: 1,
        select: {
          standardScore: true,
          quartile: true,
          articleCount: true,
          citationCount: true,
          disciplineRank: true,
          primaryDiscipline: true
        }
      }
    }
  });

  // Sort journals by standardScore descending
  const sortedJournals = [...journals].sort((a, b) => {
    const scoreA = a.reports[0]?.standardScore || 0;
    const scoreB = b.reports[0]?.standardScore || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="page-wrapper" style={{ background: "var(--color-bg-base)", minHeight: "100vh" }}>
      <Header activePage="rankings" />

      <main className="container" style={{ padding: "3rem 1rem 5rem", maxWidth: "1150px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "1.5rem", fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
          <Link href="/" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 0.5rem" }}>/</span>
          <Link href="/rankings" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Rankings</Link>
          <span style={{ margin: "0 0.5rem" }}>/</span>
          <strong style={{ color: "var(--color-text-main)" }}>{disciplineName}</strong>
        </div>

        {/* Hero Header */}
        <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
              <i className="fa-solid fa-trophy"></i>
            </div>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
                African Journal Rankings: {disciplineName}
              </h1>
              <p style={{ margin: "0.35rem 0 0", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                Continental Subject Leaderboard • Subject Quartiles (Q1–Q4) • 2-Year AJCI Citation Impact
              </p>
            </div>
          </div>
          <p style={{ color: "var(--color-text-body)", fontSize: "0.95rem", lineHeight: 1.6, marginTop: "1rem" }}>
            The official continental ranking index for African peer-reviewed journals in {disciplineName}. Rankings are determined by verified citations in peer-reviewed African and international literature over a 2-year window.
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="glass-card" style={{ overflow: "hidden", borderRadius: "14px", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-alt)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 700 }}>
                  <th style={{ padding: "1rem 1.2rem", width: "70px" }}>Rank</th>
                  <th style={{ padding: "1rem 1.2rem" }}>Journal & Country</th>
                  <th style={{ padding: "1rem 1.2rem", textAlign: "right" }}>AJCI Score</th>
                  <th style={{ padding: "1rem 1.2rem", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedJournals.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                      No indexed journals currently categorized under {disciplineName}.
                    </td>
                  </tr>
                ) : (
                  sortedJournals.map((j, index) => {
                    const report = j.reports[0];
                    const score = report && report.standardScore > 0 ? report.standardScore.toFixed(3) : "—";

                    return (
                      <tr
                        key={j.id}
                        style={{ borderBottom: "1px solid var(--color-border)" }}
                        className="hover-row"
                      >
                        <td style={{ padding: "1rem 1.2rem", fontWeight: 800, color: index < 3 ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                          #{index + 1}
                        </td>
                        <td style={{ padding: "1rem 1.2rem" }}>
                          <Link href={`/journal/${j.id}`} style={{ textDecoration: "none", color: "var(--color-text-main)", fontWeight: 700 }} className="hover-primary">
                            {j.name}
                          </Link>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                            {j.country} • {j.publisherName}
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1.2rem", textAlign: "right", fontWeight: 800, color: "var(--color-primary)", fontSize: "1.05rem" }}>
                          {score}
                        </td>
                        <td style={{ padding: "1rem 1.2rem", textAlign: "center" }}>
                          <Link href={`/journal/${j.id}`} className="btn btn-outline-primary btn-sm" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
                            Profile
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
