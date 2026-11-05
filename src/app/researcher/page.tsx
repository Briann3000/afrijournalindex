"use client";

import React, { Suspense } from "react";
import ResearcherProfileContent from "./ResearcherProfileContent";

export default function ResearcherProfilePage() {
  return (
    <Suspense
      fallback={
        <div
          className="page-wrapper"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)"
          }}
        >
          Loading scholar profile...
        </div>
      }
    >
      <ResearcherProfileContent />
    </Suspense>
  );
}
