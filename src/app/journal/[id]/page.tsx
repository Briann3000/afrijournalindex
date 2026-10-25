import React from "react";
import { getJournalDetail } from "../../../lib/journal-detail";
import JournalClientView from "./JournalClientView";

export default async function JournalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const journal = await getJournalDetail(id);

  return <JournalClientView initialJournal={journal} id={id} />;
}
