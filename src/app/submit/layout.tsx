import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Journal for Free Indexing & Crawler Evaluation",
  description: "Submit your peer-reviewed academic serial for free indexing in AfriJournal Indexing. Fast automated crawler screening verifies ISSN registry, domain security, and editorial board compliance.",
  openGraph: {
    title: "Submit Journal for Indexing | AfriJournal Indexing",
    description: "Submit African scholarly journals for free automated evaluation and permanent inclusion in the continental index.",
    url: "https://afrijournalindexing.org/submit",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/submit",
  },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
