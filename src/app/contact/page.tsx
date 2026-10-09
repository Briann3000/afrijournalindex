"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function Contact() {
  const { lang, setLang, t } = useLang();
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page-wrapper" style={{ padding: 0 }}>
      {/* Header */}
      <Header />

      <main className="container" style={{ padding: "3.5rem 0 6rem", maxWidth: "620px" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-headset"></i>
            Support &amp; Inquiries
          </span>
          <h1 className="page-title">{t.footer.contact}</h1>
          <p className="page-subtitle">{t.contact_page.desc}</p>
        </div>

        <div className="card-surface" style={{ padding: "2.5rem" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#059669",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                margin: "0 auto 1.25rem"
              }}>
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 style={{ fontSize: "1.3rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Message Received</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", lineHeight: "1.6", marginBottom: "1.5rem" }}>
                Thank you for reaching out! Our editorial and technical team will review your message and get back to you shortly.
              </p>
              <a href="/" className="btn btn-secondary btn-sm">
                Return to Homepage
              </a>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit}>
              <div className="form-group">
                <label htmlFor="cName" className="form-label">{t.contact_page.name_label}</label>
                <input type="text" id="cName" required className="form-control" placeholder="e.g. Dr. Jane Doe" />
              </div>

              <div className="form-group">
                <label htmlFor="cEmail" className="form-label">{t.contact_page.email_label}</label>
                <input type="email" id="cEmail" required className="form-control" placeholder="jane.doe@university.edu" />
              </div>

              <div className="form-group">
                <label htmlFor="cSubject" className="form-label">{t.contact_page.subject_label}</label>
                <input type="text" id="cSubject" required className="form-control" placeholder="e.g. Indexing status update" />
              </div>

              <div className="form-group">
                <label htmlFor="cMessage" className="form-label">{t.contact_page.message_label}</label>
                <textarea id="cMessage" rows={5} required className="form-control" placeholder="Write your query details here..."></textarea>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.85rem" }}>
                  {t.contact_page.btn_send} <i className="fa-solid fa-paper-plane" style={{ marginLeft: "0.5rem" }}></i>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
