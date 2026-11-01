import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../Header";
import Footer from "../../Footer";
import { prisma } from "../../../lib/db";
import ResourceContentRenderer from "../../../components/ResourceContentRenderer";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const resource = await prisma.resource.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, summary: true }
  });

  if (!resource) {
    return {
      title: "Resource Not Found | AfriJournal Index",
      description: "The requested academic resource could not be found."
    };
  }

  return {
    title: `${resource.title} | AfriJournal Resources`,
    description: resource.summary || "AfriJournal scholarly guide and academic resource."
  };
}

export default async function DynamicResourcePage({ params }: Props) {
  const { slug } = await params;

  const resource = await prisma.resource.findFirst({
    where: {
      slug,
      isPublished: true
    }
  });

  if (!resource) {
    notFound();
  }

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header activePage="resources" />

      <main className="container reading-container" style={{ padding: "3rem clamp(1rem, 2vw, 1.5rem) 5rem", maxWidth: "920px" }}>
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/resources" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Resources</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>{resource.title}</span>
        </div>

        {/* Page Header */}
        <header style={{ marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
            <span style={{
              display: "inline-block",
              background: "rgba(180, 83, 9, 0.1)",
              color: "#b45309",
              border: "1px solid rgba(180, 83, 9, 0.25)",
              padding: "0.2rem 0.65rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 700
            }}>
              {resource.category || "Scholarly Resource"}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              Updated {new Date(resource.updatedAt || resource.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.3rem)", fontWeight: 800, margin: "0 0 0.75rem", color: "var(--color-navy)", lineHeight: 1.25 }}>
            {resource.title}
          </h1>

          {resource.summary && (
            <p style={{ fontSize: "1.05rem", color: "var(--color-text-muted)", margin: 0, lineHeight: 1.6 }}>
              {resource.summary}
            </p>
          )}

          {/* Downloadable Attachment Button */}
          {resource.fileUrl && (
            <div style={{ marginTop: "1.25rem" }}>
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="btn btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0.55rem 1.15rem",
                  fontSize: "0.85rem",
                  borderRadius: "10px",
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                <i className="fa-solid fa-file-arrow-down"></i>
                Download Attachment {resource.fileName ? `(${resource.fileName})` : ""}
              </a>
            </div>
          )}
        </header>

        {/* Article Body */}
        <ResourceContentRenderer content={resource.content} />

        {/* Footer Back Link */}
        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)" }}>
          <Link
            href="/resources"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--color-primary)",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none"
            }}
          >
            ← Back to all Academic Resources
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
