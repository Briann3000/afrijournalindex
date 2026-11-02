import React from "react";
import type { Metadata } from "next";
import { prisma } from "../../lib/db";
import IndexedJournalsClient from "./IndexedJournalsClient";

export const metadata: Metadata = {
  title: "Indexed Journals List | AfriJournal Index",
  description: "Official master directory of peer-reviewed African academic journals indexed in AfriJournal Index.",
};

export const revalidate = 300; // Revalidate every 5 minutes

export default async function IndexedJournalsPage() {
  const journals = await prisma.journal.findMany({
    select: {
      id: true,
      name: true,
      issn: true,
      eissn: true,
      publisherName: true,
      country: true,
      frequency: true,
      websiteUrl: true,
      qualityGrade: true,
      isIndexed: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return <IndexedJournalsClient initialJournals={journals} />;
}
