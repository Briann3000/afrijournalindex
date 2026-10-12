import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indexing & Evaluation Plans — Transparent Academic Pricing",
  description: "Free public access and open baseline indexing for African scientific journals. Official 12-Page Institutional Evaluation Dossiers and Vector Verification Certificates available for university presses and editors.",
  openGraph: {
    title: "Academic Pricing & Indexing Plans | AfriJournal Indexing",
    description: "Transparent academic pricing for editorial teams, university presses, and institutional evaluation councils.",
    url: "https://afrijournalindexing.org/pricing",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
