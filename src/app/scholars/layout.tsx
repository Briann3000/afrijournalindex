import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pan-African Scholars Registry — African Researchers, h-Index & Metrics",
  description: "Search verified African researchers, university affiliations, h-index rankings, i10-index, and publication citation metrics across all 54 African nations.",
  keywords: [
    "African scholars",
    "African researchers directory",
    "h-index Africa",
    "African university faculty",
    "academic citation metrics Africa",
    "AfriJournal Scholars Registry"
  ],
  openGraph: {
    title: "Pan-African Scholars Registry | AfriJournal Indexing",
    description: "Verified African researchers, university affiliations, and bibliometric citation profiles.",
    url: "https://afrijournalindexing.org/scholars",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/scholars",
  },
};

export default function ScholarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
