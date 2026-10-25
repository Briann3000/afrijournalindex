import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Editorial Command Center | AfriJournal Index",
  description: "Secure administrative console for AfriJournal Indexing platform operations, submissions review, content moderation, and metrics calibration.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root">
      {children}
    </div>
  );
}
