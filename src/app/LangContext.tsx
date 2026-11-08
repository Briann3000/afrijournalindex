"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import defaultTranslations from "../locales/en.json";

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
  
  // Initialize immediately with default english translations so SSR and initial HTML render
  // have full text content without blocking Googlebot with "Loading AfriJournal Index..."
  const [translations, setTranslations] = useState<any>(defaultTranslations);

  useEffect(() => {
    async function loadTranslations() {
      // If language is default 'en', we already have defaultTranslations loaded
      if (lang === "en") {
        setTranslations(defaultTranslations);
        return;
      }
      try {
        const res = await fetch(`/locales/${lang}.json?v=20261105b`);
        if (!res.ok) throw new Error("Translation not found");
        const data = await res.json();
        setTranslations(data);
      } catch (err) {
        console.error("Failed to load language translations:", err);
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

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations || defaultTranslations }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error("useLang must be used within LangProvider");
  }
  return context;
}
