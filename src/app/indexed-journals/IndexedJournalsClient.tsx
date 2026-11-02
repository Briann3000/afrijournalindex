"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Header from "../Header";
import Footer from "../Footer";
import { ALL_AFRICAN_COUNTRIES } from "../data/african-countries";

export interface JournalRecord {
  id: string;
  name: string;
  issn: string | null;
  eissn: string | null;
  publisherName: string | null;
  country: string | null;
  frequency: string | null;
  websiteUrl: string | null;
  qualityGrade: string | null;
  isIndexed: boolean;
}

interface Props {
  initialJournals: JournalRecord[];
}

export default function IndexedJournalsClient({ initialJournals }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDownloadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Map African countries for fast flag lookup
  const flagMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of ALL_AFRICAN_COUNTRIES) {
      map.set(c.name.toLowerCase(), c.flag);
    }
    return map;
  }, []);

  const getCountryFlag = (countryName: string | null) => {
    if (!countryName) return "🌍";
    return flagMap.get(countryName.toLowerCase()) || "🌍";
  };

  // Filter journals based on real-time search term
  const filteredJournals = useMemo(() => {
    if (!searchTerm.trim()) return initialJournals;
    const q = searchTerm.trim().toLowerCase();
    return initialJournals.filter((j) => {
      const nameMatch = j.name?.toLowerCase().includes(q);
      const issnMatch = j.issn?.toLowerCase().includes(q);
      const eissnMatch = j.eissn?.toLowerCase().includes(q);
      const pubMatch = j.publisherName?.toLowerCase().includes(q);
      const countryMatch = j.country?.toLowerCase().includes(q);
      return nameMatch || issnMatch || eissnMatch || pubMatch || countryMatch;
    });
  }, [initialJournals, searchTerm]);

  // Export to CSV
  const handleDownloadCSV = () => {
    setIsDownloadOpen(false);
    const headers = [
      "#",
      "Journal Title",
      "Print ISSN",
      "Electronic e-ISSN",
      "Country",
      "Publisher",
      "Frequency",
      "Official Website",
    ];

    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = filteredJournals.map((j, idx) => [
      idx + 1,
      escapeCsv(j.name),
      escapeCsv(j.issn || "—"),
      escapeCsv(j.eissn || "—"),
      escapeCsv(j.country || "—"),
      escapeCsv(j.publisherName || "—"),
      escapeCsv(j.frequency || "—"),
      escapeCsv(j.websiteUrl || "—"),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `afrijournal-indexed-journals.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const handleDownloadJSON = () => {
    setIsDownloadOpen(false);
    const exportData = filteredJournals.map((j, idx) => ({
      number: idx + 1,
      name: j.name,
      issn: j.issn || null,
      eissn: j.eissn || null,
      country: j.country || null,
      publisher: j.publisherName || null,
      frequency: j.frequency || null,
      websiteUrl: j.websiteUrl || null,
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `afrijournal-indexed-journals.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg-base)" }}>
      <Header activePage="browse" />

      <main style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: "1400px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {/* Page Top Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.35rem" }}>
            <i className="fa-solid fa-table-list"></i>
            <span>Master Directory</span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 0.4rem", letterSpacing: "-0.5px" }}>
            Indexed Journals List
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", maxWidth: "800px", margin: 0, lineHeight: 1.5 }}>
            Master directory of African academic and peer-reviewed journals currently indexed in AfriJournal Index. Search or download raw records in CSV and JSON formats.
          </p>
        </div>

        {/* Clean Controls Bar (Search + Count + Download Dropdown) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            padding: "0.9rem 1.1rem",
            marginBottom: "1.5rem",
          }}
        >
          {/* Real-time Search Box */}
          <div style={{ position: "relative", flex: "1 1 320px", maxWidth: "550px" }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                fontSize: "0.9rem",
              }}
            ></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, ISSN, publisher, or country..."
              style={{
                width: "100%",
                height: "40px",
                padding: "0 2.2rem 0 2.4rem",
                borderRadius: "7px",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-base)",
                fontSize: "0.88rem",
                color: "var(--color-text-main)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                title="Clear search"
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Action Area: Count & Download Button with Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
              Showing <strong style={{ color: "var(--color-text-main)" }}>{filteredJournals.length}</strong> {filteredJournals.length === 1 ? "journal" : "journals"}
              {searchTerm && ` (of ${initialJournals.length} total)`}
            </div>

            {/* Download Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsDownloadOpen((prev) => !prev)}
                className="btn btn-primary"
                style={{
                  height: "40px",
                  padding: "0 1.1rem",
                  borderRadius: "7px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: "pointer",
                }}
              >
                <i className="fa-solid fa-download"></i>
                <span>Download</span>
                <i
                  className="fa-solid fa-chevron-down"
                  style={{
                    fontSize: "0.7rem",
                    transition: "transform 0.2s ease",
                    transform: isDownloadOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                ></i>
              </button>

              {isDownloadOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 6px)",
                    minWidth: "200px",
                    background: "#181820",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "8px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                    padding: "0.4rem 0",
                    zIndex: 100,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    style={{
                      width: "100%",
                      padding: "0.6rem 1rem",
                      background: "none",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <i className="fa-solid fa-file-csv" style={{ color: "#10b981", width: "16px" }}></i>
                    <span>Download CSV (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJSON}
                    style={{
                      width: "100%",
                      padding: "0.6rem 1rem",
                      background: "none",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <i className="fa-solid fa-file-code" style={{ color: "#38bdf8", width: "16px" }}></i>
                    <span>Download JSON (.json)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Raw Data Table */}
        <div
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--color-bg-card-subtle)",
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "0.85rem 0.75rem", textAlign: "center", width: "50px" }}>#</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Journal Title</th>
                  <th style={{ padding: "0.85rem 0.75rem", width: "120px" }}>Print ISSN</th>
                  <th style={{ padding: "0.85rem 0.75rem", width: "120px" }}>Online e-ISSN</th>
                  <th style={{ padding: "0.85rem 1rem", width: "160px" }}>Country</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Publisher</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center", width: "100px" }}>Website</th>
                </tr>
              </thead>
              <tbody>
                {filteredJournals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "3rem 1rem",
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      <i className="fa-solid fa-inbox" style={{ fontSize: "2rem", marginBottom: "0.5rem", display: "block", opacity: 0.5 }}></i>
                      <div>No indexed journals match your search query.</div>
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm("")}
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: "0.75rem" }}
                        >
                          Clear Search
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map((journal, idx) => {
                    const journalSlug = journal.issn || journal.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    return (
                      <tr
                        key={journal.id || idx}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          background: idx % 2 === 0 ? "transparent" : "var(--color-bg-card-subtle)",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Numbering */}
                        <td
                          style={{
                            padding: "0.85rem 0.75rem",
                            textAlign: "center",
                            fontWeight: 700,
                            color: "var(--color-text-muted)",
                            fontSize: "0.8rem",
                          }}
                        >
                          {idx + 1}
                        </td>

                        {/* Title */}
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <Link
                            href={`/journal/${journalSlug}`}
                            style={{
                              color: "var(--color-primary)",
                              fontWeight: 700,
                              textDecoration: "none",
                              fontSize: "0.9rem",
                            }}
                          >
                            {journal.name}
                          </Link>
                          {journal.frequency && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                              {journal.frequency}
                            </div>
                          )}
                        </td>

                        {/* Print ISSN */}
                        <td
                          style={{
                            padding: "0.85rem 0.75rem",
                            fontFamily: "monospace",
                            fontWeight: 600,
                            color: "var(--color-text-main)",
                          }}
                        >
                          {journal.issn || "—"}
                        </td>

                        {/* Online e-ISSN */}
                        <td
                          style={{
                            padding: "0.85rem 0.75rem",
                            fontFamily: "monospace",
                            fontWeight: 600,
                            color: "var(--color-text-main)",
                          }}
                        >
                          {journal.eissn || "—"}
                        </td>

                        {/* Country */}
                        <td style={{ padding: "0.85rem 1rem", color: "var(--color-text-main)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <span>{getCountryFlag(journal.country)}</span>
                            <span>{journal.country || "—"}</span>
                          </span>
                        </td>

                        {/* Publisher */}
                        <td style={{ padding: "0.85rem 1rem", color: "var(--color-text-muted)" }}>
                          {journal.publisherName || "—"}
                        </td>

                        {/* Official Website */}
                        <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                          {journal.websiteUrl ? (
                            <a
                              href={journal.websiteUrl.startsWith("http") ? journal.websiteUrl : `https://${journal.websiteUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Visit official journal website"
                              style={{
                                color: "var(--color-text-muted)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "30px",
                                height: "30px",
                                borderRadius: "6px",
                                border: "1px solid var(--color-border)",
                                textDecoration: "none",
                              }}
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "0.75rem" }}></i>
                            </a>
                          ) : (
                            <span style={{ color: "var(--color-text-muted)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
