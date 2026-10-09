"use client";

import React from "react";
import Link from "next/link";
import { useLang } from "./LangContext";
import Header from "./Header";
import Footer from "./Footer";

export default function NotFound() {
  const { t } = useLang();

  return (
    <div className="page-wrapper" style={{ padding: 0, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      
      <main className="container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 1.5rem" }}>
        <div 
          className="card-surface" 
          style={{ 
            maxWidth: "600px", 
            width: "100%", 
            textAlign: "center", 
            padding: "3.5rem 2rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0, 107, 63, 0.12)"
          }}
        >
          <div 
            style={{ 
              width: "80px", 
              height: "80px", 
              borderRadius: "50%", 
              background: "rgba(0, 107, 63, 0.08)", 
              color: "var(--color-primary)",
              display: "inline-flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontSize: "2.2rem",
              marginBottom: "1.5rem"
            }}
          >
            <i className="fa-solid fa-compass"></i>
          </div>

          <span 
            style={{ 
              display: "block", 
              fontSize: "3.5rem", 
              fontWeight: 900, 
              color: "var(--color-primary)",
              lineHeight: 1,
              marginBottom: "0.5rem",
              letterSpacing: "-1px"
            }}
          >
            404
          </span>

          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.8rem" }}>
            Page Not Found
          </h1>

          <p style={{ color: "var(--color-text-body)", fontSize: "1rem", lineHeight: "1.6", marginBottom: "2rem" }}>
            The African academic resource, journal record, or page you requested could not be located or may have been moved.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link 
              href="/" 
              className="btn btn-primary" 
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem" }}
            >
              <i className="fa-solid fa-house"></i>
              {t.nav?.home || "Return Home"}
            </Link>

            <Link 
              href="/rankings" 
              className="btn btn-secondary" 
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem" }}
            >
              <i className="fa-solid fa-list-ol"></i>
              {t.nav?.rankings || "Browse Rankings"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
