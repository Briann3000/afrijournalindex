import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About AfriJournal Indexing — Governance & Mission",
  description: "Learn about the mission, continental academic advisory committee, and open science philosophy driving AfriJournal Indexing.",
  openGraph: {
    title: "About Us | AfriJournal Indexing",
    description: "Empowering African scholarly discovery through transparent, open academic indexing.",
    url: "https://afrijournalindexing.org/about",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
