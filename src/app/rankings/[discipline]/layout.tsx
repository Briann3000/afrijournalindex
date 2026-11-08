import type { Metadata } from "next";
import { TOP_DISCIPLINE_SLUGS } from "../../data/seo-slugs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ discipline: string }>;
}): Promise<Metadata> {
  const { discipline: disciplineSlug } = await params;
  const disciplineName = TOP_DISCIPLINE_SLUGS[disciplineSlug] || disciplineSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const title = `African Journal Rankings: ${disciplineName} — AJCI Leaderboard & Quartiles`;
  const description = `Top-ranked African scholarly journals in ${disciplineName}. Compare 2-year AJCI citation impact and regional research output.`;

  return {
    title,
    description,
    keywords: [
      `African ${disciplineName} journals`,
      `journal rankings ${disciplineName} Africa`,
      `Q1 journals ${disciplineName} Africa`,
      `AJCI impact factor ${disciplineName}`,
      "AfriJournal Indexing"
    ],
    openGraph: {
      title: `${title} | AfriJournal Indexing`,
      description,
      url: `https://afrijournalindexing.org/rankings/${disciplineSlug}`,
      type: "website",
    },
    alternates: {
      canonical: `https://afrijournalindexing.org/rankings/${disciplineSlug}`,
    },
  };
}

export default async function DisciplineRankingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ discipline: string }>;
}) {
  const { discipline: disciplineSlug } = await params;
  const disciplineName = TOP_DISCIPLINE_SLUGS[disciplineSlug] || disciplineSlug;
  const canonicalUrl = `https://afrijournalindexing.org/rankings/${disciplineSlug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": `African Journal Rankings: ${disciplineName}`,
        "description": `Ranking directory of African scientific journals in ${disciplineName}.`,
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://afrijournalindexing.org/#website",
          "name": "AfriJournal Indexing",
          "url": "https://afrijournalindexing.org"
        }
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
            "name": "Journal Rankings",
            "item": "https://afrijournalindexing.org/rankings"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": disciplineName,
            "item": canonicalUrl
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
