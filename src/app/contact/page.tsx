"use client";

import React, { useState } from "react";
import { useLang } from "../LangContext";
import Header from "../Header";
import Footer from "../Footer";

export default function Contact() {
  const { lang, setLang, t } = useLang();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for reaching out! Our support team will respond to your query shortly.");
    window.location.href = "/";
  };

  return (
    <div className="theme-dark">
      {/* Header */}
      <Header />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "600px" }}>
        <div className="section-header">
          <h1 className="section-title">{t.footer.contact}</h1>
          <p className="section-desc">{t.contact_page.desc}</p>
        </div>

        <div className="glass-card">
          <form className="submission-form" onSubmit={handleContactSubmit}>
            <div className="form-group">
              <label htmlFor="cName">{t.contact_page.name_label}</label>
              <input type="text" id="cName" required placeholder="e.g. Dr. Jane Doe" />
            </div>

            <div className="form-group">
              <label htmlFor="cEmail">{t.contact_page.email_label}</label>
              <input type="email" id="cEmail" required placeholder="jane.doe@university.edu" />
            </div>

            <div className="form-group">
              <label htmlFor="cSubject">{t.contact_page.subject_label}</label>
              <input type="text" id="cSubject" required placeholder="e.g. Indexing status update" />
            </div>

            <div className="form-group">
              <label htmlFor="cMessage">{t.contact_page.message_label}</label>
              <textarea id="cMessage" rows={5} required placeholder="Write your query details here..."></textarea>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                {t.contact_page.btn_send} <i className="fa-solid fa-paper-plane" style={{ marginLeft: "0.5rem" }}></i>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
