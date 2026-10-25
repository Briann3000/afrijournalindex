import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholarly Working Drafts & Discussions",
  description: "Explore research working drafts, methodology notes, and peer review commentary from verified scholars and academics across Africa.",
  keywords: [
    "African academic drafts",
    "African research discussions",
    "preprints Africa",
    "peer review commentary",
    "scholarly publishing Africa"
  ],
  openGraph: {
    title: "Scholarly Working Drafts & Discussions | AfriJournal Indexing",
    description: "Academic discussions, working drafts, and peer review insights from verified African scholars.",
    url: "https://afrijournalindexing.org/posts",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/posts",
  },
};

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
