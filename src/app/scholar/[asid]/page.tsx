import React, { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { normalizeAfriScholarId } from "../../../lib/afrischolar-id";
import { fetchScholarProfile } from "../../../lib/scholar-service";
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
        { legacyAsid: cleanAsid.toUpperCase() },
        { legacyAsid: normalizedAsid.toUpperCase() },
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

  // 1. Exact direct match by current ASID or internal UUID
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
      afriScholarId: true,
      legacyAsid: true
    }
  });

  // 2. Deterministic 1-to-1 Legacy ASID Resolution:
  // If user visits an old alphanumeric ASID previously indexed by Google (e.g. ASID-R5GM-5F7N-945Y),
  // permanently 301-redirect to their exact canonical numeric ASID profile.
  if (!user) {
    const legacyMatch = await prisma.user.findFirst({
      where: {
        OR: [
          { legacyAsid: cleanAsid.toUpperCase() },
          { legacyAsid: normalizedAsid.toUpperCase() }
        ]
      },
      select: {
        afriScholarId: true
      }
    });

    if (legacyMatch?.afriScholarId) {
      redirect(`/scholar/${encodeURIComponent(legacyMatch.afriScholarId)}`);
    }
  }

  // 3. Fallback for unresolvable inputs:
  if (!user) {
    const isAsidFormat = /^ASID-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(cleanAsid);
    const isUuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanAsid);

    // If visiting a name slug or search term (e.g. /scholar/wanjohi or /scholar/anthony-wanjohi),
    // redirect to the directory search instead of guessing an arbitrary scholar with findFirst
    if (!isAsidFormat && !isUuidFormat) {
      const searchTerm = cleanAsid.replace(/^ASID-/i, "").replace(/[-_]+/g, " ").trim();
      redirect(`/scholars?q=${encodeURIComponent(searchTerm)}`);
    }

    notFound();
  }

  // 4. If accessed by internal UUID, redirect to canonical ASID URL
  if (user && user.afriScholarId && user.afriScholarId !== cleanAsid) {
    redirect(`/scholar/${encodeURIComponent(user.afriScholarId)}`);
  }

  // 5. Server-Side Pre-rendering (SSR): Preload complete profile payload on the server
  // Deliver full text and scientometrics directly to Googlebot on initial HTML response
  const scholarData = await fetchScholarProfile(user.afriScholarId || user.id);

  // 6. Schema.org Person JSON-LD for Search Engines & Academic Harvesters
  const p = scholarData?.profile;
  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `https://afrijournalindexing.org/scholar/${encodeURIComponent(p.afriScholarId || cleanAsid)}`,
        "name": p.name,
        "description": p.bio || `Academic profile of ${p.name}${p.institution ? ` at ${p.institution}` : ""}. Pan-African scholarly registry.`,
        "jobTitle": p.department || "Academic Researcher",
        ...(p.institution
          ? {
              "worksFor": {
                "@type": "CollegeOrUniversity",
                "name": p.institution
              }
            }
          : {}),
        "identifier": [
          p.afriScholarId ? { "@type": "PropertyValue", "name": "AfriScholar ID", "value": p.afriScholarId } : null,
          p.legacyAsid ? { "@type": "PropertyValue", "name": "Legacy AfriScholar ID", "value": p.legacyAsid } : null,
          p.orcid ? { "@type": "PropertyValue", "name": "ORCID", "value": p.orcid } : null,
          p.openAlexId ? { "@type": "PropertyValue", "name": "OpenAlex ID", "value": p.openAlexId } : null
        ].filter(Boolean),
        "sameAs": [
          p.orcid ? `https://orcid.org/${p.orcid.replace(/https?:\/\/orcid\.org\//i, "")}` : null,
          p.openAlexId ? `https://openalex.org/authors/${p.openAlexId.replace(/https?:\/\/openalex\.org\//i, "")}` : null,
          p.googleScholarUrl || null
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
        <ResearcherProfileContent
          idProp={user.afriScholarId || normalizedAsid}
          initialProfileData={scholarData}
        />
      </Suspense>
    </>
  );
}
