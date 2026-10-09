"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function Pricing() {
  const { lang, setLang, t } = useLang();

  // Checkout modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [journals, setJournals] = useState<any[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [price, setPrice] = useState<number>(0);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

  useEffect(() => {
    if (showModal) {
      async function fetchJournals() {
        try {
          const res = await fetch("/api/journals/list");
          const data = await res.json();
          if (data.success) {
            setJournals(data.journals);
            if (data.journals.length > 0) {
              setSelectedJournalId(data.journals[0].id);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
      fetchJournals();
    }
  }, [showModal]);

  const handlePurchaseClick = (tier: string, KESPrice: number) => {
    setSelectedTier(tier);
    setPrice(KESPrice);
    setShowModal(true);
  };

  const handleIntaSendPay = () => {
    if (!selectedJournalId) {
      alert("Please select or register a journal first.");
      return;
    }

    setCheckoutLoading(true);

    try {
      // @ts-ignore
      if (typeof window !== "undefined" && window.IntaSend) {
        // @ts-ignore
        const intasend = new window.IntaSend({
          publicAPIKey: "ISPubKey_sandbox_d137df7d-95cf-4df5-91db-7ff72a15f02f",
          live: false
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
                  journalId: selectedJournalId,
                  amount: price
                })
              });
              const verifyData = await res.json();
              if (verifyData.success) {
                alert("Payment verified and premium AJIF report generated successfully!");
                if (verifyData.submissionId) {
                  window.location.href = `/submit/status?id=${verifyData.submissionId}`;
                } else {
                  window.location.href = "/browse";
                }
              } else {
                alert(`Verification failed: ${verifyData.error}`);
              }
            } catch (err) {
              console.error(err);
              alert("Verification request error.");
            } finally {
              setCheckoutLoading(false);
              setShowModal(false);
            }
          })
          .on("FAILED", (results: any) => {
            console.log("IntaSend payment FAILED:", results);
            alert("Checkout payment failed. Please try again.");
            setCheckoutLoading(false);
          })
          .on("IN-PROGRESS", () => {
            console.log("IntaSend payment IN-PROGRESS");
          });

        intasend.run({
          amount: price,
          currency: "KES",
          email: "billing@intasend.com"
        });
      } else {
        alert("IntaSend checkout SDK not loaded yet. Please wait a second and retry.");
        setCheckoutLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred launching the IntaSend Checkout window.");
      setCheckoutLoading(false);
    }
  };

  const handleSimulatedPay = async () => {
    if (!selectedJournalId) {
      alert("Please select or register a journal first.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const mockTxnId = "mock_txn_" + Math.random().toString(36).substring(2, 9);
      const res = await fetch("/api/payments/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_id: mockTxnId,
          state: "COMPLETE",
          api_ref: "mock_ref",
          journalId: selectedJournalId,
          amount: price
        })
      });
      const verifyData = await res.json();
      if (verifyData.success) {
        alert("Simulated sandbox payment success! Recalculated AJIF scores.");
        if (verifyData.submissionId) {
          window.location.href = `/submit/status?id=${verifyData.submissionId}`;
        } else {
          window.location.href = "/browse";
        }
      } else {
        alert(`Verification failed: ${verifyData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing simulated transaction callback.");
    } finally {
      setCheckoutLoading(false);
      setShowModal(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* IntaSend Inline SDK */}
      <Script 
        src="https://unpkg.com/intasend-inlinejs-sdk@4.0.5/build/intasend-inline.js" 
        strategy="lazyOnload" 
      />

      {/* Header */}
      <Header activePage="pricing" />

      <main className="container" style={{ padding: "3.5rem 0 6rem" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-tags"></i>
            Transparent Scholarly Pricing
          </span>
          <h1 className="page-title">{t.pricing_page.title}</h1>
          <p className="page-subtitle" style={{ maxWidth: "680px", margin: "0.5rem auto 0" }}>
            {t.pricing_page.desc}
          </p>
        </div>

        <div className="valprop-grid" style={{ alignItems: "stretch", marginBottom: "4rem" }}>
          {/* Free Indexing Tier */}
          <div className="card-surface valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: "0.8rem" }}>Open Access</span>
              <h3 className="card-title" style={{ color: "#047857", fontSize: "1.3rem" }}>{t.pricing_page.free_title}</h3>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0.8rem 0", color: "var(--color-text-main)" }}>
                {t.pricing_page.free_price} <span style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{t.pricing_page.free_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.free_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-body)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "#059669" }}></i> {t.pricing_page.free_feature1}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "#059669" }}></i> {t.pricing_page.free_feature2}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "#059669" }}></i> {t.pricing_page.free_feature3}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "#059669" }}></i> {t.pricing_page.free_feature4}</li>
              </ul>
            </div>
            <a href="/submit" className="btn btn-secondary" style={{ width: "100%" }}>{t.nav.get_started}</a>
          </div>

          {/* Basic Impact Report */}
          <div className="card-surface valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", border: "2px solid var(--color-primary)", position: "relative", boxShadow: "var(--card-shadow-hover)" }}>
            <div style={{ position: "absolute", top: "-12px", right: "20px", backgroundColor: "var(--color-primary)", color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, padding: "0.25rem 0.85rem", borderRadius: "50px" }}>
              {t.pricing_page.badge_popular}
            </div>
            <div>
              <span className="badge badge-blue" style={{ marginBottom: "0.8rem" }}>Standard Metrics</span>
              <h3 className="card-title" style={{ color: "var(--color-primary)", fontSize: "1.3rem" }}>{t.pricing_page.basic_title}</h3>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0.8rem 0", color: "var(--color-text-main)" }}>
                {t.pricing_page.basic_price} <span style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{t.pricing_page.basic_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.basic_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-body)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)" }}></i> {t.pricing_page.basic_feature1}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)" }}></i> {t.pricing_page.basic_feature2}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)" }}></i> {t.pricing_page.basic_feature3}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)" }}></i> {t.pricing_page.basic_feature4}</li>
              </ul>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handlePurchaseClick("Basic Impact", 1500)}>{t.pricing_page.btn_order}</button>
          </div>

          {/* Premium Institutional Report */}
          <div className="card-surface valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span className="badge badge-amber" style={{ marginBottom: "0.8rem" }}>Institutional Benchmark</span>
              <h3 className="card-title" style={{ color: "#0284c7", fontSize: "1.3rem" }}>{t.pricing_page.premium_title}</h3>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, margin: "0.8rem 0", color: "var(--color-text-main)" }}>
                {t.pricing_page.premium_price} <span style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", fontWeight: 500 }}>{t.pricing_page.premium_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.premium_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-body)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "#0284c7" }}></i> {t.pricing_page.premium_feature1}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "#0284c7" }}></i> {t.pricing_page.premium_feature2}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "#0284c7" }}></i> {t.pricing_page.premium_feature3}</li>
                <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fa-solid fa-check" style={{ color: "#0284c7" }}></i> {t.pricing_page.premium_feature4}</li>
              </ul>
            </div>
            <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => handlePurchaseClick("Premium Institutional", 4500)}>{t.pricing_page.btn_order}</button>
          </div>
        </div>

        {/* FAQ Nudge */}
        <div style={{ textAlign: "center", padding: "2.5rem 0 0", borderTop: "1px solid var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
            Have questions about pricing, evaluation or bulk university licenses?{" "}
            <a href="/faq" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Read our FAQ</a>
            {" "}or{" "}
            <a href="/contact" style={{ color: "var(--color-primary)", fontWeight: 600 }}>contact our team</a>.
          </p>
        </div>
      </main>

      {/* IntaSend Checkout Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1.5rem"
        }}>
          <div className="card-surface" style={{ maxWidth: "480px", width: "100%", padding: "2.5rem", position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <button 
              style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "1.4rem", cursor: "pointer" }}
              onClick={() => setShowModal(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <h3 style={{ marginBottom: "0.5rem", color: "var(--color-text-main)", fontSize: "1.3rem", fontWeight: 800 }}>
              <i className="fa-solid fa-credit-card" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> 
              Premium Metrics Setup
            </h3>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Order <strong>{selectedTier}</strong> metrics report evaluation for your journal. Payments processed securely via IntaSend.
            </p>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="modalJournalSelect" className="form-label">Select Target Journal</label>
              {journals.length > 0 ? (
                <select 
                  id="modalJournalSelect"
                  value={selectedJournalId}
                  onChange={(e) => setSelectedJournalId(e.target.value)}
                  className="form-select"
                >
                  {journals.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.name} {j.issn ? `(${j.issn})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "#dc2626" }}>
                  No journals found. Please <a href="/submit" style={{ color: "var(--color-primary)", fontWeight: 600 }}>submit a journal</a> first.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Total Due:</span>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--color-primary)" }}>KES {price.toLocaleString()}</div>
              </div>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleIntaSendPay}
                disabled={checkoutLoading || journals.length === 0}
              >
                {checkoutLoading ? "Launching..." : "Pay with IntaSend"}
              </button>
            </div>

            <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem", textAlign: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block", marginBottom: "0.5rem" }}>
                IntaSend Sandbox offline?
              </span>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ width: "100%" }}
                onClick={handleSimulatedPay}
                disabled={checkoutLoading || journals.length === 0}
              >
                Simulate Instant Payment (M-Pesa/Card)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
