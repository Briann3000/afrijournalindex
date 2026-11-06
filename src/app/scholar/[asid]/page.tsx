import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { normalizeAfriScholarId } from "../../../lib/afrischolar-id";
import ResearcherProfileContent from "../../researcher/ResearcherProfileContent";

interface Props {
  params: Promise<{ asid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { asid } = await params;
  const cleanAsid = decodeURIComponent(asid).trim();
  const normalizedAsid = normalizeAfriScholarId(cleanAsid) || cleanAsid;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { afriScholarId: normalizedAsid },
        { afriScholarId: cleanAsid },
        { id: cleanAsid }
      ]
    },
    select: {
      name: true,
      institution: true,
      department: true,
      totalCitations: true,
      hIndex: true,
      afriScholarId: true
    }
  });

  if (!user) {
    return {
      title: "Scholar Not Found | AfriScholar Registry",
      description: "The requested AfriScholar persistent identifier could not be resolved."
    };
  }

  const title = `${user.name} | AfriScholar Registry (${user.afriScholarId || normalizedAsid})`;
  const desc = `Academic profile of ${user.name}${user.institution ? ` at ${user.institution}` : ""}. Verified metrics: ${user.totalCitations} citations, h-index ${user.hIndex}. Verified Pan-African scholarly registry.`;

  return {
    title,
    description: desc,
    alternates: {
      canonical: `/scholar/${encodeURIComponent(user.afriScholarId || normalizedAsid)}`
    },
    openGraph: {
      title,
      description: desc,
      type: "profile",
      url: `/scholar/${encodeURIComponent(user.afriScholarId || normalizedAsid)}`,
      siteName: "AfriJournal Indexing & AfriScholar Registry"
    },
    twitter: {
      card: "summary",
      title,
      description: desc
    }
  };
}

export default async function ScholarCanonicalPage({ params }: Props) {
  const { asid } = await params;
  const cleanAsid = decodeURIComponent(asid).trim();
  const normalizedAsid = normalizeAfriScholarId(cleanAsid) || cleanAsid;

  // 1. Direct match by ASID or ID
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { afriScholarId: normalizedAsid },
        { afriScholarId: cleanAsid },
        { id: cleanAsid }
      ]
    },
    select: {
      id: true,
      name: true,
      afriScholarId: true,
      institution: true,
      department: true,
      orcid: true,
      openAlexId: true,
      googleScholarUrl: true,
      totalCitations: true,
      hIndex: true
    }
  });

  // 2. Legacy Alphanumeric or Slug Fallback: if visiting an old URL (e.g. ASID-R5GM... or a user slug)
  if (!user && cleanAsid.toUpperCase().startsWith("ASID-")) {
    // Check if there's any user whose name or email or legacy record can be resolved
    // In particular, check Anthony Wanjohi or Kengne if visited via former known links
    if (cleanAsid.includes("R5GM") || cleanAsid.toLowerCase().includes("wanjohi")) {
      user = await prisma.user.findFirst({
        where: { name: { contains: "Wanjohi" } },
        select: { id: true, name: true, afriScholarId: true, institution: true, department: true, orcid: true, openAlexId: true, googleScholarUrl: true, totalCitations: true, hIndex: true }
      });
    } else if (cleanAsid.includes("WZK5") || cleanAsid.toLowerCase().includes("kengne")) {
      user = await prisma.user.findFirst({
        where: { name: { contains: "Kengne" } },
        select: { id: true, name: true, afriScholarId: true, institution: true, department: true, orcid: true, openAlexId: true, googleScholarUrl: true, totalCitations: true, hIndex: true }
      });
    }
  }

  // If user was resolved through legacy/fallback and their current canonical ASID is different, redirect cleanly!
  if (user && user.afriScholarId && user.afriScholarId !== cleanAsid && !cleanAsid.startsWith("ASID-0") && !/^\d{4}/.test(cleanAsid.replace(/^ASID-/, ""))) {
    redirect(`/scholar/${encodeURIComponent(user.afriScholarId)}`);
  }

  // Schema.org Linked Data JSON-LD for Search Engines & Global Harvesters
  const jsonLd = user
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `https://afrijournalindexing.org/scholar/${user.afriScholarId || normalizedAsid}`,
        "identifier": user.afriScholarId || normalizedAsid,
        "name": user.name,
        "jobTitle": user.department || "Academic Researcher",
        ...(user.institution
          ? {
              "worksFor": {
                "@type": "CollegeOrUniversity",
                "name": user.institution
              }
            }
          : {}),
        "sameAs": [
          user.orcid ? `https://orcid.org/${user.orcid}` : null,
          user.openAlexId ? `https://openalex.org/authors/${user.openAlexId}` : null,
          user.googleScholarUrl || null
        ].filter(Boolean)
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense
        fallback={
          <div
            className="page-wrapper"
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-muted)"
            }}
          >
            Loading AfriScholar profile...
          </div>
        }
      >
        <ResearcherProfileContent idProp={user?.afriScholarId || normalizedAsid} />
      </Suspense>
    </>
  );
}
