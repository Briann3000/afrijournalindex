import type { Metadata } from "next";
import { prisma } from "../../../lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
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
          },
        },
      },
    });

    if (!article) {
      return {
        title: "Article Not Found | AfriJournal Indexing",
        description: "The requested academic publication could not be located.",
      };
    }

    const title = `${article.title} — ${article.journal.name}`;
    const description = article.abstract
      ? article.abstract.slice(0, 160).replace(/\s+/g, " ").trim() + "..."
      : `Scholarly publication in ${article.journal.name}, published by ${article.journal.publisherName} (${article.journal.country}). Indexed in AfriJournal Indexing.`;

    const pubYear = new Date(article.publishDate).getFullYear().toString();
    const pubDateStr = new Date(article.publishDate).toISOString().split("T")[0];

    // Highwire Press / Google Scholar Academic Metadata Tags
    const otherMeta: Record<string, string> = {
      citation_title: article.title,
      citation_journal_title: article.journal.name,
      citation_publisher: article.journal.publisherName,
      citation_publication_date: pubDateStr,
      citation_date: pubYear,
    };

    if (article.doi) {
      otherMeta.citation_doi = article.doi;
    }
    if (article.journal.issn) {
      otherMeta.citation_issn = article.journal.issn;
    } else if (article.journal.eissn) {
      otherMeta.citation_issn = article.journal.eissn;
    }
    if (article.pdfUrl) {
      otherMeta.citation_pdf_url = article.pdfUrl;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://afrijournalindexing.org/article/${article.id}`,
        type: "article",
        publishedTime: article.publishDate.toISOString(),
      },
      alternates: {
        canonical: `https://afrijournalindexing.org/article/${article.id}`,
      },
      other: otherMeta,
    };
  } catch (err) {
    return {
      title: "Article Profile | AfriJournal Indexing",
      description: "Verified African scientific research publication.",
    };
  }
}

export default async function ArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let jsonLd: any = null;

  try {
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
          },
        },
      },
    });

    if (article) {
      const canonicalUrl = `https://afrijournalindexing.org/article/${article.id}`;
      const journalUrl = `https://afrijournalindexing.org/journal/${article.journal.id}`;

      jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "ScholarlyArticle",
            "@id": `${canonicalUrl}#article`,
            url: canonicalUrl,
            headline: article.title,
            name: article.title,
            description: article.abstract || undefined,
            datePublished: article.publishDate.toISOString(),
            isPartOf: {
              "@type": "Periodical",
              "@id": `${journalUrl}#periodical`,
              name: article.journal.name,
              issn: [article.journal.issn, article.journal.eissn].filter(Boolean),
              publisher: {
                "@type": "Organization",
                name: article.journal.publisherName,
              },
            },
            ...(article.doi
              ? {
                  identifier: {
                    "@type": "PropertyValue",
                    propertyID: "doi",
                    value: article.doi,
                  },
                }
              : {}),
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://afrijournalindexing.org",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: article.journal.name,
                item: journalUrl,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: article.title,
                item: canonicalUrl,
              },
            ],
          },
        ],
      };
    }
  } catch (err) {
    console.error("Failed to generate Article JSON-LD:", err);
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
