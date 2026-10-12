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
        country: true,
        qualityGrade: true,
      },
    });

    if (!journal) {
      return {
        title: "Certificate Verification | AfriJournal Indexing",
        description: "Official AfriJournal Indexing vector certificate verification registry.",
      };
    }

    const title = `Official Indexing Certificate — ${journal.name}`;
    const description = `Public cryptographic verification record and Certificate of Indexation for ${journal.name} (${journal.country}). Grade ${journal.qualityGrade || "A"}. Verified in AfriJournal Indexing.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://afrijournalindexing.org/verify/${journal.id}`,
      },
      alternates: {
        canonical: `https://afrijournalindexing.org/verify/${journal.id}`,
      },
    };
  } catch {
    return {
      title: "Certificate Verification | AfriJournal Indexing",
      description: "Official AfriJournal Indexing vector certificate verification registry.",
    };
  }
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
