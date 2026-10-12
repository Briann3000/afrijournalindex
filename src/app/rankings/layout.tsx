import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Continental Journal Rankings & Subject Quartiles (Q1–Q4)",
  description: "Explore the live African academic journal leaderboard ranked by 2-year AJCI citation velocity and Regional Representation Quotients (RRQ) across disciplines.",
  openGraph: {
    title: "Journal Rankings & Subject Quartiles | AfriJournal Indexing",
    description: "Verified continental journal rankings across Health, STEM, Agriculture, Business, and Social Sciences.",
    url: "https://afrijournalindexing.org/rankings",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/rankings",
  },
};

export default function RankingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
