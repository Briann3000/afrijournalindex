import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../Header";
import Footer from "../../Footer";
import { prisma } from "../../../lib/db";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      journal: {
        select: {
          id: true,
          name: true,
          issn: true,
          eissn: true,
          publisherName: true,
          country: true,
          qualityGrade: true,
          reports: {
            orderBy: { year: "desc" },
            take: 1,
            select: {
              standardScore: true,
              quartile: true,
            },
          },
        },
      },
      citedBy: {
        take: 10,
        include: {
          citingArticle: {
            select: {
              id: true,
              title: true,
              doi: true,
              publishDate: true,
              journal: {
                select: {
                  name: true,
                  country: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!article) {
    notFound();
  }

  const pubDateStr = new Date(article.publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const report = article.journal.reports[0];
  const issnDisplay = [article.journal.issn, article.journal.eissn].filter(Boolean).join(" • ") || "ISSN Registered";

  return (
    <div className="page-wrapper" style={{ background: "var(--color-bg-base)", minHeight: "100vh" }}>
      <Header />

      <main className="container" style={{ padding: "3rem 1rem 5rem", maxWidth: "980px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          <Link href="/" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 0.5rem" }}>/</span>
          <Link href={`/journal/${article.journal.id}`} style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
            {article.journal.name}
          </Link>
          <span style={{ margin: "0 0.5rem" }}>/</span>
          <strong style={{ color: "var(--color-text-main)" }}>Article Record</strong>
        </div>

        {/* Article Primary Card */}
        <article className="glass-card" style={{ padding: "2.5rem", borderRadius: "16px", marginBottom: "2rem" }}>
          {/* Tag row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center", marginBottom: "1rem" }}>
            <span className="journal-tag" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 700 }}>
              <i className="fa-solid fa-file-lines" style={{ marginRight: "4px" }}></i> Peer-Reviewed Article
            </span>

            {report?.quartile && (
              <span className="journal-tag" style={{ background: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
                {report.quartile} Journal
              </span>
            )}

            <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              <i className="fa-regular fa-calendar" style={{ marginRight: "4px" }}></i> {pubDateStr}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.35, color: "var(--color-text-main)", margin: "0 0 1.25rem" }}>
            {article.title}
          </h1>

          {/* Publishing Venue Metadata */}
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "var(--color-bg-alt)",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              marginBottom: "1.5rem",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}
          >
            <div>
              Published in:{" "}
              <Link
                href={`/journal/${article.journal.id}`}
                style={{ fontWeight: 700, color: "var(--color-primary)", textDecoration: "none" }}
              >
                {article.journal.name}
              </Link>
            </div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              Publisher: <strong style={{ color: "var(--color-text-body)" }}>{article.journal.publisherName}</strong> • {article.journal.country} • {issnDisplay}
            </div>
            {article.doi && (
              <div style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
                DOI:{" "}
                <a
                  href={`https://doi.org/${article.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-primary)", textDecoration: "none", fontFamily: "monospace" }}
                >
                  https://doi.org/{article.doi}
                </a>
              </div>
            )}
          </div>

          {/* Abstract Section */}
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.75rem" }}>
              Abstract
            </h2>
            <p style={{ color: "var(--color-text-body)", fontSize: "0.95rem", lineHeight: 1.7, margin: 0 }}>
              {article.abstract || "The abstract for this publication is cataloged under the publisher's open-access repository. Access the full text via the publisher link or DOI below."}
            </p>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)" }}>
            {article.pdfUrl && (
              <a
                href={article.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                <i className="fa-solid fa-file-pdf" style={{ marginRight: "6px" }}></i>
                Download Full Text PDF
              </a>
            )}

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginRight: "6px" }}></i>
                View at Publisher
              </a>
            )}

            {article.doi && (
              <a
                href={`https://doi.org/${article.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm"
              >
                <i className="fa-solid fa-link" style={{ marginRight: "6px" }}></i>
                Crossref Record
              </a>
            )}
          </div>
        </article>

        {/* Citation Provenance Card */}
        <section className="glass-card" style={{ padding: "2rem", borderRadius: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)" }}>
                Verified Citation Velocity
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0.2rem 0 0" }}>
                Recorded scholarly citations in African and international peer-reviewed literature
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--color-primary)" }}>
                {article.citationCount}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                Total Citations
              </div>
            </div>
          </div>

          {article.citedBy.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
              Citations are continuously tracked and harvested across continental OJS endpoints and OpenAlex feeds.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {article.citedBy.map((cite, idx) => {
                const ca = cite.citingArticle;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "0.85rem 1rem",
                      background: "var(--color-bg-alt)",
                      borderRadius: "8px",
                      fontSize: "0.88rem",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--color-text-main)", marginBottom: "0.25rem" }}>
                      "{ca.title}"
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      Citing Venue: {ca.journal?.name || "Peer-Reviewed Literature"} ({ca.journal?.country || "International"})
                      {ca.doi && ` • DOI: ${ca.doi}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
