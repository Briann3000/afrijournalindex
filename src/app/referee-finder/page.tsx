"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RefereeFinderRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/review/submit");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", fontFamily: "sans-serif" }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)" }}></i>
      <div style={{ color: "var(--color-text-main)", fontWeight: 700 }}>Redirecting to Unified Reviewer Portal...</div>
    </div>
  );
}
