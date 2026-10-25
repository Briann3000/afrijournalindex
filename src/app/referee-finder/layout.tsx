import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "African Peer Reviewer & Editorial Referee Finder",
  description: "Identify and invite verified African academic referees, discipline-specific peer reviewers, and editorial board candidates across 54 African countries.",
  keywords: [
    "African peer reviewers",
    "editorial referee finder",
    "journal reviewers Africa",
    "African academic experts",
    "peer review matching"
  ],
  openGraph: {
    title: "African Peer Reviewer & Referee Finder | AfriJournal Indexing",
    description: "Connect with verified peer reviewers and academic experts across 54 African countries.",
    url: "https://afrijournalindexing.org/referee-finder",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/referee-finder",
  },
};

export default function RefereeFinderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
