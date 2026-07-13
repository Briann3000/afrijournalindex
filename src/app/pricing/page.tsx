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
    <div className="theme-dark">
      {/* IntaSend Inline SDK */}
      <Script 
        src="https://unpkg.com/intasend-inlinejs-sdk@4.0.5/build/intasend-inline.js" 
        strategy="lazyOnload" 
      />

      {/* Header */}
      <Header activePage="pricing" />

      <main className="container" style={{ padding: "4rem 0" }}>
        <div className="section-header">
          <h1 className="section-title">{t.pricing_page.title}</h1>
          <p className="section-desc">{t.pricing_page.desc}</p>
        </div>

        <div className="valprop-grid" style={{ alignItems: "stretch", marginBottom: "4rem" }}>
          {/* Free Indexing Tier */}
          <div className="glass-card valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderColor: "rgba(255,255,255,0.05)" }}>
            <div>
              <h3 className="card-title" style={{ color: "var(--color-accent-green)" }}>{t.pricing_page.free_title}</h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, margin: "1rem 0", fontFamily: "var(--font-heading)" }}>
                {t.pricing_page.free_price} <span style={{ fontSize: "1rem", fontFamily: "var(--font-ui)", color: "var(--color-text-muted)" }}>{t.pricing_page.free_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.free_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-accent-green)", marginRight: "0.5rem" }}></i> {t.pricing_page.free_feature1}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-accent-green)", marginRight: "0.5rem" }}></i> {t.pricing_page.free_feature2}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-accent-green)", marginRight: "0.5rem" }}></i> {t.pricing_page.free_feature3}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-accent-green)", marginRight: "0.5rem" }}></i> {t.pricing_page.free_feature4}</li>
              </ul>
            </div>
            <a href="/submit" className="btn btn-secondary" style={{ width: "100%" }}>{t.nav.get_started}</a>
          </div>

          {/* Basic Impact Report */}
          <div className="glass-card valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderColor: "var(--color-primary)", position: "relative" }}>
            <div style={{ position: "absolute", top: "-12px", right: "20px", backgroundColor: "var(--color-primary)", color: "var(--color-bg-dark)", fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.8rem", borderRadius: "50px" }}>{t.pricing_page.badge_popular}</div>
            <div>
              <h3 className="card-title" style={{ color: "var(--color-primary)" }}>{t.pricing_page.basic_title}</h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, margin: "1rem 0", fontFamily: "var(--font-heading)" }}>
                {t.pricing_page.basic_price} <span style={{ fontSize: "1rem", fontFamily: "var(--font-ui)", color: "var(--color-text-muted)" }}>{t.pricing_page.basic_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.basic_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> {t.pricing_page.basic_feature1}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> {t.pricing_page.basic_feature2}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> {t.pricing_page.basic_feature3}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-primary)", marginRight: "0.5rem" }}></i> {t.pricing_page.basic_feature4}</li>
              </ul>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handlePurchaseClick("Basic Impact", 1500)}>{t.pricing_page.btn_order}</button>
          </div>

          {/* Premium Institutional Report */}
          <div className="glass-card valprop-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderColor: "rgba(255,255,255,0.05)" }}>
            <div>
              <h3 className="card-title" style={{ color: "var(--color-secondary)" }}>{t.pricing_page.premium_title}</h3>
              <div style={{ fontSize: "2.2rem", fontWeight: 700, margin: "1rem 0", fontFamily: "var(--font-heading)" }}>
                {t.pricing_page.premium_price} <span style={{ fontSize: "1rem", fontFamily: "var(--font-ui)", color: "var(--color-text-muted)" }}>{t.pricing_page.premium_sub}</span>
              </div>
              <p className="card-text" style={{ marginBottom: "1.5rem" }}>{t.pricing_page.premium_desc}</p>
              <ul style={{ listStyle: "none", marginBottom: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-secondary)", marginRight: "0.5rem" }}></i> {t.pricing_page.premium_feature1}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-secondary)", marginRight: "0.5rem" }}></i> {t.pricing_page.premium_feature2}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-secondary)", marginRight: "0.5rem" }}></i> {t.pricing_page.premium_feature3}</li>
                <li style={{ marginBottom: "0.6rem" }}><i className="fa-solid fa-check" style={{ color: "var(--color-secondary)", marginRight: "0.5rem" }}></i> {t.pricing_page.premium_feature4}</li>
              </ul>
            </div>
            <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => handlePurchaseClick("Premium Institutional", 4500)}>{t.pricing_page.btn_order}</button>
          </div>
        </div>

        {/* FAQ Nudge */}
        <div style={{ textAlign: "center", padding: "2rem 0 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Have questions about pricing or evaluation?{" "}
            <a href="/faq" style={{ color: "var(--color-primary)" }}>Read our FAQ</a>
            {" "}or{" "}
            <a href="/contact" style={{ color: "var(--color-primary)" }}>contact us</a>.
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
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ maxWidth: "450px", width: "90%", padding: "2.5rem", position: "relative" }}>
            <button 
              style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h3 style={{ marginBottom: "1.5rem", color: "var(--color-primary)" }}>
              <i className="fa-solid fa-credit-card" style={{ marginRight: "0.5rem" }}></i> Premium Metrics Setup
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
              Order <strong>{selectedTier}</strong> metrics report evaluation for your journal. Payments processed securely via IntaSend.
            </p>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="modalJournalSelect" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem" }}>Select Target Journal</label>
              {journals.length > 0 ? (
                <select 
                  id="modalJournalSelect"
                  value={selectedJournalId}
                  onChange={(e) => setSelectedJournalId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    borderRadius: "4px"
                  }}
                >
                  {journals.map(j => (
                    <option key={j.id} value={j.id} style={{ background: "#121217" }}>
                      {j.name} {j.issn ? `(${j.issn})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: "0.85rem", color: "#ff4a4a" }}>
                  No journals found. Please <a href="/submit" style={{ color: "var(--color-primary)" }}>submit a journal</a> first.
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Total Due:</span>
                <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>KES {price.toLocaleString()}</div>
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

            <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem", textAlign: "center" }}>
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
