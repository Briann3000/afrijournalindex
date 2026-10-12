import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Institutional Research Consoles & University Benchmarking",
  description: "Continental university benchmarking dashboards tracking aggregate publication counts, verified citation volume, and institutional h-index metrics across Africa.",
  openGraph: {
    title: "University & Institutional Research Rankings | AfriJournal Indexing",
    description: "Benchmark research output and affiliated journal performance across leading African universities.",
    url: "https://afrijournalindexing.org/institution",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/institution",
  },
};

export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
