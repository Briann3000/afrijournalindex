import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) — Indexing & Governance",
  description: "Find clear answers on AfriJournal Indexing governance, evaluation methodology, free open indexing policies, and researcher profiles.",
  openGraph: {
    title: "FAQ & Indexing Guidelines | AfriJournal Indexing",
    description: "Answers regarding editorial compliance, 2-year AJCI calculations, and institutional consoles.",
    url: "https://afrijournalindexing.org/faq",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/faq",
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
