"use client";

import React from "react";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

export default function TermsAndConditions() {
  const { t } = useLang();
  const tp = t.terms_page;

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      <main className="container reading-container" style={{ padding: "3.5rem 0 6rem" }}>
        {/* Page Header */}
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-scale-balanced"></i>
            Legal &amp; Compliance
          </span>
          <h1 className="page-title">{tp.title}</h1>
          <p className="page-subtitle">{tp.subtitle}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
            {tp.last_updated}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Section 1 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary)" }}>01.</span> {tp.sec1_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec1_p1}
            </p>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.95rem" }}>
              {tp.sec1_p2}
            </p>
          </div>

          {/* Section 2 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary)" }}>02.</span> {tp.sec2_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec2_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
              <li>{tp.sec2_li1}</li>
              <li>{tp.sec2_li2}</li>
              <li>{tp.sec2_li3}</li>
              <li>{tp.sec2_li4}</li>
              <li>{tp.sec2_li5}</li>
              <li>{tp.sec2_li6}</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary)" }}>03.</span> {tp.sec3_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec3_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
              <li>{tp.sec3_li1}</li>
              <li>{tp.sec3_li2}</li>
              <li>{tp.sec3_li3}</li>
              <li>{tp.sec3_li4}</li>
            </ul>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginTop: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec3_p2}
            </p>
          </div>

          {/* Section 4 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary)" }}>04.</span> {tp.sec4_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec4_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
              <li>{tp.sec4_li1}</li>
              <li>{tp.sec4_li2}</li>
              <li>{tp.sec4_li3}</li>
              <li>{tp.sec4_li4}</li>
              <li>{tp.sec4_li5}</li>
            </ul>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginTop: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec4_p2}
            </p>
          </div>

          {/* Section 5 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary)" }}>05.</span> {tp.sec5_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec5_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
              <li>{tp.sec5_li1}</li>
              <li>{tp.sec5_li2}</li>
              <li>{tp.sec5_li3}</li>
              <li>{tp.sec5_li4}</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary)" }}>06.</span> {tp.sec6_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec6_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
              <li>{tp.sec6_li1}</li>
              <li>{tp.sec6_li2}</li>
              <li>{tp.sec6_li3}</li>
              <li>{tp.sec6_li4}</li>
            </ul>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginTop: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec6_p2}
            </p>
          </div>

          {/* Section 7 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary)" }}>07.</span> {tp.sec7_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec7_p1}
            </p>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.95rem" }}>
              {tp.sec7_p2}
            </p>
          </div>

          {/* Section 8 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-primary)" }}>08.</span> {tp.sec8_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {tp.sec8_p1}
            </p>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.95rem" }}>
              {tp.sec8_p2}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
