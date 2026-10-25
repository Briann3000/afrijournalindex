import type { Metadata } from "next";
import { prisma } from "../../../lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const journal = await prisma.journal.findFirst({
      where: {
        OR: [{ id }, { issn: id }, { eissn: id }, { name: { contains: id } }],
      },
      select: {
        id: true,
        name: true,
        issn: true,
        eissn: true,
        country: true,
        publisherName: true,
        qualityGrade: true,
        isIndexed: true,
        reports: {
          orderBy: { year: "desc" },
          take: 1,
          select: {
            standardScore: true,
            quartile: true,
          },
        },
      },
    });

    if (!journal) {
      return {
        title: "Journal Profile | AfriJournal Indexing",
        description: "Explore African scientific journals indexed on AfriJournal Indexing.",
      };
    }

    const issnStr = [journal.issn, journal.eissn].filter(Boolean).join(" / ") || "Registered";
    const report = journal.reports[0];
    const score = report ? report.standardScore.toFixed(3) : "Evaluated";
    const quartile = report?.quartile ? ` (${report.quartile})` : "";

    const title = `${journal.name} — Indexed in AfriJournal Indexing | AJCI Metrics & Profile`;
    const description = `Official indexing record and citation metrics for ${journal.name} (ISSN: ${issnStr}), published by ${journal.publisherName} in ${journal.country}. Officially indexed in AfriJournal Indexing with verified 2-Year AJCI Citation Score: ${score}${quartile}, Quality Grade: ${journal.qualityGrade || "Verified"}.`;

    const metaOther: Record<string, string> = {
      "citation_journal_title": journal.name,
      "citation_publisher": journal.publisherName,
      "citation_language": "en"
    };
    if (journal.issn) metaOther["citation_issn"] = journal.issn;
    if (journal.eissn) metaOther["citation_eissn"] = journal.eissn;

    return {
      title,
      description,
      keywords: [
        journal.name,
        journal.publisherName,
        "AfriJournal Indexing",
        "AJCI",
        "African scientific journals",
        journal.country,
        journal.issn || "",
        journal.eissn || "",
        "indexed academic journal",
        "African research citation index"
      ].filter(Boolean),
      openGraph: {
        title: `${journal.name} — Indexed in AfriJournal Indexing`,
        description,
        url: `https://afrijournalindexing.org/journal/${journal.id}`,
        siteName: "AfriJournal Indexing",
        type: "article",
        images: [
          {
            url: "/og-preview.png",
            width: 1200,
            height: 630,
            alt: `${journal.name} on AfriJournal Indexing`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${journal.name} — Indexed in AfriJournal Indexing`,
        description,
      },
      alternates: {
        canonical: `https://afrijournalindexing.org/journal/${journal.id}`,
      },
      other: metaOther,
    };
  } catch {
    return {
      title: "Journal Profile | AfriJournal Indexing",
      description: "Official African academic journal bibliometric record and indexing profile on AfriJournal Indexing.",
    };
  }
}

export default async function JournalDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let jsonLd: any = null;

  try {
    const journal = await prisma.journal.findFirst({
      where: {
        OR: [{ id }, { issn: id }, { eissn: id }, { name: { contains: id } }],
      },
      select: {
        id: true,
        name: true,
        issn: true,
        eissn: true,
        country: true,
        publisherName: true,
        description: true,
        isIndexed: true,
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
    });

    if (journal) {
      const canonicalUrl = `https://afrijournalindexing.org/journal/${journal.id}`;
      const issns = [journal.issn, journal.eissn].filter(Boolean) as string[];

      // Extract abbreviation if present in parentheses e.g. "African Research Journal of Education and Social Sciences (ARJESS)"
      const matchAbbr = journal.name.match(/\(([^)]+)\)/);
      const alternateNames = matchAbbr ? [matchAbbr[1], journal.name.replace(/\s*\([^)]+\)/, "").trim()] : [];

      jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Periodical",
            "@id": `${canonicalUrl}#periodical`,
            "name": journal.name,
            "alternateName": alternateNames.length > 0 ? alternateNames : undefined,
            "issn": issns.length > 0 ? issns : undefined,
            "publisher": {
              "@type": "Organization",
              "name": journal.publisherName,
              "address": {
                "@type": "PostalAddress",
                "addressCountry": journal.country
              }
            },
            "url": canonicalUrl,
            "inLanguage": "en",
            "description": journal.description || `Academic journal published in ${journal.country} by ${journal.publisherName}.`
          },
          {
            "@type": "WebPage",
            "@id": `${canonicalUrl}#webpage`,
            "url": canonicalUrl,
            "name": `${journal.name} — Indexed in AfriJournal Indexing`,
            "isPartOf": {
              "@type": "WebSite",
              "@id": "https://afrijournalindexing.org/#website",
              "name": "AfriJournal Indexing",
              "url": "https://afrijournalindexing.org"
            },
            "about": {
              "@id": `${canonicalUrl}#periodical`
            },
            "description": `Official indexing record confirming that ${journal.name} is indexed by AfriJournal Indexing with verified 2-Year AJCI citation score: ${journal.reports[0]?.standardScore?.toFixed(3) || "Evaluated"}. Quality Grade: ${journal.qualityGrade || "Verified"}.`
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://afrijournalindexing.org"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Browse Directory",
                "item": "https://afrijournalindexing.org/browse"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": journal.name,
                "item": canonicalUrl
              }
            ]
          }
        ]
      };
    }
  } catch (err) {
    console.error("Failed to generate JSON-LD in JournalDetailLayout:", err);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
