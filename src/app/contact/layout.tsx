import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Editorial & Technical Support",
  description: "Get in touch with the AfriJournal Indexing editorial desk, technical indexing team, or institutional support staff.",
  openGraph: {
    title: "Contact Support | AfriJournal Indexing",
    description: "Connect with the AfriJournal Indexing editorial desk and institutional support teams.",
    url: "https://afrijournalindexing.org/contact",
  },
  alternates: {
    canonical: "https://afrijournalindexing.org/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
