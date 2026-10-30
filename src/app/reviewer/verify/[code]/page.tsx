"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../Header";
import Footer from "../../../Footer";

export default function CertificateVerifyPage() {
  const params = useParams();
  const code = (params?.code as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cert, setCert] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!code) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/review/verify/${code}`);
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || "Certificate verification record not found in the official registry.");
        }
        setCert(result.data);
      } catch (err: any) {
        setError(err.message || "Failed to verify certificate.");
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [code]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)", color: "var(--color-text-main)" }}>
      {/* Hide header & footer during print */}
      <div className="no-print">
        <Header activePage="reviewer" />
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .certificate-sheet {
            border: 6px double #334155 !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 2.5rem !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <main style={{ flex: 1, maxWidth: "920px", margin: "0 auto", padding: "2.5rem 1.5rem 6rem", width: "100%", boxSizing: "border-box" }}>
        {/* Breadcrumb Navigation */}
        <div className="no-print" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/reviewer" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Reviewer Desk</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>Certificate Verification</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Verifying credential in the African Scholarly Peer Review Registry...</div>
          </div>
        ) : error ? (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "2.5rem", textAlign: "center" }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "2.5rem", color: "#dc2626", marginBottom: "1rem" }}></i>
            <h2 style={{ fontSize: "1.35rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Verification Record Not Found</h2>
            <p style={{ color: "var(--color-text-body)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>{error}</p>
            <Link href="/reviewer" className="btn btn-primary btn-sm">Return to Reviewer Desk</Link>
          </div>
        ) : cert && (
          <div>
            {/* Action Bar (Screen Only) */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "1.5rem" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
                <i className="fa-solid fa-shield-halved" style={{ color: "#10b981" }}></i>
                <span>Cryptographically Verified Record &bull; ID: <strong style={{ color: "var(--color-primary)", fontFamily: "monospace" }}>{cert.verificationId}</strong></span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <i className={`fa-solid ${copied ? "fa-check" : "fa-link"}`} style={{ color: copied ? "#10b981" : "inherit" }}></i>
                  <span>{copied ? "Link Copied" : "Copy Verification URL"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-primary btn-sm"
                  style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Download / Print Credential (PDF)</span>
                </button>
              </div>
            </div>

            {/* Formal Certificate Document */}
            <div
              className="certificate-sheet"
              style={{
                background: "#ffffff",
                border: "4px double var(--color-border)",
                borderRadius: "12px",
                padding: "3.5rem 3rem",
                boxShadow: "0 6px 24px rgba(0, 0, 0, 0.05)",
                position: "relative",
                color: "#0f172a"
              }}
            >
              {/* Outer Academic Seal & Crest */}
              <div style={{ textAlign: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "2rem", marginBottom: "2.5rem" }}>
                <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#f8fafc", border: "2px solid #cbd5e1", color: "var(--color-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1rem" }}>
                  <i className="fa-solid fa-award"></i>
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>
                  African Scholarly Peer Review Registry
                </div>
                <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  Certificate of Peer Review Recognition
                </h1>
                <div style={{ fontSize: "0.9rem", color: "#64748b", fontStyle: "italic" }}>
                  In formal recognition of academic rigor, integrity, and peer evaluation service
                </div>
              </div>

              {/* Recipient Attribution */}
              <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                <div style={{ fontSize: "0.92rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.6rem" }}>
                  This official credential is awarded to
                </div>
                <div style={{ fontSize: "2.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.4rem", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {cert.reviewerName}
                </div>
                <div style={{ fontSize: "1.05rem", color: "var(--color-primary)", fontWeight: 700 }}>
                  {cert.reviewerInstitution}
                </div>
                {cert.orcid && (
                  <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "6px" }}>
                    ORCID: <span style={{ fontFamily: "monospace", color: "#0284c7" }}>{cert.orcid}</span>
                  </div>
                )}
              </div>

              {/* Citation & Evaluation Statement */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.75rem 2rem", marginBottom: "2.5rem", textAlign: "center", lineHeight: 1.7, fontSize: "0.96rem", color: "#334155" }}>
                In recognition of completing rigorous, double-blind peer review for manuscript submission reference{" "}
                <strong style={{ color: "#0f172a", fontFamily: "monospace" }}>{cert.trackingCode}</strong> adhering to the standards of the Committee on Publication Ethics (COPE) in the specialized scholarly discipline of:
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", marginTop: "0.6rem" }}>
                  {cert.discipline}
                </div>
              </div>

              {/* Security & Verification Metadata Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.75rem", marginBottom: "2.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Verification Hash</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--color-primary)", fontFamily: "monospace", marginTop: "3px" }}>
                    {cert.verificationId}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Completion Date</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a", marginTop: "3px" }}>
                    {new Date(cert.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Issuing Authority</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a", marginTop: "3px" }}>
                    {cert.issuer}
                  </div>
                </div>
              </div>

              {/* Formal Registry Endorsement & Signature Stamp */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "2rem", borderTop: "1px solid #e2e8f0", paddingTop: "2rem" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", color: "#166534", fontSize: "0.8rem", fontWeight: 700 }}>
                    <i className="fa-solid fa-stamp"></i>
                    <span>Official Registry Record &bull; Tamper Evident</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    AfriJournal Index Registry Directorate
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                    Academic Peer Review Standing Committee
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}
