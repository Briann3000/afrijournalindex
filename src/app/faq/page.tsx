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
    <div className="page-wrapper" style={{ padding: 0 }}>
      <Header />

      <main className="container reading-container" style={{ padding: "3.5rem 0 6rem" }}>
        {/* Page Header */}
        <div className="page-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="badge-featured" style={{ marginBottom: "0.8rem" }}>
            <i className="fa-solid fa-circle-question"></i>
            Knowledge Base
          </span>
          <h1 className="page-title">{t.nav.faq || "Frequently Asked Questions"}</h1>
          <p className="page-subtitle" style={{ maxWidth: "680px", margin: "0.5rem auto 0" }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {faqData.map((section: any) => (
            <div key={section.category}>
              {/* Category heading */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.2rem" }}>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  {section.category}
                </h2>
                <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
              </div>

              {/* FAQ items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {section.items.map((item: any, idx: number) => {
                  const key = `${section.category}-${idx}`;
                  const isOpen = openItem === key;
                  return (
                    <div
                      key={key}
                      className="card-surface"
                      style={{
                        padding: 0,
                        overflow: "hidden",
                        borderColor: isOpen ? "var(--color-primary)" : "var(--color-border)",
                        transition: "all 0.2s"
                      }}
                    >
                      <button
                        onClick={() => toggle(key)}
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1.25rem 1.5rem",
                          background: isOpen ? "var(--color-primary-light)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          gap: "1rem"
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: isOpen ? "var(--color-primary)" : "var(--color-text-main)", lineHeight: "1.4" }}>
                          {item.q}
                        </span>
                        <i
                          className={`fa-solid ${isOpen ? "fa-chevron-up" : "fa-chevron-down"}`}
                          style={{
                            color: isOpen ? "var(--color-primary)" : "var(--color-text-muted)",
                            fontSize: "0.85rem",
                            flexShrink: 0
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div style={{
                          padding: "1rem 1.5rem 1.5rem",
                          color: "var(--color-text-body)",
                          lineHeight: "1.8",
                          fontSize: "0.92rem",
                          borderTop: "1px solid var(--color-border)"
                        }}>
                          <p style={{ margin: 0 }}>{item.a}</p>
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
          className="card-surface"
          style={{
            textAlign: "center",
            padding: "3rem",
            marginTop: "3.5rem",
            background: "linear-gradient(135deg, #eff6ff, #f8fafc)",
            border: "1px solid #bfdbfe"
          }}
        >
          <i className="fa-solid fa-circle-question" style={{ fontSize: "2.5rem", color: "var(--color-primary)", marginBottom: "1rem", display: "block" }} />
          <h3 style={{ marginBottom: "0.5rem", fontSize: "1.3rem", color: "var(--color-text-main)" }}>
            {lang === "fr" ? "Vous avez encore des questions ?" : lang === "pt" ? "Ainda tem perguntas?" : lang === "ar" ? "هل لديك أسئلة أخرى؟" : lang === "sw" ? "Bado una maswali?" : "Still have questions?"}
          </h3>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            {lang === "fr" 
              ? "Vous ne trouvez pas ce que vous cherchez ? Notre équipe se fera un plaisir de vous aider." 
              : lang === "pt" 
              ? "Não consegue encontrar o que procura? Nossa equipe terá prazer em ajudar." 
              : lang === "ar"
              ? "ألم تجد ما تبحث عنه؟ يسعد فريقنا تقديم المساعدة."
              : lang === "sw"
              ? "Huwezi kupata unachotafuta? Timu yetu inafurahi kukusaidia."
              : "Can't find what you're looking for? Our academic support team is happy to help."}
          </p>
          <a href="/contact" className="btn btn-primary">
            {t.footer.contact || "Contact Us"}
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
