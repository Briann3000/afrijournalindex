import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & Academic Data Protection",
  description: "Learn how AfriJournal Indexing safeguards researcher information, enforces zero commercial tracking, and preserves open scientific metadata.",
  openGraph: {
    title: "Privacy Policy | AfriJournal Indexing",
    description: "Our commitment to researcher privacy, zero advertising, and open scholarly record transparency.",
    url: "https://afrijournalindexing.org/privacy",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
