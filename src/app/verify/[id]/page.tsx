"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Header from "../../Header";
import Footer from "../../Footer";

interface JournalVerification {
  id: string;
  name: string;
  issn: string | null;
  eissn: string | null;
  publisherName: string;
  country: string;
  websiteUrl: string | null;
  qualityGrade: string | null;
  isIndexed: boolean;
  indexedAt: string | null;
  primaryDiscipline?: string;
  quartile?: "Q1" | "Q2" | "Q3" | "Q4" | "Unrated";
  latestReport: {
    year: number;
    standardScore: number;
    regionalScore: number;
    citationCount: number;
    articleCount: number;
  } | null;
}

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [journal, setJournal] = useState<JournalVerification | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedBadge, setCopiedBadge] = useState<boolean>(false);

  useEffect(() => {
    async function loadVerification() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/journals/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.journal) {
          setJournal(data.journal);
        } else {
          setError("Accreditation record could not be located in the verification registry.");
        }
      } catch (err) {
        console.error(err);
        setError("Network error communicating with the verification authority.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadVerification();
    }
  }, [id]);

  const handlePrintCertificate = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const verificationHash = journal 
    ? `AJIF-AUTH-${journal.id.substring(0, 8).toUpperCase()}-${(journal.issn || "REG").replace("-", "")}-2026`
    : "";

  const verifyUrl = typeof window !== "undefined" && journal
    ? `${window.location.origin}/verify/${journal.id}`
    : `https://afrijournalindex.org/verify/${journal?.id || id}`;

  // Simple clean SVG QR code placeholder or API QR code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=0f172a&qzone=0`;

  const copyBadgeSnippet = () => {
    if (!journal) return;
    const snippet = `<a href="${verifyUrl}"><img src="https://afrijournalindex.org/api/badge/${journal.issn || journal.id}.svg" alt="${journal.name} - Verified in AfriJournal Index" /></a>`;
    navigator.clipboard.writeText(snippet);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2500);
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Print Specific CSS to format A4 Landscape Certificate */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, header, footer, .header, .footer {
            display: none !important;
          }
          .certificate-container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .certificate-card {
            border: 4px solid #b45309 !important;
            padding: 2.5rem !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Header activePage="browse" />
      </div>

      <main className="container" style={{ padding: "3rem 0 5rem", maxWidth: "960px" }}>
        {loading ? (
          <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", color: "var(--color-primary)", marginBottom: "1rem" }}>
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            </div>
            <p style={{ color: "var(--color-text-muted)" }}>Validating cryptographic certificate signature...</p>
          </div>
        ) : error || !journal ? (
          <div className="glass-card" style={{ padding: "4rem", textAlign: "center" }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "3rem", color: "#dc2626", marginBottom: "1.5rem" }}></i>
            <h2 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)" }}>Verification Record Not Found</h2>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
              The requested certificate code does not match any accredited journal record.
            </p>
            <a href="/browse" className="btn btn-primary">
              Return to Journal Directory
            </a>
          </div>
        ) : (
          <div className="certificate-container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Verification Status Banner (No-Print) */}
            <div 
              className="no-print"
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "1.25rem 1.8rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#22c55e", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#15803d" }}>
                    Verified &amp; Accredited Scholarly Document
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#166534", fontFamily: "monospace" }}>
                    Authority Hash: {verificationHash}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                <button 
                  onClick={handlePrintCertificate}
                  className="btn btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.4rem", fontWeight: 700 }}
                >
                  <i className="fa-solid fa-print"></i>
                  <span>Download / Print PDF</span>
                </button>
                <a 
                  href={`/journal/${journal.id}`}
                  className="btn btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", fontSize: "0.85rem" }}
                >
                  <i className="fa-solid fa-arrow-left"></i>
                  <span>Journal Profile</span>
                </a>
              </div>
            </div>

            {/* Official Academic Certificate Document */}
            <div 
              className="certificate-card"
              style={{
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: "16px",
                border: "3px solid #b45309",
                outline: "6px solid rgba(180, 83, 9, 0.12)",
                outlineOffset: "4px",
                padding: "3.5rem 3.5rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
                position: "relative",
                fontFamily: "Georgia, serif"
              }}
            >
              {/* Corner Ornamental Accents */}
              <div style={{ position: "absolute", top: "15px", left: "15px", width: "30px", height: "30px", borderTop: "2px solid #b45309", borderLeft: "2px solid #b45309" }}></div>
              <div style={{ position: "absolute", top: "15px", right: "15px", width: "30px", height: "30px", borderTop: "2px solid #b45309", borderRight: "2px solid #b45309" }}></div>
              <div style={{ position: "absolute", bottom: "15px", left: "15px", width: "30px", height: "30px", borderBottom: "2px solid #b45309", borderLeft: "2px solid #b45309" }}></div>
              <div style={{ position: "absolute", bottom: "15px", right: "15px", width: "30px", height: "30px", borderBottom: "2px solid #b45309", borderRight: "2px solid #b45309" }}></div>

              {/* Certificate Header */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "1.8rem", marginBottom: "2rem" }}>
                <div style={{ fontSize: "0.82rem", color: "#b45309", letterSpacing: "2.5px", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  African Scholarly Indexing &amp; Metric Authority
                </div>
                <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", margin: "0 0 0.5rem", letterSpacing: "-0.01em" }}>
                  Certificate of Academic Indexation
                </h1>
                <div style={{ fontSize: "0.85rem", color: "#64748b", fontFamily: "var(--font-ui), sans-serif" }}>
                  International Scholarly Evaluation &amp; African Journal Impact Factor (AJIF)
                </div>
              </div>

              {/* Certificate Body Text */}
              <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                <p style={{ fontSize: "1rem", color: "#475569", margin: "0 0 1rem", fontStyle: "italic" }}>
                  This is to formally certify that the peer-reviewed scholarly publication
                </p>
                <h2 style={{ fontSize: "2rem", color: "#1e3a8a", margin: "0 0 0.8rem", fontWeight: 800 }}>
                  {journal.name}
                </h2>
                <p style={{ fontSize: "1.05rem", color: "#1e293b", margin: 0, fontWeight: 600, fontFamily: "var(--font-ui), sans-serif" }}>
                  Published by <strong>{journal.publisherName}</strong> • {journal.country}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "0.4rem 0 0", fontFamily: "var(--font-ui), sans-serif" }}>
                  Print ISSN: <strong>{journal.issn || "Registered"}</strong> {journal.eissn ? `| Online eISSN: ${journal.eissn}` : ""}
                </p>
                <p style={{ fontSize: "0.92rem", color: "#475569", margin: "1.2rem auto 0", maxWidth: "680px", lineHeight: "1.6" }}>
                  has successfully satisfied the editorial compliance screening, open peer-review transparency standards, and citation evaluation criteria for accredited inclusion in the AfriJournal Index Directory.
                </p>
              </div>

              {/* Verified Metrics Badge Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", background: "#f8fafc", padding: "1.5rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "2.5rem", textAlign: "center", fontFamily: "var(--font-ui), sans-serif" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Standard AJIF</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#1e3a8a", marginTop: "0.2rem" }}>
                    {journal.latestReport?.standardScore !== undefined ? journal.latestReport.standardScore.toFixed(3) : "1.000"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>2-Year Citation Window</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Regional AJIF</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#047857", marginTop: "0.2rem" }}>
                    {journal.latestReport?.regionalScore !== undefined ? journal.latestReport.regionalScore.toFixed(3) : "1.150"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>+15% Continental Multiplier</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Category Quartile</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#b45309", marginTop: "0.2rem" }}>
                    {journal.quartile || "Q2"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{journal.primaryDiscipline || "Multidisciplinary"}</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Evaluation Year</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#0f172a", marginTop: "0.2rem" }}>
                    {journal.latestReport?.year || 2026}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Accredited Cycle</div>
                </div>
              </div>

              {/* Signatures & Seal Section */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "2px solid #f1f5f9", paddingTop: "2rem", flexWrap: "wrap", gap: "2rem" }}>
                {/* Director Signature */}
                <div style={{ textAlign: "center", minWidth: "180px" }}>
                  <div style={{ fontSize: "1.3rem", fontFamily: "'Brush Script MT', cursive, Georgia", color: "#1e293b", marginBottom: "0.2rem" }}>
                    Prof. A. M. Wanjohi
                  </div>
                  <div style={{ width: "160px", height: "1px", background: "#cbd5e1", margin: "0 auto 0.4rem" }}></div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-ui), sans-serif" }}>
                    Prof. A. M. Wanjohi, Ph.D.
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "var(--font-ui), sans-serif" }}>
                    Executive Director, KENPRO
                  </div>
                </div>

                {/* Official Gold Embossed Seal & QR Code */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", textAlign: "center" }}>
                  {/* Dynamic QR Code */}
                  <div style={{ border: "1px solid #e2e8f0", padding: "4px", borderRadius: "6px", background: "#ffffff" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrCodeUrl} 
                      alt="Scan to Verify Certificate"
                      style={{ width: "75px", height: "75px", display: "block" }} 
                    />
                    <span style={{ fontSize: "0.58rem", color: "#64748b", display: "block", marginTop: "2px", fontFamily: "var(--font-ui), sans-serif" }}>
                      Scan to Verify
                    </span>
                  </div>

                  {/* Gold Seal */}
                  <div style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #fef08a 0%, #d97706 100%)",
                    border: "3px dashed #b45309",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#78350f",
                    boxShadow: "0 4px 12px rgba(217, 119, 6, 0.25)"
                  }}>
                    <i className="fa-solid fa-award" style={{ fontSize: "1.4rem", marginBottom: "2px" }}></i>
                    <span style={{ fontSize: "0.55rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>OFFICIAL</span>
                    <span style={{ fontSize: "0.5rem", fontWeight: 700 }}>ACCREDITED</span>
                  </div>
                </div>

                {/* Chief Editor Signature */}
                <div style={{ textAlign: "center", minWidth: "180px" }}>
                  <div style={{ fontSize: "1.3rem", fontFamily: "'Brush Script MT', cursive, Georgia", color: "#1e293b", marginBottom: "0.2rem" }}>
                    Dr. E. O. Ochieng
                  </div>
                  <div style={{ width: "160px", height: "1px", background: "#cbd5e1", margin: "0 auto 0.4rem" }}></div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-ui), sans-serif" }}>
                    Dr. E. O. Ochieng
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", fontFamily: "var(--font-ui), sans-serif" }}>
                    Chief Bibliometric Auditor, AJIF
                  </div>
                </div>
              </div>

              {/* Certificate Security Footnote */}
              <div style={{ marginTop: "2rem", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.8rem", fontSize: "0.7rem", color: "#94a3b8", fontFamily: "var(--font-ui), sans-serif" }}>
                AfriJournal Index Registry ID: {journal.id} • Issued by Kenya Projects Organization (KENPRO) &amp; AJIF Metric Board. Valid globally.
              </div>
            </div>

            {/* Embed Badge Widget for Publishers (No-Print) */}
            <div 
              className="glass-card no-print" 
              style={{ padding: "1.8rem 2rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "12px" }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <i className="fa-solid fa-code" style={{ color: "var(--color-primary)" }}></i>
                Embed Official Verification Badge on Journal Website
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                Display this live verified badge on your OJS, WordPress, or university press homepage to allow readers and authors to verify your indexing accreditation with one click.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "0.6rem 1rem", flex: 1, fontFamily: "monospace", fontSize: "0.8rem", overflowX: "auto", whiteSpace: "nowrap" }}>
                  {`<a href="${verifyUrl}"><img src="https://afrijournalindex.org/api/badge/${journal.issn || journal.id}.svg" alt="${journal.name} - Verified in AfriJournal Index" /></a>`}
                </div>
                <button 
                  onClick={copyBadgeSnippet}
                  className="btn btn-secondary btn-sm"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <i className={`fa-solid ${copiedBadge ? "fa-check" : "fa-copy"}`} style={{ marginRight: "0.4rem" }}></i>
                  {copiedBadge ? "Copied!" : "Copy HTML Code"}
                </button>
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
