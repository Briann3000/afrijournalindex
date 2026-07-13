"use client";

import React from "react";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

export default function PrivacyPolicy() {
  const { t } = useLang();
  const pp = t.privacy_page;

  return (
    <div className="theme-dark">
      <Header />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "820px" }}>
        {/* Page Header */}
        <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 className="section-title">{pp.title}</h1>
          <p className="section-desc">{pp.subtitle}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
            {pp.last_updated}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Section 1 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>01.</span> {pp.sec1_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {pp.sec1_p1}
            </p>
          </div>

          {/* Section 2 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>02.</span> {pp.sec2_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "1rem" }}>
              {pp.sec2_p1}
            </p>

            <div style={{ marginBottom: "1.2rem" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#e2e2e9" }}>{pp.sec2_h1}</h3>
              <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
                <li>{pp.sec2_li1_1}</li>
                <li>{pp.sec2_li1_2}</li>
                <li>{pp.sec2_li1_3}</li>
                <li>{pp.sec2_li1_4}</li>
                <li>{pp.sec2_li1_5}</li>
              </ul>
            </div>

            <div style={{ marginBottom: "1.2rem" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#e2e2e9" }}>{pp.sec2_h2}</h3>
              <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
                <li>{pp.sec2_li2_1}</li>
                <li>{pp.sec2_li2_2}</li>
                <li>{pp.sec2_li2_3}</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "#e2e2e9" }}>{pp.sec2_h3}</h3>
              <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
                <li>{pp.sec2_li3_1}</li>
                <li>{pp.sec2_li3_2}</li>
                <li>{pp.sec2_li3_3}</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>03.</span> {pp.sec3_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {pp.sec3_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{pp.sec3_li1}</li>
              <li>{pp.sec3_li2}</li>
              <li>{pp.sec3_li3}</li>
              <li>{pp.sec3_li4}</li>
              <li>{pp.sec3_li5}</li>
              <li>{pp.sec3_li6}</li>
              <li>{pp.sec3_li7}</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>04.</span> {pp.sec4_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {pp.sec4_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{pp.sec4_li1}</li>
              <li>{pp.sec4_li2}</li>
              <li>{pp.sec4_li3}</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>05.</span> {pp.sec5_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {pp.sec5_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{pp.sec5_li1}</li>
              <li>{pp.sec5_li2}</li>
              <li>{pp.sec5_li3}</li>
            </ul>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginTop: "0.8rem" }}>
              {pp.sec5_p2}
            </p>
          </div>

          {/* Section 6 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>06.</span> {pp.sec6_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {pp.sec6_p1}
            </p>
          </div>

          {/* Section 7 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>07.</span> {pp.sec7_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {pp.sec7_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{pp.sec7_li1}</li>
              <li>{pp.sec7_li2}</li>
              <li>{pp.sec7_li3}</li>
              <li>{pp.sec7_li4}</li>
              <li>{pp.sec7_li5}</li>
            </ul>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginTop: "0.8rem" }}>
              {pp.sec7_p2}
            </p>
          </div>

          {/* Section 8 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>08.</span> {pp.sec8_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {pp.sec8_p1}
            </p>
          </div>

          {/* Section 9 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-secondary)" }}>09.</span> {pp.sec9_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {pp.sec9_p1}
            </p>
          </div>

        </div>

        {/* Quick links footer */}
        <div style={{ textAlign: "center", marginTop: "3rem", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {t.terms_page.related_policies}
          </p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/terms" className="btn btn-secondary btn-sm">{t.footer.terms || "Terms & Conditions"}</a>
            <a href="/faq" className="btn btn-secondary btn-sm">{t.nav.faq || "FAQ"}</a>
            <a href="/contact" className="btn btn-secondary btn-sm">{t.footer.contact || "Contact Us"}</a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
