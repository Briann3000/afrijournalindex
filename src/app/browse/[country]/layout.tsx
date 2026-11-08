import type { Metadata } from "next";
import { findCountryBySlug } from "../../data/seo-slugs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const countryMeta = findCountryBySlug(countrySlug);
  const countryName = countryMeta ? countryMeta.name : countrySlug.charAt(0).toUpperCase() + countrySlug.slice(1);

  const title = `Academic Journals in ${countryName} — Verified Indexing & Impact Metrics`;
  const description = `Explore accredited, peer-reviewed scientific journals published in ${countryName}. View 2-year AJCI citation impact and open-access research profiles.`;

  return {
    title,
    description,
    keywords: [
      `journals in ${countryName}`,
      `academic publishing ${countryName}`,
      `peer-reviewed journals ${countryName}`,
      `${countryName} citation index`,
      `research in ${countryName}`,
      "AfriJournal Indexing"
    ],
    openGraph: {
      title: `${title} | AfriJournal Indexing`,
      description,
      url: `https://afrijournalindexing.org/browse/${countrySlug}`,
      type: "website",
    },
    alternates: {
      canonical: `https://afrijournalindexing.org/browse/${countrySlug}`,
    },
  };
}

export default async function CountryBrowseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
}) {
  const { country: countrySlug } = await params;
  const countryMeta = findCountryBySlug(countrySlug);
  const countryName = countryMeta ? countryMeta.name : countrySlug;
  const canonicalUrl = `https://afrijournalindexing.org/browse/${countrySlug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        "url": canonicalUrl,
        "name": `Academic Journals in ${countryName} | AfriJournal Indexing`,
        "description": `Directory of peer-reviewed African academic journals published in ${countryName}.`,
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
            "name": "Browse Directory",
            "item": "https://afrijournalindexing.org/browse"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": countryName,
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
