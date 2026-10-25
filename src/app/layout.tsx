import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { LangProvider } from "./LangContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://afrijournalindexing.org"),
  title: {
    default: "AfriJournal Indexing — African Scientific Journal Indexing & Citation Metrics",
    template: "%s | AfriJournal Indexing"
  },
  description: "The authoritative, open indexing repository and bibliometric platform for African scholarly journals. Featuring calculated 2-year AJCI impact metrics, Regional Representation Quotients (RRQ), verified DOAJ/Scopus readiness audits, and researcher profile registries.",
  keywords: [
    "AfriJournal Indexing",
    "AfriJournal",
    "AJCI",
    "African research journals",
    "African journal citation index",
    "African journal citation metrics",
    "academic indexing Africa",
    "scholarly publishing Africa",
    "peer-reviewed journals Kenya Nigeria South Africa Egypt",
    "DOAJ compliance audit",
    "open access African journals",
    "researcher h-index Africa",
    "university institutional rankings Africa"
  ],
  authors: [{ name: "AfriJournal Indexing Advisory Council", url: "https://afrijournalindexing.org" }],
  creator: "AfriJournal Indexing",
  publisher: "KENPRO Academic Publishing & AfriJournal Registry",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://afrijournalindexing.org",
    siteName: "AfriJournal Indexing",
    title: "AfriJournal Indexing — African Scientific Journal Indexing & Citation Metrics",
    description: "Empowering African scholarly discovery with open bibliometrics, verified 2-year citation velocity ratings, and institutional ranking consoles.",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "AfriJournal Indexing — Continental Academic Repository",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AfriJournal Indexing — African Scientific Journal Indexing",
    description: "Transparent, open indexing directory for African scholarly journals with verified AJCI bibliometric ratings.",
    images: ["/og-preview.png"],
  },
  alternates: {
    canonical: "https://afrijournalindexing.org",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    apple: "/apple-touch-icon.png",
  },
};

const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://afrijournalindexing.org/#website",
      "url": "https://afrijournalindexing.org",
      "name": "AfriJournal Indexing",
      "alternateName": ["AfriJournal", "AJCI"],
      "description": "African Scientific Journal Indexing & Citation Metrics Registry",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://afrijournalindexing.org/browse?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://afrijournalindexing.org/#organization",
      "name": "AfriJournal Indexing",
      "alternateName": ["AfriJournal", "African Journal Citation Index", "AJCI"],
      "url": "https://afrijournalindexing.org",
      "logo": "https://afrijournalindexing.org/logo.png",
      "description": "The open indexing repository and bibliometric platform for African scholarly journals."
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=3" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        {/* Preconnect to external CDNs */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        {/* Preload hero texture on desktop for fast LCP */}
        <link rel="preload" as="image" href="/images/hero-network.webp" type="image/webp" media="(min-width: 769px)" />
        {/* Noscript fallback for icons */}
        <noscript>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        </noscript>
        {/* Schema.org Organization and WebSite structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
      </head>
      <body>
        <LangProvider>
          {children}
        </LangProvider>
        {/* Non-blocking FontAwesome loader (zero render-blocking delay) */}
        <Script
          id="fontawesome-async-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (!document.getElementById('fa-async-css')) {
                var l = document.createElement('link');
                l.id = 'fa-async-css';
                l.rel = 'stylesheet';
                l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
                document.head.appendChild(l);
              }
            `
          }}
        />
        {/* IntaSend Inline Payment SDK - loaded non-blocking on idle */}
        <Script
          src="https://unpkg.com/intasend-inlinejs-sdk@4.0.5/build/intasend-inline.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
