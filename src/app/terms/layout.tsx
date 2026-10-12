import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions of Service",
  description: "Read the terms governing the use of AfriJournal Indexing, including academic data policies, journal submission warranties, and editorial integrity standards.",
  openGraph: {
    title: "Terms and Conditions | AfriJournal Indexing",
    description: "Official indexing policies, publisher warranties, and terms of service.",
    url: "https://afrijournalindexing.org/terms",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
