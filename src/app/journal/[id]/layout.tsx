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
        OR: [{ id }, { issn: id }, { eissn: id }],
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

    const title = `${journal.name} (ISSN: ${issnStr})`;
    const description = `Official indexing record for ${journal.name}, published in ${journal.country} by ${journal.publisherName}. 2-Year AJCI Citation Score: ${score}${quartile}. Quality Grade: ${journal.qualityGrade || "Verified"}.`;

    return {
      title,
      description,
      openGraph: {
        title: `${journal.name} | AfriJournal Indexing`,
        description,
        url: `https://afrijournalindexing.org/journal/${journal.id}`,
        type: "article",
      },
      alternates: {
        canonical: `https://afrijournalindexing.org/journal/${journal.id}`,
      },
    };
  } catch {
    return {
      title: "Journal Profile | AfriJournal Indexing",
      description: "Official African academic journal bibliometric record and indexing profile.",
    };
  }
}

export default function JournalDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
