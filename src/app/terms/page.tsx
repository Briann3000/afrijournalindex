"use client";

import React from "react";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

export default function TermsAndConditions() {
  const { t } = useLang();
  const tp = t.terms_page;

  return (
    <div className="theme-dark">
      <Header />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "820px" }}>
        {/* Page Header */}
        <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 className="section-title">{tp.title}</h1>
          <p className="section-desc">{tp.subtitle}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
            {tp.last_updated}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Section 1 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>01.</span> {tp.sec1_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec1_p1}
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {tp.sec1_p2}
            </p>
          </div>

          {/* Section 2 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>02.</span> {tp.sec2_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec2_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{tp.sec2_li1}</li>
              <li>{tp.sec2_li2}</li>
              <li>{tp.sec2_li3}</li>
              <li>{tp.sec2_li4}</li>
              <li>{tp.sec2_li5}</li>
              <li>{tp.sec2_li6}</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>03.</span> {tp.sec3_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec3_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{tp.sec3_li1}</li>
              <li>{tp.sec3_li2}</li>
              <li>{tp.sec3_li3}</li>
              <li>{tp.sec3_li4}</li>
            </ul>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginTop: "0.8rem" }}>
              {tp.sec3_p2}
            </p>
          </div>

          {/* Section 4 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>04.</span> {tp.sec4_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec4_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{tp.sec4_li1}</li>
              <li>{tp.sec4_li2}</li>
              <li>{tp.sec4_li3}</li>
              <li>{tp.sec4_li4}</li>
              <li>{tp.sec4_li5}</li>
            </ul>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginTop: "0.8rem" }}>
              {tp.sec4_p2}
            </p>
          </div>

          {/* Section 5 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>05.</span> {tp.sec5_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec5_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{tp.sec5_li1}</li>
              <li>{tp.sec5_li2}</li>
              <li>{tp.sec5_li3}</li>
              <li>{tp.sec5_li4}</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>06.</span> {tp.sec6_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec6_p1}
            </p>
            <ul style={{ color: "var(--color-text-muted)", lineHeight: "2", paddingLeft: "1.5rem" }}>
              <li>{tp.sec6_li1}</li>
              <li>{tp.sec6_li2}</li>
              <li>{tp.sec6_li3}</li>
              <li>{tp.sec6_li4}</li>
            </ul>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginTop: "0.8rem" }}>
              {tp.sec6_p2}
            </p>
          </div>

          {/* Section 7 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>07.</span> {tp.sec7_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec7_p1}
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {tp.sec7_p2}
            </p>
          </div>

          {/* Section 8 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>08.</span> {tp.sec8_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec8_p1}
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {tp.sec8_p2}
            </p>
          </div>

          {/* Section 9 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>09.</span> {tp.sec9_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {tp.sec9_p1}
            </p>
          </div>

          {/* Section 10 */}
          <div className="glass-card" style={{ padding: "2.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ color: "var(--color-primary)" }}>10.</span> {tp.sec10_title}
            </h2>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75", marginBottom: "0.8rem" }}>
              {tp.sec10_p1}
            </p>
            <p style={{ color: "var(--color-text-muted)", lineHeight: "1.75" }}>
              {tp.sec10_p2}
            </p>
          </div>

        </div>

        {/* Quick links footer */}
        <div style={{ textAlign: "center", marginTop: "3rem", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {tp.related_policies}
          </p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/privacy" className="btn btn-secondary btn-sm">{t.footer.privacy || "Privacy Policy"}</a>
            <a href="/faq" className="btn btn-secondary btn-sm">{t.nav.faq || "FAQ"}</a>
            <a href="/contact" className="btn btn-secondary btn-sm">{t.footer.contact || "Contact Us"}</a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
