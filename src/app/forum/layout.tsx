import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "African Scholarly Forum & Community",
  description: "Academic discussion forums on African scholarly publishing, open access repositories, journal accreditation, and research ethics.",
  keywords: [
    "African scholarly forum",
    "academic publishing forum",
    "open access Africa",
    "journal indexing community",
    "African researchers community"
  ],
  openGraph: {
    title: "African Scholarly Forum & Community | AfriJournal Indexing",
    description: "Join continental discussions on scholarly publishing, research ethics, and journal accreditation.",
    url: "https://afrijournalindexing.org/forum",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/forum",
  },
};

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
