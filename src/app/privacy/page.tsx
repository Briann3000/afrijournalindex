"use client";

import React from "react";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

export default function PrivacyPolicy() {
  const { t } = useLang();
  const pp = t.privacy_page;

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      <main className="container reading-container" style={{ padding: "3.5rem 0 6rem" }}>
        {/* Page Header */}
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-user-shield"></i>
            Data &amp; Privacy
          </span>
          <h1 className="page-title">{pp.title}</h1>
          <p className="page-subtitle">{pp.subtitle}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
            {pp.last_updated}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Section 1 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-secondary)" }}>01.</span> {pp.sec1_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.95rem" }}>
              {pp.sec1_p1}
            </p>
          </div>

          {/* Section 2 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-secondary)" }}>02.</span> {pp.sec2_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "1rem", fontSize: "0.95rem" }}>
              {pp.sec2_p1}
            </p>

            <div style={{ marginBottom: "1.2rem" }}>
              <h3 style={{ fontSize: "0.98rem", marginBottom: "0.4rem", color: "var(--color-text-main)", fontWeight: 600 }}>{pp.sec2_h1}</h3>
              <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
                <li>{pp.sec2_li1_1}</li>
                <li>{pp.sec2_li1_2}</li>
                <li>{pp.sec2_li1_3}</li>
                <li>{pp.sec2_li1_4}</li>
                <li>{pp.sec2_li1_5}</li>
              </ul>
            </div>

            <div style={{ marginBottom: "1.2rem" }}>
              <h3 style={{ fontSize: "0.98rem", marginBottom: "0.4rem", color: "var(--color-text-main)", fontWeight: 600 }}>{pp.sec2_h2}</h3>
              <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
                <li>{pp.sec2_li2_1}</li>
                <li>{pp.sec2_li2_2}</li>
                <li>{pp.sec2_li2_3}</li>
              </ul>
            </div>

            <div>
              <h3 style={{ fontSize: "0.98rem", marginBottom: "0.4rem", color: "var(--color-text-main)", fontWeight: 600 }}>{pp.sec2_h3}</h3>
              <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
                <li>{pp.sec2_li3_1}</li>
                <li>{pp.sec2_li3_2}</li>
                <li>{pp.sec2_li3_3}</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-secondary)" }}>03.</span> {pp.sec3_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {pp.sec3_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
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
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-secondary)" }}>04.</span> {pp.sec4_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {pp.sec4_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
              <li>{pp.sec4_li1}</li>
              <li>{pp.sec4_li2}</li>
              <li>{pp.sec4_li3}</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-secondary)" }}>05.</span> {pp.sec5_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {pp.sec5_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
              <li>{pp.sec5_li1}</li>
              <li>{pp.sec5_li2}</li>
              <li>{pp.sec5_li3}</li>
            </ul>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginTop: "0.8rem", fontSize: "0.95rem" }}>
              {pp.sec5_p2}
            </p>
          </div>

          {/* Section 6 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-secondary)" }}>06.</span> {pp.sec6_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", fontSize: "0.95rem" }}>
              {pp.sec6_p1}
            </p>
          </div>

          {/* Section 7 */}
          <div className="card-surface" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-text-main)", fontWeight: 700 }}>
              <span style={{ color: "var(--color-secondary)" }}>07.</span> {pp.sec7_title}
            </h2>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginBottom: "0.8rem", fontSize: "0.95rem" }}>
              {pp.sec7_p1}
            </p>
            <ul style={{ color: "var(--color-text-body)", lineHeight: "1.9", paddingLeft: "1.5rem", fontSize: "0.92rem" }}>
              <li>{pp.sec7_li1}</li>
              <li>{pp.sec7_li2}</li>
              <li>{pp.sec7_li3}</li>
              <li>{pp.sec7_li4}</li>
              <li>{pp.sec7_li5}</li>
            </ul>
            <p style={{ color: "var(--color-text-body)", lineHeight: "1.8", marginTop: "0.8rem", fontSize: "0.95rem" }}>
              {pp.sec7_p2}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
