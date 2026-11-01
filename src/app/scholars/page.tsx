import React from "react";
import { getInitialScholars } from "../../lib/scholars-data";
import ScholarsClientView from "./ScholarsClientView";

export default async function ScholarsPage() {
  const { scholars, totalCount } = await getInitialScholars(15);

  return (
    <ScholarsClientView
      initialScholars={scholars}
      initialTotalCount={totalCount}
    />
  );
}
