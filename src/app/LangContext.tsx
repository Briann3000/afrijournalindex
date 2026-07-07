"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface LangContextType {
  lang: string;
  setLang: (lang: string) => void;
  t: any;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("afriJournalLang") || "en";
    }
    return "en";
  });
  
  const [translations, setTranslations] = useState<any>(null);

  useEffect(() => {
    async function loadTranslations() {
      try {
        const res = await fetch(`/locales/${lang}.json`);
        if (!res.ok) throw new Error("Translation not found");
        const data = await res.json();
        setTranslations(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadTranslations();

    if (typeof window !== "undefined") {
      localStorage.setItem("afriJournalLang", lang);
      if (lang === "ar") {
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.setAttribute("lang", "ar");
      } else {
        document.documentElement.setAttribute("dir", "ltr");
        document.documentElement.setAttribute("lang", lang);
      }
    }
  }, [lang]);

  if (!translations) {
    return <div style={{ background: "#121217", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading AfriJournal Index...</div>;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLang must be used within LangProvider");
  return context;
}
