import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "./LangContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://afrijournalindexing.org"),
  title: {
    default: "AfriJournal Indexing — African Scientific Journal Indexing & Citation Metrics",
    template: "%s | AfriJournal Indexing"
  },
  description: "The authoritative, open indexing repository and bibliometric platform for African scholarly journals. Featuring calculated 2-year AJCI impact metrics, Regional Representation Quotients (RRQ), verified DOAJ/Scopus readiness audits, and researcher profile registries.",
  keywords: [
    "AfriJournal Indexing",
    "AJCI",
    "African research journals",
    "African journal impact factor",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=2" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        {/* Playfair Display and Inter fonts from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet" />
        {/* FontAwesome for Icons */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        {/* IntaSend Inline Payment SDK */}
        <script src="https://unpkg.com/intasend-inlinejs-sdk@4.0.5/build/intasend-inline.js" async></script>
      </head>
      <body>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
