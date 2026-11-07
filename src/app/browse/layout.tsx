import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Directory of Indexed African Academic Journals",
  description: "Explore the comprehensive, verified directory of 1,900+ African scholarly journals and publications. Search across 40+ countries by discipline, Print/Online ISSN, and AJCI impact metrics.",
  openGraph: {
    title: "Browse Indexed African Journals | AfriJournal Indexing",
    description: "Search 1,900+ verified African peer-reviewed research journals across African nations.",
    url: "https://afrijournalindexing.org/browse",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/browse",
  },
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
