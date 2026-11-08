import React from "react";
import type { Metadata } from "next";
import { getInitialScholars } from "../../lib/scholars-data";
import ScholarsClientView from "./ScholarsClientView";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolved = await searchParams;
  const page = parseInt(String(resolved?.page || "1"), 10) || 1;
  const q = typeof resolved?.q === "string" ? resolved.q : "";

  const title = q
    ? `Search "${q}" | AfriScholar Academic Registry (Page ${page})`
    : `Pan-African Scholars Registry | Verified Researchers & Metrics (Page ${page})`;

  const description = "Explore verified African researchers, citation metrics, h-index rankings, and institutional affiliations across 54 African nations.";

  return {
    title,
    description,
    alternates: {
      canonical: `/scholars${page > 1 ? `?page=${page}` : ""}`
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/scholars${page > 1 ? `?page=${page}` : ""}`,
      siteName: "AfriJournal Indexing & AfriScholar Registry"
    }
  };
}

export default async function ScholarsPage({ searchParams }: Props) {
  const resolved = await searchParams;
  const page = parseInt(String(resolved?.page || "1"), 10) || 1;
  const search = typeof resolved?.q === "string" ? resolved.q : "";
  const country = typeof resolved?.country === "string" ? resolved.country : "";
  const interest = typeof resolved?.interest === "string" ? resolved.interest : "";

  const { scholars, totalCount } = await getInitialScholars(15, page, search, country, interest);

  return (
    <ScholarsClientView
      initialScholars={scholars}
      initialTotalCount={totalCount}
      initialPage={page}
    />
  );
}
