"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../Header";
import Footer from "../../Footer";
import { useLang } from "../../LangContext";

const DISCIPLINES = [
  "Agricultural & Biological Sciences",
  "Arts & Humanities",
  "Biochemistry, Genetics & Molecular Biology",
  "Business, Management & Accounting",
  "Chemical Engineering",
  "Chemistry",
  "Computer Science & Informatics",
  "Earth & Planetary Sciences",
  "Economics, Econometrics & Finance",
  "Energy & Power Systems",
  "Engineering & Technology",
  "Environmental Science",
  "Health Professions & Nursing",
  "Immunology & Microbiology",
  "Materials Science",
  "Mathematics & Statistics",
  "Medicine & Public Health",
  "Neuroscience",
  "Pharmacology, Toxicology & Pharmaceutics",
  "Physics & Astronomy",
  "Psychology & Behavioral Sciences",
  "Social Sciences, Education & Law"
];

function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const code = countryCode.toUpperCase();
  try {
    const codePoints = [...code].map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌍";
  }
}

function UnifiedReviewerPortalContent() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [discipline, setDiscipline] = useState(DISCIPLINES[0]);
  const [targetJournal, setTargetJournal] = useState("");
  const [excludedAuthors, setExcludedAuthors] = useState("");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Matchmaker Search State
  const [searchingReviewers, setSearchingReviewers] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [testOnSameAccount, setTestOnSameAccount] = useState(false);
  const PAGE_SIZE = 5;

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth Check
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    checkAuth();
  }, []);

  // Search Reviewers from OpenAlex via /api/referee-finder
  const handleSearchReviewers = async () => {
    if (!title.trim() && !abstract.trim()) {
      setError("Please provide a manuscript title or abstract to extract matching reviewers.");
      return;
    }

    setSearchingReviewers(true);
    setError(null);

    try {
      const excludedList = excludedAuthors
        .split(/[,\n]/)
        .map(a => a.trim())
        .filter(Boolean);

      const res = await fetch("/api/referee-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          abstract: abstract.trim(),
          excludedAuthors: excludedList,
          region: "african",
          yearWindow: 3
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to search for reviewer candidates.");
      }

      setCandidates(data.candidates || []);
      setKeywords(data.queryKeywords || []);
      setCurrentPage(1);

      if (data.candidates && data.candidates.length > 0) {
        setExpandedIds({ [data.candidates[0].id]: true });
      }
    } catch (err: any) {
      setError(err.message || "Could not retrieve reviewer matches.");
    } finally {
      setSearchingReviewers(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("File exceeds maximum allowed size of 25MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploading(true);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      setUploadProgress(60);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload manuscript file.");
      }

      setFileUrl(data.url);
      setUploadProgress(100);
    } catch (err: any) {
      setError(err.message || "File upload failed.");
      setFile(null);
      setFileUrl("");
    } finally {
      setUploading(false);
    }
  };

  const toggleSelectReviewer = (candidate: any) => {
    if (selectedReviewers.some(r => r.id === candidate.id)) {
      setSelectedReviewers(selectedReviewers.filter(r => r.id !== candidate.id));
    } else {
      setSelectedReviewers([
        ...selectedReviewers,
        {
          id: candidate.id,
          name: candidate.name,
          institution: candidate.institution,
          country: candidate.country,
          orcid: candidate.orcid
        }
      ]);
    }
  };

  const copyReviewerDetails = (candidate: any) => {
    const worksText = (candidate.recentWorks || [])
      .map((w: any) => `  • "${w.title}" — ${w.venue} (${w.year})${w.doi ? ` [DOI: ${w.doi}]` : ""}`)
      .join("\n");

    const text = `Reviewer Recommendation:
Name: ${candidate.name}
Institution: ${candidate.institution} (${candidate.country})
${candidate.orcid ? `ORCID: https://orcid.org/${candidate.orcid}\n` : ""}Recent Publications in Topic:
${worksText || "  • Verified peer-reviewed works"}
Source: AfriJournal Index Reviewer Portal`;

    navigator.clipboard.writeText(text);
    setCopiedId(candidate.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const exportCsv = () => {
    if (candidates.length === 0) return;
    const headers = ["Name", "Institution", "Country", "ORCID", "Regional Focus", "Topic Publications Count", "Sample Publication Title", "DOI"];
    const rows = candidates.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.institution.replace(/"/g, '""')}"`,
      `"${c.country.replace(/"/g, '""')}"`,
      c.orcid ? `"${c.orcid}"` : `""`,
      c.isAfrican ? `"African Institution"` : `"International"`,
      c.publicationCount,
      c.recentWorks[0] ? `"${c.recentWorks[0].title.replace(/"/g, '""')}"` : `""`,
      c.recentWorks[0]?.doi ? `"${c.recentWorks[0].doi}"` : `""`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reviewer_shortlist_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Please log in to your AfriJournal account before lodging a manuscript.");
      return;
    }

    if (!title.trim()) {
      setError("Please provide a manuscript title.");
      return;
    }

    if (!abstract.trim()) {
      setError("Please provide a manuscript abstract.");
      return;
    }

    if (!fileUrl) {
      setError("Please upload your blinded manuscript file (.pdf or .docx) before lodging.");
      return;
    }

    if (selectedReviewers.length === 0 && !testOnSameAccount) {
      setError("Please match and select at least 1 reviewer from the matchmaker on the right (or enable test on my account) before lodging.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          abstract: abstract.trim(),
          discipline,
          targetJournal: targetJournal.trim() || null,
          manuscriptFileUrl: fileUrl,
          excludedReviewers: excludedAuthors.trim() || null,
          selectedReviewers: selectedReviewers.length > 0 ? selectedReviewers : null,
          testOnSameAccount
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit manuscript.");
      }

      router.push(`/review/track/${data.trackingCode}`);
    } catch (err: any) {
      setError(err.message || "An error occurred while lodging manuscript.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)", color: "var(--color-text-main)" }}>
      <Header activePage="review" />

      <main style={{ flex: 1, padding: "2rem 1.5rem 6rem", maxWidth: "1400px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
          <Link href="/" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/services" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Services</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text-main)", fontWeight: 600 }}>Reviewer Portal</span>
        </div>

        {/* Clean Header Banner */}
        <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "1.75rem 2rem", marginBottom: "2rem", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--color-primary-light)", color: "var(--color-primary)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>
                <i className="fa-solid fa-file-shield"></i>
                Unified Academic Reviewer Portal &amp; Matchmaker
              </div>
              <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.4rem", lineHeight: 1.25 }}>
                Manuscript Peer Review Lodging &amp; Reviewer Matching
              </h1>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", margin: 0, maxWidth: "780px", lineHeight: 1.55 }}>
                Enter your manuscript details once. Our concept engine identifies active African scholars in your sub-discipline, while the automated cascading system manages 48-hour review invitations and double-blind evaluations.
              </p>
            </div>

            {candidates.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="btn btn-secondary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", padding: "0.45rem 1rem", fontWeight: 600 }}
              >
                <i className="fa-solid fa-file-csv" style={{ color: "var(--color-primary)" }}></i>
                <span>Export Reviewer List (CSV)</span>
              </button>
            )}
          </div>
        </div>

        {/* Auth Notice if Guest */}
        {!loadingUser && !currentUser && (
          <div style={{ background: "var(--color-primary-light)", border: "1px solid rgba(180, 83, 9, 0.25)", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <i className="fa-solid fa-circle-info" style={{ color: "var(--color-primary)", fontSize: "1.3rem" }}></i>
              <div>
                <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.92rem" }}>AfriJournal Account Required to Lodge</div>
                <div style={{ color: "var(--color-text-body)", fontSize: "0.82rem" }}>Log in so your evaluation report and certificates are securely linked to your profile.</div>
              </div>
            </div>
            <Link href="/login?redirect=/review/submit" className="btn btn-primary btn-sm" style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>
              Sign In to Lodge
            </Link>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.9rem 1.2rem", color: "#b91c1c", fontSize: "0.88rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Unified Split-Screen Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(340px, 460px) 1fr", gap: "2rem", alignItems: "start" }}>
          
          {/* ================= LEFT COLUMN: INTAKE & LODGING FORM ================= */}
          <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "1.4rem", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fa-solid fa-file-lines" style={{ color: "var(--color-primary)" }}></i>
              <span>1. Manuscript Intake</span>
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div style={{ marginBottom: "0.85rem" }}>
                <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.25rem" }}>
                  Manuscript Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Assessing Renewable Energy Adoption in Sub-Saharan Africa"
                  required
                  style={{ width: "100%", padding: "0.55rem 0.75rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.86rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Discipline */}
              <div style={{ marginBottom: "0.85rem" }}>
                <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.25rem" }}>
                  Academic Discipline <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.86rem", outline: "none", boxSizing: "border-box" }}
                >
                  {DISCIPLINES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Abstract */}
              <div style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <label style={{ color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.84rem" }}>
                    Abstract <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                    {abstract.trim() ? `${abstract.trim().split(/\s+/).length} words` : "Required"}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Paste abstract here. It powers the live concept extractor to find specialist reviewers..."
                  required
                  style={{ width: "100%", padding: "0.55rem 0.75rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.84rem", outline: "none", boxSizing: "border-box", lineHeight: 1.45 }}
                />

                {/* Match Reviewers Trigger */}
                <button
                  type="button"
                  onClick={handleSearchReviewers}
                  disabled={searchingReviewers || (!title.trim() && !abstract.trim())}
                  className="btn btn-secondary btn-sm"
                  style={{ width: "100%", marginTop: "0.45rem", padding: "0.4rem", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  {searchingReviewers ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Searching Active African Specialists...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--color-primary)" }}></i>
                      <span>Match Reviewers from Title &amp; Abstract</span>
                    </>
                  )}
                </button>
              </div>

              {/* Document Upload */}
              <div style={{ marginBottom: "0.85rem" }}>
                <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.84rem", marginBottom: "0.25rem" }}>
                  Blinded Manuscript Document (.PDF, .DOCX) <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ border: "2px dashed var(--color-border)", borderRadius: "8px", padding: "0.85rem 1rem", textAlign: "center", background: "var(--color-bg-card-subtle)" }}>
                  <input
                    type="file"
                    id="manuscript-file-portal"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="manuscript-file-portal" style={{ cursor: "pointer", display: "inline-block" }}>
                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "1.3rem", color: "var(--color-primary)", marginBottom: "0.2rem" }}></i>
                    <div style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "0.84rem" }}>
                      {file ? file.name : "Click to select manuscript file"}
                    </div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "0.72rem", marginTop: "1px" }}>
                      PDF or Word (max 25MB)
                    </div>
                  </label>

                  {uploading && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div style={{ fontSize: "0.74rem", color: "var(--color-primary)", marginBottom: "2px" }}>Uploading ({uploadProgress}%)...</div>
                      <div style={{ width: "100%", height: "4px", background: "var(--color-border)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--color-primary)", transition: "width 0.3s" }}></div>
                      </div>
                    </div>
                  )}

                  {fileUrl && !uploading && (
                    <div style={{ marginTop: "0.45rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--color-accent-green)", fontSize: "0.76rem", fontWeight: 700 }}>
                        <i className="fa-solid fa-circle-check"></i> Document ready
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setFileUrl("");
                          const inp = document.getElementById("manuscript-file-portal") as HTMLInputElement;
                          if (inp) inp.value = "";
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.72rem", padding: "1px 6px", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "4px" }}
                      >
                        <i className="fa-solid fa-trash-can"></i> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsed Optional Settings (COI & Target Venue) */}
              <details style={{ marginBottom: "0.85rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.45rem 0.75rem" }}>
                <summary style={{ cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                  + Optional Conflict of Interest / Venue Settings
                </summary>
                <div style={{ marginTop: "0.6rem" }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 600, fontSize: "0.78rem", marginBottom: "0.2rem" }}>
                      Exclude Scholars (Conflict of Interest)
                    </label>
                    <input
                      type="text"
                      value={excludedAuthors}
                      onChange={(e) => setExcludedAuthors(e.target.value)}
                      placeholder="e.g. Prof. Sarah Ochieng, John Kamau"
                      style={{ width: "100%", padding: "0.45rem 0.65rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "var(--color-text-main)", fontWeight: 600, fontSize: "0.78rem", marginBottom: "0.2rem" }}>
                      Target Publication Venue
                    </label>
                    <input
                      type="text"
                      value={targetJournal}
                      onChange={(e) => setTargetJournal(e.target.value)}
                      placeholder="e.g. African Journal of Economic Policy"
                      style={{ width: "100%", padding: "0.45rem 0.65rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "6px", color: "var(--color-text-main)", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </details>

              {/* Dev / Test mode toggle */}
              <div style={{ marginBottom: "1rem", padding: "0.6rem 0.75rem", background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", borderRadius: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-main)" }}>
                  <input
                    type="checkbox"
                    checked={testOnSameAccount}
                    onChange={(e) => setTestOnSameAccount(e.target.checked)}
                    style={{ width: "15px", height: "15px", accentColor: "var(--color-primary)" }}
                  />
                  <span>Test review on my account (Assign invitation to current logged-in user)</span>
                </label>
              </div>

              {/* Submit Action */}
              {!fileUrl && (
                <div style={{ fontSize: "0.76rem", color: "var(--color-primary)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="fa-solid fa-circle-info"></i>
                  <span>Upload a manuscript file above to proceed with lodging.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || uploading}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", fontWeight: 700, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: (submitting || uploading) ? "not-allowed" : "pointer", opacity: (submitting || uploading) ? 0.6 : 1 }}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Lodging Manuscript &amp; Cascading...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Lodge Manuscript for Peer Review</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ================= RIGHT COLUMN: REVIEWER MATCHMAKER ================= */}
          <div>
            {/* Selected Queue Status Bar */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: selectedReviewers.length > 0 ? "0.75rem" : 0 }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <i className="fa-solid fa-user-check" style={{ color: "var(--color-primary)" }}></i>
                    Reviewer Queue &amp; Sequential Cascade
                  </h3>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    Each invited reviewer gets 48 hours to accept. If declined, the system auto-cascades to the next candidate.
                  </div>
                </div>

                <span style={{ fontSize: "0.8rem", padding: "3px 10px", borderRadius: "20px", background: selectedReviewers.length > 0 ? "var(--color-primary-light)" : "var(--color-bg-card-subtle)", color: selectedReviewers.length > 0 ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: 700 }}>
                  {selectedReviewers.length > 0 ? `${selectedReviewers.length} Selected Candidates` : "Autonomous Smart-Match Active"}
                </span>
              </div>

              {selectedReviewers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
                  {selectedReviewers.map((r, idx) => (
                    <div key={idx} style={{ background: "var(--color-bg-card-subtle)", border: "1px solid var(--color-border)", padding: "4px 10px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem" }}>
                      <span style={{ fontWeight: 700, color: "var(--color-text-main)" }}>#{idx + 1} {r.name}</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.74rem" }}>({r.country || r.institution})</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectReviewer(r)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0 2px" }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extracted Concepts */}
            {keywords.length > 0 && (
              <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)" }}>
                  Extracted Concepts:
                </span>
                {keywords.map((kw, i) => (
                  <span key={i} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", color: "var(--color-text-main)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Candidate List */}
            {searchingReviewers ? (
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "3rem 1.5rem", textAlign: "center" }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "1.8rem", color: "var(--color-primary)", marginBottom: "0.75rem" }}></i>
                <div style={{ color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.95rem" }}>Extracting Subject Concepts &amp; Querying African Academic Registry...</div>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>Searching verified scholars with recent peer-reviewed publications.</div>
              </div>
            ) : candidates.length === 0 ? (
              /* Initial State / Explainer */
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "2.5rem 2rem", textAlign: "center" }}>
                <i className="fa-solid fa-users-viewfinder" style={{ fontSize: "2.2rem", color: "var(--color-primary)", marginBottom: "1rem" }}></i>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.5rem" }}>
                  Live Reviewer Matchmaker
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", maxWidth: "540px", margin: "0 auto 1.5rem", lineHeight: 1.55 }}>
                  Once you type your manuscript title and abstract, click <strong>"Match Reviewers"</strong> to instantly discover active African scholars matching your exact research methodology.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", textAlign: "left", borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-body)" }}>
                    <strong style={{ display: "block", color: "var(--color-text-main)", marginBottom: "2px" }}><i className="fa-solid fa-shield-halved" style={{ color: "var(--color-primary)", marginRight: "4px" }}></i> COI Protection</strong>
                    Excludes institutional co-affiliations and known co-authors automatically.
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-body)" }}>
                    <strong style={{ display: "block", color: "var(--color-text-main)", marginBottom: "2px" }}><i className="fa-solid fa-clock" style={{ color: "var(--color-primary)", marginRight: "4px" }}></i> 48-Hour Cascade</strong>
                    Guarantees rapid response; invites are dispatched sequentially.
                  </div>
                </div>
              </div>
            ) : (
              /* Reviewer Candidate Cards */
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(() => {
                  const totalPages = Math.ceil(candidates.length / PAGE_SIZE) || 1;
                  const paginatedCandidates = candidates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

                  return (
                    <>
                      {paginatedCandidates.map((c) => {
                        const isSelected = selectedReviewers.some(r => r.id === c.id);
                        const isExpanded = !!expandedIds[c.id];
                        const flag = getCountryFlag(c.countryCode);
                        const mostRecentYear = c.recentWorks?.[0]?.year;

                        return (
                          <div
                            key={c.id}
                            style={{
                              background: "var(--color-bg-card)",
                              border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                              borderRadius: "12px",
                              padding: "1.25rem",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "0.5rem" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                                    {c.name}
                                  </h4>
                                  {mostRecentYear && (
                                    <span style={{ fontSize: "0.72rem", padding: "1px 7px", borderRadius: "10px", background: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 700 }}>
                                      Active {mostRecentYear}
                                    </span>
                                  )}
                                  {c.orcid && (
                                    <a
                                      href={`https://orcid.org/${c.orcid}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", color: "#059669", background: "rgba(5, 150, 105, 0.1)", border: "1px solid rgba(5, 150, 105, 0.25)", padding: "1px 6px", borderRadius: "10px", textDecoration: "none", fontWeight: 600 }}
                                    >
                                      <i className="fa-brands fa-orcid"></i> {c.orcid}
                                    </a>
                                  )}
                                </div>
                                <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "3px" }}>
                                  <span>{flag} </span>
                                  <strong style={{ color: "var(--color-text-body)" }}>{c.institution}</strong> ({c.country})
                                </div>
                              </div>

                              {/* Candidate Actions */}
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <button
                                  type="button"
                                  onClick={() => toggleSelectReviewer(c)}
                                  className={isSelected ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                                  style={{ fontSize: "0.76rem", padding: "0.35rem 0.75rem", fontWeight: 700, borderRadius: "6px" }}
                                >
                                  <i className={isSelected ? "fa-solid fa-check" : "fa-solid fa-plus"}></i>
                                  <span>{isSelected ? "Selected" : "Select Reviewer"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyReviewerDetails(c)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: "0.76rem", padding: "0.35rem 0.65rem", borderRadius: "6px" }}
                                  title="Copy scholar details"
                                >
                                  <i className={`fa-solid ${copiedId === c.id ? "fa-check" : "fa-copy"}`} style={{ color: copiedId === c.id ? "#059669" : "var(--color-primary)" }}></i>
                                </button>
                              </div>
                            </div>

                            {/* Recent Works Accordion */}
                            {c.recentWorks && c.recentWorks.length > 0 && (
                              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                                <button
                                  type="button"
                                  onClick={() => setExpandedIds(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                                  style={{ background: "none", border: "none", padding: "2px 0", cursor: "pointer", fontSize: "0.76rem", fontWeight: 700, color: "var(--color-primary)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                >
                                  <span>{isExpanded ? `Hide ${c.recentWorks.length} Relevant Papers` : `View ${c.recentWorks.length} Relevant Papers in Topic`}</span>
                                  <i className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ fontSize: "0.65rem" }}></i>
                                </button>

                                {isExpanded && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.4rem" }}>
                                    {c.recentWorks.map((work: any, idx: number) => (
                                      <div key={idx} style={{ fontSize: "0.78rem", color: "var(--color-text-body)", lineHeight: 1.4, display: "flex", alignItems: "flex-start", gap: "4px" }}>
                                        <i className="fa-solid fa-angle-right" style={{ color: "var(--color-primary)", marginTop: "3px", fontSize: "0.62rem" }}></i>
                                        <div>
                                          <span style={{ fontWeight: 600 }}>{work.title}</span>
                                          <span style={{ color: "var(--color-text-muted)" }}> — {work.venue} ({work.year})</span>
                                          {work.doi && (
                                            <a href={work.url || `https://doi.org/${work.doi}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)", marginLeft: "4px", textDecoration: "none", fontSize: "0.72rem" }}>
                                              [DOI]
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {totalPages > 1 && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", padding: "0.75rem 1rem", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "10px" }}>
                          <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", cursor: currentPage <= 1 ? "not-allowed" : "pointer", opacity: currentPage <= 1 ? 0.5 : 1 }}
                          >
                            &larr; Previous
                          </button>
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
                            Page {currentPage} of {totalPages} ({candidates.length} scholars found)
                          </span>
                          <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", cursor: currentPage >= totalPages ? "not-allowed" : "pointer", opacity: currentPage >= totalPages ? 0.5 : 1 }}
                          >
                            Next &rarr;
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ReviewSubmitPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--color-bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Reviewer Portal...</div>}>
      <UnifiedReviewerPortalContent />
    </Suspense>
  );
}
