"use client";

import React, { useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import { useLang } from "../LangContext";

export default function FAQ() {
  const { t, lang } = useLang();
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenItem(prev => prev === key ? null : key);
  };

  const faqData = t.faq_page || [];

  return (
    <div className="theme-dark">
      <Header />

      <main className="container" style={{ padding: "4rem 0", maxWidth: "820px" }}>
        {/* Page Header */}
        <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 className="section-title">{t.nav.faq || "Frequently Asked Questions"}</h1>
          <p className="section-desc">
            {lang === "fr" 
              ? "Tout ce que vous devez savoir sur l'utilisation d'AfriJournal Index." 
              : lang === "pt" 
              ? "Tudo o que você precisa saber sobre como usar o AfriJournal Index." 
              : lang === "ar"
              ? "كل ما تحتاج إلى معرفته حول استخدام AfriJournal Index."
              : lang === "sw"
              ? "Kila kitu unachohitaji kujua kuhusu kutumia AfriJournal Index."
              : "Everything you need to know about using AfriJournal Index — from submitting a journal to understanding your impact factor score."}
          </p>
        </div>

        {/* FAQ Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          {faqData.map((section: any) => (
            <div key={section.category}>
              {/* Category heading */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  {section.category}
                </h2>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" }} />
              </div>

              {/* FAQ items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {section.items.map((item: any, idx: number) => {
                  const key = `${section.category}-${idx}`;
                  const isOpen = openItem === key;
                  return (
                    <div
                      key={key}
                      className="glass-card"
                      style={{
                        overflow: "hidden",
                        border: isOpen ? "1px solid rgba(212,160,74,0.25)" : "1px solid rgba(255,255,255,0.05)",
                        transition: "border-color 0.2s"
                      }}
                    >
                      <button
                        onClick={() => toggle(key)}
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1.25rem 1.75rem",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          gap: "1rem"
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: isOpen ? "var(--color-primary)" : "#e2e2e9", lineHeight: "1.4" }}>
                          {item.q}
                        </span>
                        <i
                          className={`fa-solid ${isOpen ? "fa-chevron-up" : "fa-chevron-down"}`}
                          style={{
                            color: "var(--color-text-muted)",
                            fontSize: "0.8rem",
                            flexShrink: 0,
                            transition: "transform 0.2s"
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div style={{
                          padding: "0 1.75rem 1.5rem",
                          color: "var(--color-text-muted)",
                          lineHeight: "1.75",
                          fontSize: "0.9rem",
                          borderTop: "1px solid rgba(255,255,255,0.04)"
                        }}>
                          <p style={{ margin: "1rem 0 0" }}>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions CTA */}
        <div
          className="glass-card"
          style={{
            textAlign: "center",
            padding: "3rem",
            marginTop: "3rem",
            background: "linear-gradient(135deg, rgba(212,160,74,0.07), rgba(212,100,200,0.05))"
          }}
        >
          <i className="fa-solid fa-circle-question" style={{ fontSize: "2.5rem", color: "var(--color-primary)", marginBottom: "1rem", display: "block" }} />
          <h3 style={{ marginBottom: "0.5rem" }}>
            {lang === "fr" ? "Vous avez encore des questions ?" : lang === "pt" ? "Ainda tem perguntas?" : lang === "ar" ? "هل لديك أسئلة أخرى؟" : lang === "sw" ? "Bado una maswali?" : "Still have questions?"}
          </h3>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            {lang === "fr" 
              ? "Vous ne trouvez pas ce que vous cherchez ? Notre équipe se fera un plaisir de vous aider." 
              : lang === "pt" 
              ? "Não consegue encontrar o que procura? Nossa equipe terá prazer em ajudar." 
              : lang === "ar"
              ? "ألم تجد ما تبحث عنه؟ يسعد فريقنا تقديم المساعدة."
              : lang === "sw"
              ? "Huwezi kupata unachotafuta? Timu yetu inafurahi kukusaidia."
              : "Can't find what you're looking for? Our team is happy to help."}
          </p>
          <a href="/contact" className="btn btn-primary">
            {t.footer.contact || "Contact Us"}
          </a>
        </div>

        {/* Quick links footer */}
        <div style={{ textAlign: "center", marginTop: "3rem", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {t.terms_page.related_policies}
          </p>
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/terms" className="btn btn-secondary btn-sm">{t.footer.terms || "Terms & Conditions"}</a>
            <a href="/privacy" className="btn btn-secondary btn-sm">{t.footer.privacy || "Privacy Policy"}</a>
            <a href="/contact" className="btn btn-secondary btn-sm">{t.footer.contact || "Contact Us"}</a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
