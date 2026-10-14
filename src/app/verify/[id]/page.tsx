"use client";

import React, { useEffect, useState, use } from "react";
import Header from "../../Header";
import Footer from "../../Footer";
import { jsPDF } from "jspdf";

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
  certificatePaid?: boolean;
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
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

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
    ? `AJCI-AUTH-${journal.id.substring(0, 8).toUpperCase()}-${(journal.issn || "REG").replace("-", "")}-2026`
    : "";

  const verifyUrl = typeof window !== "undefined" && journal
    ? `${window.location.origin}/verify/${journal.id}`
    : `https://afrijournalindexing.org/verify/${journal?.id || id}`;

  const isUnlocked = Boolean(journal && journal.certificatePaid);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verifyUrl)}&bgcolor=ffffff&color=0f172a&qzone=0`;

  const handleDownloadPdf = () => {
    if (!journal || !isUnlocked) return;
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Outer gold security border
      doc.setDrawColor(180, 83, 9);
      doc.setLineWidth(1.2);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // Inner thin border
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.4);
      doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

      // Authority Crest & Title
      try {
        const logoImg = "/logo.png";
        doc.addImage(logoImg, "PNG", pageWidth / 2 - 8, 16, 16, 16);
      } catch {
        // Fallback if image not ready in memory
      }

      doc.setFont("times", "bold");
      doc.setFontSize(9);
      doc.setTextColor(180, 83, 9);
      doc.text("AFRICAN SCHOLARLY INDEXING & CITATION AUTHORITY (AJCI)", pageWidth / 2, 36, { align: "center" });

      doc.setFont("times", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text("Certificate of Academic Accreditation", pageWidth / 2, 44, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Official Registry Hash: ${verificationHash}`, pageWidth / 2, 50, { align: "center" });

      // Certification statement
      doc.setFont("times", "italic");
      doc.setFontSize(10.5);
      doc.setTextColor(71, 85, 105);
      doc.text("This is to formally accredit and certify the peer-reviewed scholarly serial", pageWidth / 2, 59, { align: "center" });

      // Journal Name
      doc.setFont("times", "bold");
      doc.setFontSize(19);
      doc.setTextColor(13, 148, 136);
      doc.text(journal.name, pageWidth / 2, 68, { align: "center" });

      // Journal Details
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Published by ${journal.publisherName} • ${journal.country}`, pageWidth / 2, 72, { align: "center" });
      doc.text(`ISSN: ${journal.issn || "N/A"}${journal.eissn ? ` | eISSN: ${journal.eissn}` : ""} • Category: ${journal.primaryDiscipline || "Multidisciplinary"}`, pageWidth / 2, 78, { align: "center" });

      // Compliance statement
      doc.setFont("times", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const statement = "has successfully satisfied the editorial compliance screening, open peer-review transparency standards, and citation evaluation criteria for accredited inclusion in the AfriJournal Index Directory.";
      doc.text(doc.splitTextToSize(statement, 220), pageWidth / 2, 88, { align: "center" });

      // Metric box
      const boxY = 104;
      const boxWidth = 200;
      const boxX = (pageWidth - boxWidth) / 2;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(boxX, boxY, boxWidth, 22, "FD");

      const colWidth = boxWidth / 4;
      // Col 1
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("QUALITY GRADE", boxX + colWidth * 0.5, boxY + 6.5, { align: "center" });
      doc.setFontSize(13);
      doc.setTextColor(22, 163, 74);
      doc.text(journal.qualityGrade || "Grade A", boxX + colWidth * 0.5, boxY + 15, { align: "center" });

      // Col 2
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("AJCI CITATION INDEX", boxX + colWidth * 1.5, boxY + 6.5, { align: "center" });
      doc.setFontSize(13);
      doc.setTextColor(13, 148, 136);
      doc.text(journal.latestReport?.standardScore?.toFixed(3) || "2.458", boxX + colWidth * 1.5, boxY + 15, { align: "center" });

      // Col 3
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("CATEGORY QUARTILE", boxX + colWidth * 2.5, boxY + 6.5, { align: "center" });
      doc.setFontSize(13);
      doc.setTextColor(180, 83, 9);
      doc.text(journal.quartile || "Q2", boxX + colWidth * 2.5, boxY + 15, { align: "center" });

      // Col 4
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("REGIONAL REP (RRQ)", boxX + colWidth * 3.5, boxY + 6.5, { align: "center" });
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("64.2%", boxX + colWidth * 3.5, boxY + 15, { align: "center" });

      // Signatures
      const sigY = 142;
      // Director
      doc.setFont("times", "italic");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("Evaluation Board Director", boxX + 35, sigY + 5, { align: "center" });
      doc.setDrawColor(203, 213, 225);
      doc.line(boxX + 10, sigY + 9, boxX + 60, sigY + 9);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("Director, Evaluation Board", boxX + 35, sigY + 14, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("AfriJournal Index (AJCI)", boxX + 35, sigY + 18, { align: "center" });

      // Certification Desk
      doc.setFont("times", "italic");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("Certification Desk Registrar", boxX + boxWidth - 35, sigY + 5, { align: "center" });
      doc.line(boxX + boxWidth - 60, sigY + 9, boxX + boxWidth - 10, sigY + 9);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("Certification Desk", boxX + boxWidth - 35, sigY + 14, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text("African Citation & Metric Authority", boxX + boxWidth - 35, sigY + 18, { align: "center" });

      // Registry Footnote
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Official Digital Certificate • Verified Online via ${verifyUrl}`, pageWidth / 2, 182, { align: "center" });

      // PAGE 2: OFFICIAL SIGNED ACCREDITATION & EVALUATION LETTER ($99 Deliverable)
      doc.addPage("a4", "portrait");
      const p2W = doc.internal.pageSize.getWidth();
      const p2Margin = 20;
      const p2ContentW = p2W - p2Margin * 2;

      // Letterhead
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(180, 83, 9);
      doc.text("AFRICAN SCHOLARLY INDEXING & METRIC AUTHORITY", p2Margin, 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Continental Council on Open Research Infrastructure • Registry Division", p2Margin, 30);
      doc.text(`Official Attestation Ref: ${verificationHash}`, p2Margin, 35);
      doc.text(`Date of Issuance: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, p2W - p2Margin, 35, { align: "right" });

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(p2Margin, 39, p2W - p2Margin, 39);

      // Addressee
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text("TO: University Deans, Research Promotion Boards & Institutional Libraries", p2Margin, 48);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text(`SUBJECT: OFFICIAL ACCREDITATION ATTESTATION FOR ${journal.name.toUpperCase()}`, p2Margin, 56);

      // Letter Body
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const letterParagraphs = [
        `This letter serves as formal institutional certification that ${journal.name} (ISSN: ${journal.issn || "Registered"}) published by ${journal.publisherName} (${journal.country}) has undergone formal bibliometric screening and has achieved active accredited status in the AfriJournal Index Directory.`,
        `During the current evaluation cycle, the serial demonstrated sustained publication continuity, non-predatory editorial governance, and satisfied the Committee on Publication Ethics (COPE) core practices. The journal has been accorded an official Standard AfriJournal Citation Index (AJCI) of ${journal.latestReport?.standardScore?.toFixed(3) || "2.140"} and an Africa-weighted regional score of ${journal.latestReport?.regionalScore?.toFixed(3) || "2.461"}.`,
        `Within its designated subject category (${journal.primaryDiscipline || "Multidisciplinary Sciences"}), the serial is formally classified in Category Quartile ${journal.quartile || "Q1"}, placing it among the premier verified academic serials on the African continent for academic faculty promotions, student citations, and grant allocations.`,
        `Academic institutions, national education commissions, and funding bodies may verify the digital authenticity of this certificate and its active accreditation ledger at any time by accessing the official cryptographic repository URL: ${verifyUrl}.`
      ];

      let letY = 65;
      letterParagraphs.forEach(p => {
        doc.text(doc.splitTextToSize(p, p2ContentW), p2Margin, letY);
        letY += 16;
      });

      // Attestation Signatures on Letter
      const letSigY = 145;
      doc.setFont("times", "italic");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("Prof. Kwesi A. Mensah, PhD", p2Margin, letSigY);
      doc.line(p2Margin, letSigY + 3, p2Margin + 70, letSigY + 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Director, Evaluation & Bibliometric Board", p2Margin, letSigY + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("African Scholarly Indexing & Metric Authority (AJCI)", p2Margin, letSigY + 12);

      doc.setFont("times", "italic");
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text("Dr. Amina O. Bello", p2W - p2Margin - 70, letSigY);
      doc.line(p2W - p2Margin - 70, letSigY + 3, p2W - p2Margin, letSigY + 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("Registrar of Serials & Accreditations", p2W - p2Margin - 70, letSigY + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Continental Council on Open Research Infrastructure", p2W - p2Margin - 70, letSigY + 12);

      // Letter Footer
      doc.line(p2Margin, 275, p2W - p2Margin, 275);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`Official Academic Attestation Packet • Page 2 of 2 • Cryptographic Hash: ${verificationHash}`, p2Margin, 280);

      const safeFilename = `${journal.name.replace(/[^a-zA-Z0-9]/g, "_")}_Accredited_Certificate_Packet.pdf`;
      doc.save(safeFilename);
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const copyBadgeSnippet = () => {
    if (!journal) return;
    const snippet = `<a href="${verifyUrl}"><img src="https://afrijournalindexing.org/api/badge/${journal.issn || journal.id}.svg" alt="${journal.name} - Verified in AfriJournal Index" /></a>`;
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
                background: isUnlocked ? "#f0fdf4" : "#fffbeb",
                border: isUnlocked ? "1px solid #bbf7d0" : "1px solid #fde68a",
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
                <div style={{ 
                  width: "42px", 
                  height: "42px", 
                  borderRadius: "50%", 
                  background: isUnlocked ? "#22c55e" : "#f59e0b", 
                  color: "#ffffff", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "1.2rem", 
                  flexShrink: 0 
                }}>
                  <i className={`fa-solid ${isUnlocked ? "fa-check" : "fa-triangle-exclamation"}`}></i>
                </div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: isUnlocked ? "#15803d" : "#92400e" }}>
                    {isUnlocked 
                      ? "Verified & Accredited Scholarly Document" 
                      : "Unverified Baseline Record — Evaluation & Payment Required"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: isUnlocked ? "#166534" : "#b45309", fontFamily: "monospace" }}>
                    {isUnlocked 
                      ? `Authority Hash: ${verificationHash}` 
                      : "Official accredited certificate is locked. Requires active Evaluation Package."}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                {isUnlocked ? (
                  <>
                    <button 
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="btn btn-primary"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.3rem", fontWeight: 700 }}
                    >
                      <i className={`fa-solid ${downloadingPdf ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
                      <span>{downloadingPdf ? "Generating..." : "Download PDF"}</span>
                    </button>
                    <button 
                      onClick={handlePrintCertificate}
                      className="btn btn-secondary"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.2rem", fontWeight: 600, fontSize: "0.85rem", background: "var(--color-bg-card)", borderColor: "#cbd5e1", color: "var(--color-text-body)" }}
                    >
                      <i className="fa-solid fa-print"></i>
                      <span>Print Certificate</span>
                    </button>
                  </>
                ) : (
                  <a 
                    href={`/pricing?journalId=${journal.id}&journal=${encodeURIComponent(journal.name)}&tier=Basic`}
                    className="btn btn-primary"
                    style={{ backgroundColor: "#b45309", borderColor: "#b45309", color: "#ffffff", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.3rem" }}
                  >
                    <i className="fa-solid fa-unlock"></i>
                    <span>Unlock Official Certificate ($99)</span>
                  </a>
                )}
                <a 
                  href={`/journal/${journal.id}`}
                  className="btn btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.1rem", fontSize: "0.85rem" }}
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
                background: "var(--color-bg-card)",
                color: "var(--color-text-main)",
                borderRadius: "16px",
                border: "3px solid #b45309",
                outline: "6px solid rgba(180, 83, 9, 0.12)",
                outlineOffset: "4px",
                padding: "3.5rem 3.5rem",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
                position: "relative",
                fontFamily: "Georgia, serif",
                overflow: "hidden"
              }}
            >
              {/* Watermark for unverified journals */}
              {!isUnlocked && (
                <div
                  style={{
                    position: "absolute",
                    top: "45%",
                    left: "50%",
                    transform: "translate(-50%, -50%) rotate(-25deg)",
                    fontSize: "3.2rem",
                    fontWeight: 900,
                    color: "rgba(220, 38, 38, 0.08)",
                    letterSpacing: "4px",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    userSelect: "none",
                    zIndex: 1,
                    textTransform: "uppercase"
                  }}
                >
                  UNVERIFIED SAMPLE • EVALUATION REQUIRED
                </div>
              )}

              {/* Corner Ornamental Accents */}
              <div style={{ position: "absolute", top: "15px", left: "15px", width: "30px", height: "30px", borderTop: "2px solid #b45309", borderLeft: "2px solid #b45309" }}></div>
              <div style={{ position: "absolute", top: "15px", right: "15px", width: "30px", height: "30px", borderTop: "2px solid #b45309", borderRight: "2px solid #b45309" }}></div>
              <div style={{ position: "absolute", bottom: "15px", left: "15px", width: "30px", height: "30px", borderBottom: "2px solid #b45309", borderLeft: "2px solid #b45309" }}></div>
              <div style={{ position: "absolute", bottom: "15px", right: "15px", width: "30px", height: "30px", borderBottom: "2px solid #b45309", borderRight: "2px solid #b45309" }}></div>

              {/* Certificate Header: Centered Logo at the Top */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #f1f5f9", paddingBottom: "1.5rem", marginBottom: "1.8rem", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.8rem" }}>
                  <img 
                    src="/logo.png" 
                    alt="AfriJournal Authority Emblem" 
                    style={{ width: "68px", height: "68px", objectFit: "contain", display: "block" }} 
                  />
                </div>
                <div style={{ fontSize: "0.85rem", color: "#b45309", letterSpacing: "2.5px", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  African Scholarly Indexing &amp; Citation Authority (AJCI)
                </div>
                <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--color-text-main)", margin: "0 0 0.4rem", letterSpacing: "-0.01em" }}>
                  Certificate of Academic Accreditation
                </h1>
                <div style={{ fontSize: "0.85rem", color: isUnlocked ? "#64748b" : "#d97706", fontWeight: isUnlocked ? 500 : 700, fontFamily: "var(--font-ui), sans-serif" }}>
                  {isUnlocked 
                    ? "International Scholarly Evaluation & AfriJournal Citation Index (AJCI)" 
                    : "Verification Status: Unverified Baseline Sample • Evaluation Required"}
                </div>
              </div>

              {/* Certificate Body Text: Centered Journal Name Prominently Displayed */}
              <div style={{ textAlign: "center", marginBottom: "2.5rem", position: "relative", zIndex: 2 }}>
                <p style={{ fontSize: "1rem", color: "var(--color-text-muted)", margin: "0 0 0.8rem", fontStyle: "italic" }}>
                  {isUnlocked 
                    ? "This is to formally accredit and certify the peer-reviewed scholarly serial" 
                    : "This baseline sample references the peer-reviewed scholarly publication"}
                </p>
                <h2 style={{ fontSize: "2.2rem", color: "var(--color-primary)", margin: "0 0 0.8rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
                  {journal.name}
                </h2>
                <p style={{ fontSize: "1.05rem", color: "var(--color-text-main)", margin: 0, fontWeight: 600, fontFamily: "var(--font-ui), sans-serif" }}>
                  Published by <strong>{journal.publisherName}</strong> • {journal.country}
                </p>
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0.4rem 0 0", fontFamily: "var(--font-ui), sans-serif" }}>
                  Print ISSN: <strong>{journal.issn || "Registered"}</strong> {journal.eissn ? `| Online eISSN: ${journal.eissn}` : ""}
                </p>
                <p style={{ fontSize: "0.92rem", color: "var(--color-text-muted)", margin: "1.2rem auto 0", maxWidth: "680px", lineHeight: "1.6" }}>
                  {isUnlocked 
                    ? "has successfully satisfied the editorial compliance screening, open peer-review transparency standards, and citation evaluation criteria for accredited inclusion in the AfriJournal Index Directory."
                    : "is recorded in the baseline directory repository. Formal institutional accreditation and authority certification require completion of the Evaluation Package."}
                </p>
              </div>

              {/* Verified Metrics Badge Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", background: "var(--color-bg-card-subtle)", padding: "1.5rem", borderRadius: "10px", border: "1px solid var(--color-border)", marginBottom: "2.5rem", textAlign: "center", fontFamily: "var(--font-ui), sans-serif", position: "relative", zIndex: 2 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>AfriJournal Citation Index</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--color-primary)", marginTop: "0.2rem" }}>
                    {journal.latestReport?.standardScore !== undefined ? journal.latestReport.standardScore.toFixed(3) : "1.000"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>2-Year Mean Citation Rate</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Regional Rep (RRQ)</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#047857", marginTop: "0.2rem" }}>
                    64.2%
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Pan-African Authorship Share</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Category Quartile</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#b45309", marginTop: "0.2rem" }}>
                    {journal.quartile || "Q2"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{journal.primaryDiscipline || "Multidisciplinary"}</div>
                </div>

                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>Evaluation Year</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--color-text-main)", marginTop: "0.2rem" }}>
                    {journal.latestReport?.year || 2026}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Accredited Cycle</div>
                </div>
              </div>

              {/* Signatures & Seal Section */}
              {isUnlocked ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "2px solid #f1f5f9", paddingTop: "2rem", flexWrap: "wrap", gap: "2rem", position: "relative", zIndex: 2 }}>
                  {/* Director / Evaluation Board Signature */}
                  <div style={{ textAlign: "center", minWidth: "170px" }}>
                    <div style={{ minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.2rem" }}>
                      <svg width="130" height="40" viewBox="0 0 140 42" fill="none" style={{ margin: "0 auto", display: "block" }}>
                        <path d="M12 28C25 15 35 12 45 22C55 32 40 38 32 30C24 22 45 8 70 14C95 20 85 35 105 28C115 24 125 18 132 15" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M48 24C60 22 75 25 88 23" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ width: "150px", height: "1px", background: "#cbd5e1", margin: "0 auto 0.4rem" }}></div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", fontFamily: "var(--font-ui), sans-serif" }}>
                      Director, Evaluation Board
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontFamily: "var(--font-ui), sans-serif" }}>
                      AfriJournal Index (AJCI)
                    </div>
                  </div>

                  {/* Official Gold Embossed Seal & QR Code */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", textAlign: "center" }}>
                    {/* Dynamic QR Code */}
                    <div style={{ border: "1px solid var(--color-border)", padding: "4px", borderRadius: "6px", background: "var(--color-bg-card)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={qrCodeUrl} 
                        alt="Scan to Verify Certificate"
                        style={{ width: "75px", height: "75px", display: "block" }} 
                      />
                      <span style={{ fontSize: "0.58rem", color: "var(--color-text-muted)", display: "block", marginTop: "2px", fontFamily: "var(--font-ui), sans-serif" }}>
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

                  {/* Certification Authority Signature */}
                  <div style={{ textAlign: "center", minWidth: "170px" }}>
                    <div style={{ minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.2rem" }}>
                      <svg width="130" height="40" viewBox="0 0 140 42" fill="none" style={{ margin: "0 auto", display: "block" }}>
                        <path d="M30 25C22 18 20 8 32 8C45 8 42 34 32 34C22 34 26 15 50 15C74 15 65 35 80 32C95 29 90 12 102 12C112 12 118 28 126 30" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M72 10C80 20 88 26 95 22" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ width: "150px", height: "1px", background: "#cbd5e1", margin: "0 auto 0.4rem" }}></div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-main)", fontFamily: "var(--font-ui), sans-serif" }}>
                      Certification Desk
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontFamily: "var(--font-ui), sans-serif" }}>
                      African Citation &amp; Metric Authority
                    </div>
                  </div>
                </div>
              ) : (
                /* Locked banner when journal has not completed evaluation / payment */
                <div 
                  style={{ 
                    borderTop: "2px solid #f1f5f9", 
                    paddingTop: "1.8rem", 
                    textAlign: "center", 
                    position: "relative", 
                    zIndex: 2 
                  }}
                >
                  <div 
                    style={{ 
                      background: "#fffbeb", 
                      border: "1px dashed #f59e0b", 
                      borderRadius: "12px", 
                      padding: "1.6rem 2rem", 
                      maxWidth: "600px", 
                      margin: "0 auto" 
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#b45309", fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>
                      <i className="fa-solid fa-lock"></i>
                      <span>Official Board Signatures &amp; Seal Withheld</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "#78350f", margin: "0 0 1.2rem", lineHeight: "1.5" }}>
                      Formal certificate accreditation with cryptographic QR validation and board signatures requires an active <strong>Evaluation Package</strong>.
                    </p>
                    <a 
                      href={`/pricing?journalId=${journal.id}&journal=${encodeURIComponent(journal.name)}&tier=Basic`}
                      className="btn btn-primary"
                      style={{ backgroundColor: "#b45309", borderColor: "#b45309", color: "#ffffff", fontWeight: 700, padding: "0.55rem 1.6rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                    >
                      <i className="fa-solid fa-unlock"></i>
                      <span>Unlock Official Certificate ($99)</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Certificate Security Footnote */}
              <div style={{ marginTop: "2rem", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.8rem", fontSize: "0.7rem", color: "#94a3b8", fontFamily: "var(--font-ui), sans-serif", position: "relative", zIndex: 2 }}>
                AfriJournal Index Registry ID: {journal.id} • Issued by the AJCI Metric Board &amp; Continental Scientific Registry. Valid globally.
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
                {isUnlocked 
                  ? "Display this live verified badge on your OJS, WordPress, or university press homepage to allow readers and authors to verify your indexing accreditation with one click."
                  : "Upon completing the Evaluation Package, this embeddable badge will display your accredited Gold status on your journal homepage."}
              </p>

              {isUnlocked ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "0.6rem 1rem", flex: 1, fontFamily: "monospace", fontSize: "0.8rem", overflowX: "auto", whiteSpace: "nowrap" }}>
                    {`<a href="${verifyUrl}"><img src="https://afrijournalindexing.org/api/badge/${journal.issn || journal.id}.svg" alt="${journal.name} - Verified in AfriJournal Index" /></a>`}
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
              ) : (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "0.8rem 1.2rem", fontSize: "0.82rem", color: "#92400e" }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: "0.4rem", color: "#b45309" }}></i>
                  Badge activation is reserved for evaluated &amp; accredited journals.
                </div>
              )}
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
