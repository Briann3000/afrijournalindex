"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

interface JournalOption {
  id: string;
  name: string;
  issn: string | null;
  eissn: string | null;
  country: string;
  publisherName: string;
}

function PricingContent() {
  const { lang, setLang, t } = useLang();
  const searchParams = useSearchParams();

  // Currency State: USD or KES
  const [currency, setCurrency] = useState<"USD" | "KES">("USD");

  // Pricing constants (USD and KES)
  const PRICING = {
    basic: {
      usd: 99,
      kes: 12800,
      title: "Accredited Evaluation & Institutional Suite",
      tier: "Basic"
    }
  };

  // Checkout modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalOption | null>(null);
  const [selectedTier, setSelectedTier] = useState<"Basic">("Basic");
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [intasendLoaded, setIntasendLoaded] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Load user session if logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.authenticated) {
          setCurrentUser(data.user);
        }
      } catch {
        // Not logged in
      }
    }
    checkAuth();
  }, []);

  // Journal search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<JournalOption[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Check URL query parameters on mount
  useEffect(() => {
    const paramJournalId = searchParams.get("journalId");
    const paramJournalName = searchParams.get("journal");
    const paramTier = searchParams.get("tier");

    if (paramJournalId || paramJournalName) {
      setSelectedTier("Basic");

      async function loadParamJournal() {
        try {
          const res = await fetch(`/api/journals/search?q=${encodeURIComponent(paramJournalId || paramJournalName || "")}&limit=1`);
          const data = await res.json();
          if (data.success && data.journals?.length > 0) {
            setSelectedJournal(data.journals[0]);
          } else if (paramJournalName) {
            setSelectedJournal({
              id: paramJournalId || "custom",
              name: paramJournalName,
              issn: searchParams.get("issn") || null,
              eissn: null,
              country: "Africa",
              publisherName: "Academic Publisher"
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
      loadParamJournal();
      setShowModal(true);
    }
  }, [searchParams]);

  // Search when modal is open and search query changes
  useEffect(() => {
    if (!showModal || selectedJournal) return;
    
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/journals/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.journals || []);
        }
      } catch (err) {
        console.error("Journal search error:", err);
      } finally {
        setSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery, showModal, selectedJournal]);

  const handlePurchaseClick = () => {
    setSelectedTier("Basic");
    setShowModal(true);
  };

  const handleSelectJournal = (journal: JournalOption) => {
    setSelectedJournal(journal);
    setSearchQuery("");
    setSearchResults([]);
  };

  const currentPriceKES = PRICING.basic.kes;
  const currentPriceUSD = PRICING.basic.usd;

  const handleIntaSendPay = () => {
    if (!selectedJournal) {
      alert("Please search and select a journal first.");
      return;
    }

    setCheckoutLoading(true);

    try {
      // @ts-ignore
      const IntaSendClass = typeof window !== "undefined" ? window.IntaSend : null;

      if (IntaSendClass) {
        const publicKey = process.env.NEXT_PUBLIC_INTASEND_PUBLIC_KEY || "ISPubKey_sandbox_d137df7d-95cf-4df5-91db-7ff72a15f02f";
        const isLive = process.env.NEXT_PUBLIC_INTASEND_IS_LIVE === "true";

        const intasend = new IntaSendClass({
          publicAPIKey: publicKey,
          live: isLive
        });

        intasend
          .on("COMPLETE", async (results: any) => {
            console.log("IntaSend payment COMPLETE:", results);
            try {
              const res = await fetch("/api/payments/callback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tracking_id: results.tracking_id,
                  state: results.state,
                  api_ref: results.api_ref,
                  journalId: selectedJournal.id,
                  tier: selectedTier,
                  amount: currentPriceKES,
                  currency: "KES",
                  email: currentUser?.email || "editorial@afrijournal.org",
                  userId: currentUser?.id || null
                })
              });
              const verifyData = await res.json();
              if (verifyData.success) {
                alert(`Payment verified successfully (${selectedTier} Tier)! Redirecting to your official accredited certificate...`);
                window.location.href = `/verify/${selectedJournal.id}`;
              } else {
                alert(`Verification notice: ${verifyData.error}`);
              }
            } catch (err) {
              console.error(err);
              alert("Verification network error.");
            } finally {
              setCheckoutLoading(false);
              setShowModal(false);
            }
          })
          .on("FAILED", (results: any) => {
            console.log("IntaSend payment FAILED:", results);
            alert("Payment checkout was cancelled or failed. Please try again.");
            setCheckoutLoading(false);
          })
          .on("IN-PROGRESS", () => {
            console.log("IntaSend payment IN-PROGRESS");
            setCheckoutLoading(false);
          });

        // Launch IntaSend popup and dismiss our background modal so IntaSend gets full focus
        intasend.run({
          amount: currentPriceKES,
          currency: "KES",
          email: currentUser?.email || "editorial@afrijournal.org",
          api_ref: `${selectedJournal.id}:${selectedTier}`
        });

        setShowModal(false);
        setCheckoutLoading(false);

      } else {
        alert("IntaSend payment gateway is still loading. Please check your internet connection and try again.");
        setCheckoutLoading(false);
      }
    } catch (error: any) {
      console.error("IntaSend Error:", error);
      alert(`Payment gateway notice: ${error?.message || "Could not launch IntaSend checkout window. Please check your API keys."}`);
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* IntaSend Inline SDK Script */}
      <Script 
        src="https://unpkg.com/intasend-inlinejs-sdk@4.0.5/build/intasend-inline.js" 
        strategy="afterInteractive"
        onLoad={() => setIntasendLoaded(true)}
      />

      {/* Header */}
      <Header activePage="pricing" />

      <main className="container" style={{ padding: "3.5rem 0 6rem" }}>
        {/* Header Banner */}
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-tags"></i>
            Transparent Scholarly Pricing &amp; Certification
          </span>
          <h1 className="page-title">{t.pricing_page?.title || "Journal Evaluation & Certification Pricing"}</h1>
          <p className="page-subtitle" style={{ maxWidth: "680px", margin: "0.5rem auto 0" }}>
            {t.pricing_page?.desc || "Open public indexing is completely free. Publishers and university presses can order accredited citation reports, verified impact certificates, and complete back-issue ingestion."}
          </p>

          {/* Currency Switcher Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "30px", padding: "0.3rem", marginTop: "1.8rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <button
              onClick={() => setCurrency("USD")}
              style={{
                border: "none",
                background: currency === "USD" ? "var(--color-primary)" : "transparent",
                color: currency === "USD" ? "#ffffff" : "var(--color-text-muted)",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: "0.45rem 1.2rem",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency("KES")}
              style={{
                border: "none",
                background: currency === "KES" ? "var(--color-primary)" : "transparent",
                color: currency === "KES" ? "#ffffff" : "var(--color-text-muted)",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: "0.45rem 1.2rem",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              KES (KSh)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid (2 Tiers: Free vs. Basic $99 All-Inclusive) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", maxWidth: "980px", margin: "0 auto 4rem", alignItems: "stretch" }}>
          {/* Tier 1: Free Indexing */}
          <div className="card-surface valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2.5rem" }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: "0.8rem" }}>Open Access Standard</span>
              <h3 className="card-title" style={{ color: "#047857", fontSize: "1.4rem" }}>
                {t.pricing_page?.free_title || "Public Directory Indexing"}
              </h3>
              <div style={{ fontSize: "2.6rem", fontWeight: 800, margin: "0.8rem 0", color: "var(--color-text-main)" }}>
                {currency === "USD" ? "$0" : "KES 0"}{" "}
                <span style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", fontWeight: 500 }}>/ Free forever</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}>
                {t.pricing_page?.free_desc || "Inclusion in the open continental database accessible by researchers and libraries worldwide."}
              </p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-body)", fontSize: "0.92rem", display: "flex", flexDirection: "column", gap: "0.75rem", padding: 0 }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "#059669" }}></i> Public Directory &amp; DOI Listing</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "#059669" }}></i> Basic ISSN &amp; Scope Archiving</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "#059669" }}></i> Automated Compliance Screening</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "#059669" }}></i> Public Profile &amp; Search Indexing</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-muted)" }}><i className="fa-solid fa-lock" style={{ opacity: 0.5 }}></i> Official Vector Certificate Withheld</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-muted)" }}><i className="fa-solid fa-lock" style={{ opacity: 0.5 }}></i> Institutional Evaluation Dossier Withheld</li>
              </ul>
            </div>
            <a href="/submit" className="btn btn-secondary" style={{ width: "100%", textAlign: "center", marginTop: "1rem" }}>
              Submit for Free Indexing
            </a>
          </div>

          {/* Tier 2: Basic Accreditation & Institutional Suite ($99 / KES 12,800) */}
          <div className="card-surface valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: "2px solid var(--color-primary)", position: "relative", boxShadow: "var(--card-shadow-hover)", padding: "2.5rem" }}>
            <div style={{ position: "absolute", top: "-12px", right: "20px", backgroundColor: "var(--color-primary)", color: "#ffffff", fontSize: "0.75rem", fontWeight: 800, padding: "0.25rem 0.85rem", borderRadius: "50px", letterSpacing: "0.5px" }}>
              COMPLETE ALL-IN-ONE BUNDLE
            </div>
            <div>
              <span className="badge badge-amber" style={{ marginBottom: "0.8rem" }}>Accreditation &amp; Institutional Suite</span>
              <h3 className="card-title" style={{ color: "var(--color-primary)", fontSize: "1.4rem" }}>
                {t.pricing_page?.basic_title || "Official Accreditation & Institutional Suite"}
              </h3>
              <div style={{ fontSize: "2.6rem", fontWeight: 800, margin: "0.8rem 0", color: "var(--color-text-main)" }}>
                {currency === "USD" ? `$${PRICING.basic.usd}` : `KES ${PRICING.basic.kes.toLocaleString()}`}{" "}
                <span style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", fontWeight: 500 }}>/ full annual package</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}>
                Everything your journal needs: official digital and printable certificate, 12-page vector Institutional Evaluation Dossier, live verification badge, and verified editorial management tools.
              </p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-body)", fontSize: "0.92rem", display: "flex", flexDirection: "column", gap: "0.75rem", padding: 0 }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-circle-check" style={{ color: "var(--color-primary)" }}></i> <strong>Official Vector Certificate + Signed Board Attestation</strong></li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-circle-check" style={{ color: "var(--color-primary)" }}></i> <strong>12-Page Institutional Evaluation Dossier (Vector PDF)</strong></li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-circle-check" style={{ color: "var(--color-primary)" }}></i> <strong>Automated OJS Back-Catalog Harvesting &amp; Continuous Archive Sync</strong></li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-circle-check" style={{ color: "var(--color-primary)" }}></i> <strong>Verified Editor Portal (Aims, Scope, Periodicity &amp; Board Editing)</strong></li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-circle-check" style={{ color: "var(--color-primary)" }}></i> <strong>DOAJ &amp; International Indexing Remediation Roadmap</strong></li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-circle-check" style={{ color: "var(--color-primary)" }}></i> Cryptographic QR Registry Verification &amp; Live Embed Badge</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-circle-check" style={{ color: "var(--color-primary)" }}></i> Pan-African Citation Maps &amp; Cartel Defense Clearance</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}><i className="fa-solid fa-circle-check" style={{ color: "var(--color-primary)" }}></i> Interactive Citation Formula Breakdown &amp; Quartile Calculator</li>
              </ul>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }} onClick={handlePurchaseClick}>
              Order Complete Package ($99 / KES 12,800)
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div style={{ textAlign: "center", padding: "2.5rem 0 0", borderTop: "1px solid var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
            Have questions about certificate accreditation, evaluation timeline, or university licensing?{" "}
            <a href="/faq" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Read our FAQ</a>
            {" "}or{" "}
            <a href="/contact" style={{ color: "var(--color-primary)", fontWeight: 600 }}>contact editorial team</a>.
          </p>
        </div>
      </main>

      {/* Checkout Modal */}
      {showModal && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1.5rem"
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="card-surface" 
            style={{ maxWidth: "540px", width: "100%", padding: "2.2rem", position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)", borderRadius: "16px", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.4rem", cursor: "pointer" }}
              onClick={() => setShowModal(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3 style={{ marginBottom: "0.3rem", color: "var(--color-text-main)", fontSize: "1.3rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <i className="fa-solid fa-certificate" style={{ color: "var(--color-primary)" }}></i> 
              {selectedTier === "Basic" ? "Official Impact Certificate" : "Institutional Evaluation"}
            </h3>
            
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.3rem" }}>
              Order accredited metrics evaluation and unlock your official high-resolution certificate.
            </p>

            {/* Step 1: Journal Selection / Search */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontWeight: 700, fontSize: "0.82rem", display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-main)" }}>
                1. Select Target Journal
              </label>

              {selectedJournal ? (
                /* Selected State: Clean, Compact Card with Change Button */
                <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "10px", padding: "0.85rem 1.1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1, paddingRight: "0.8rem" }}>
                    <div style={{ fontWeight: 800, color: "#166534", fontSize: "0.95rem", lineHeight: "1.3" }}>
                      <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", marginRight: "0.4rem" }}></i>
                      {selectedJournal.name}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#15803d", marginTop: "0.25rem" }}>
                      ISSN: <strong>{selectedJournal.issn || "Registered"}</strong> • {selectedJournal.country} • {selectedJournal.publisherName}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setSelectedJournal(null); setSearchQuery(""); }}
                    style={{ background: "var(--color-bg-card)", border: "1px solid #bbf7d0", color: "#15803d", fontWeight: 700, fontSize: "0.78rem", padding: "0.35rem 0.8rem", borderRadius: "6px", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                /* Search / Picker State: Direct In-Flow Results (Never Obscures Content) */
                <div style={{ border: "1.5px solid var(--color-border)", borderRadius: "10px", padding: "0.9rem", background: "var(--color-bg-alt)" }}>
                  <div style={{ display: "flex", alignItems: "center", background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "0.5rem 0.85rem", marginBottom: "0.8rem" }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginRight: "0.6rem" }}></i>
                    <input 
                      type="text"
                      style={{ border: "none", outline: "none", width: "100%", fontSize: "0.88rem", background: "transparent" }}
                      placeholder="Type journal title or ISSN (e.g. African Journal...)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {searching && (
                      <i className="fa-solid fa-circle-notch fa-spin" style={{ color: "var(--color-primary)", fontSize: "0.85rem" }}></i>
                    )}
                  </div>

                  {/* Search Results List */}
                  <div style={{ maxHeight: "170px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {searchResults.length > 0 ? (
                      searchResults.map((j) => (
                        <div 
                          key={j.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectJournal(j);
                          }}
                          style={{
                            padding: "0.6rem 0.85rem",
                            background: "var(--color-bg-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-primary)";
                            e.currentTarget.style.backgroundColor = "rgba(212, 160, 74, 0.12)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--color-border)";
                            e.currentTarget.style.backgroundColor = "var(--color-bg-card)";
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: "0.86rem", color: "var(--color-text-main)" }}>
                            {j.name}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", marginTop: "0.15rem" }}>
                            {j.issn ? `ISSN: ${j.issn} • ` : ""}{j.country} • {j.publisherName}
                          </div>
                        </div>
                      ))
                    ) : searchQuery.trim().length > 1 && !searching ? (
                      <div style={{ textAlign: "center", padding: "1rem 0", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                        No indexed journals found matching &quot;{searchQuery}&quot;. <br />
                        <a href="/submit" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Submit your journal here</a>.
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "0.8rem 0", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        Type to search among 1,718 indexed African journals...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Price & Order Breakdown */}
            <div style={{ background: "var(--color-bg-alt)", padding: "1rem 1.25rem", borderRadius: "10px", marginBottom: "1.4rem", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Selected Package:</span>
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--color-text-main)" }}>
                  Accreditation &amp; Institutional Suite ($99)
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--color-text-main)" }}>Total Due:</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--color-primary)" }}>
                    ${currentPriceUSD} USD
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", display: "block" }}>
                    (KES {currentPriceKES.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Checkout Action */}
            <div>
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ 
                  width: "100%", 
                  padding: "0.9rem", 
                  fontSize: "0.95rem", 
                  fontWeight: 800, 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center", 
                  gap: "0.5rem",
                  cursor: !selectedJournal ? "not-allowed" : "pointer",
                  opacity: !selectedJournal ? 0.65 : 1
                }}
                onClick={handleIntaSendPay}
                disabled={checkoutLoading || !selectedJournal}
              >
                <i className="fa-solid fa-lock"></i>
                {checkoutLoading ? (
                  <span><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: "0.4rem" }}></i> Opening IntaSend Checkout...</span>
                ) : !selectedJournal ? (
                  "Please Select a Journal Above to Proceed"
                ) : (
                  "Pay Securely via IntaSend (Card / M-Pesa)"
                )}
              </button>
              
              <div style={{ textAlign: "center", marginTop: "0.8rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                <i className="fa-solid fa-shield-halved" style={{ color: "#16a34a", marginRight: "0.3rem" }}></i>
                256-bit Encrypted Checkout • Instant Verified Accreditation
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Pricing() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center" }}>Loading Pricing...</div>}>
      <PricingContent />
    </Suspense>
  );
}
