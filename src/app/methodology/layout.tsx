import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bibliometric Methodology & AJCI Citation Formulation",
  description: "Learn the mathematical formulation of the 2-Year AfriJournal Citation Index (AJCI), the uncorrupted Regional Representation Quotient (RRQ), and automated registry verification.",
  openGraph: {
    title: "AJCI Bibliometric Methodology | AfriJournal Indexing",
    description: "Transparent, auditable calculation algorithms adhering to international academic indexing standards.",
    url: "https://afrijournalindexing.org/methodology",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/methodology",
  },
};

export default function MethodologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
