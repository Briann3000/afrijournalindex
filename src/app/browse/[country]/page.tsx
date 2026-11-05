import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../Header";
import Footer from "../../Footer";
import { findCountryBySlug } from "../../data/seo-slugs";
import { prisma } from "../../../lib/db";

export default async function CountryBrowsePage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;
  const countryMeta = findCountryBySlug(countrySlug);

  if (!countryMeta) {
    notFound();
  }

  const countryName = countryMeta.name;

  // Query indexed journals for this country
  const journals = await prisma.journal.findMany({
    where: {
      isIndexed: true,
      country: {
        contains: countryName
      }
    },
    take: 40,
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
          primaryDiscipline: true
        }
      }
    }
  });

  const totalCount = await prisma.journal.count({
    where: {
      isIndexed: true,
      country: {
        contains: countryName
      }
    }
  });

  return (
    <div className="page-wrapper" style={{ background: "var(--color-bg-base)", minHeight: "100vh" }}>
      <Header activePage="browse" />

      <main className="container" style={{ padding: "3rem 1rem 5rem", maxWidth: "1150px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "1.5rem", fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
          <Link href="/" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 0.5rem" }}>/</span>
          <Link href="/browse" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Browse</Link>
          <span style={{ margin: "0 0.5rem" }}>/</span>
          <strong style={{ color: "var(--color-text-main)" }}>{countryName}</strong>
        </div>

        {/* Hero Header */}
        <div className="glass-card" style={{ padding: "2.5rem", marginBottom: "2rem", borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "2.5rem" }}>{countryMeta.flag}</span>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--color-text-main)" }}>
                Academic Journals in {countryName}
              </h1>
              <p style={{ margin: "0.35rem 0 0", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                Region: <strong>{countryMeta.region} Africa</strong> • Top Discipline: <strong>{countryMeta.topDiscipline}</strong> • {totalCount} Officially Indexed Journals
              </p>
            </div>
          </div>
          <p style={{ color: "var(--color-text-body)", fontSize: "0.95rem", lineHeight: 1.6, marginTop: "1rem" }}>
            Explore verified scholarly publications and peer-reviewed journals published in {countryName}. All journals are evaluated under the 2-Year African Journal Citation Index (AJCI) framework, measuring citation velocity, regional impact, and open-access integrity.
          </p>
        </div>

        {/* Journal Results List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {journals.length === 0 ? (
            <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
              <i className="fa-solid fa-book-open" style={{ fontSize: "2.5rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}></i>
              <h3>No indexed journals currently listed for {countryName}</h3>
              <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                Are you an editor of an academic journal in {countryName}? Submit your journal for evaluation.
              </p>
              <Link href="/submit" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
                Submit a Journal from {countryName}
              </Link>
            </div>
          ) : (
            journals.map((j) => {
              const report = j.reports[0];
              const score = report ? report.standardScore.toFixed(3) : "—";
              const quartile = report?.quartile || "Unrated";
              const issnDisplay = [j.issn, j.eissn].filter(Boolean).join(" • ") || "ISSN Pending";

              return (
                <div
                  key={j.id}
                  className="glass-card hover-lift"
                  style={{
                    padding: "1.5rem 1.8rem",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1.2rem",
                    borderRadius: "12px"
                  }}
                >
                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                      <span className="journal-tag" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 700, fontSize: "0.75rem" }}>
                        <i className="fa-solid fa-circle-check" style={{ marginRight: "3px" }}></i> Verified Indexed
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {issnDisplay}
                      </span>
                    </div>

                    <Link
                      href={`/journal/${j.id}`}
                      style={{ textDecoration: "none", color: "var(--color-text-main)" }}
                    >
                      <h2 style={{ fontSize: "1.18rem", fontWeight: 700, margin: "0 0 0.3rem", lineHeight: 1.4 }} className="hover-primary">
                        {j.name}
                      </h2>
                    </Link>

                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      Publisher: <strong style={{ color: "var(--color-text-body)" }}>{j.publisherName}</strong> • {report?.primaryDiscipline || "Multidisciplinary"}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-primary)" }}>
                        {score}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                        2-Yr AJCI Score
                      </div>
                    </div>

                    <Link
                      href={`/journal/${j.id}`}
                      className="btn btn-outline-primary btn-sm"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      View Profile <i className="fa-solid fa-arrow-right" style={{ marginLeft: "4px" }}></i>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
