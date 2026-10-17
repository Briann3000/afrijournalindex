import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const OPENALEX_KEY = process.env.OPENALEX_API_KEY || "eP5PAl4g8tOWuRjhyo7hMY";

const AFRICAN_COUNTRY_CODES = new Set([
  "DZ","AO","BJ","BW","BF","BI","CV","CM","CF","TD","KM","CD","CG","CI","DJ","EG","GQ","ER",
  "SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML","MR","MU","MA","MZ",
  "NA","NE","NG","RW","ST","SN","SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","ZM","ZW"
]);

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  KE: "Kenya", NG: "Nigeria", ZA: "South Africa", GH: "Ghana", UG: "Uganda",
  TZ: "Tanzania", ET: "Ethiopia", EG: "Egypt", RW: "Rwanda", ZW: "Zimbabwe",
  MW: "Malawi", ZM: "Zambia", CM: "Cameroon", SN: "Senegal", CI: "Côte d'Ivoire",
  MA: "Morocco", TN: "Tunisia", DZ: "Algeria", SD: "Sudan", MZ: "Mozambique",
  BW: "Botswana", NA: "Namibia", SL: "Sierra Leone", LR: "Liberia", GM: "Gambia",
  MU: "Mauritius", SZ: "Eswatini", LS: "Lesotho", BJ: "Benin", BF: "Burkina Faso",
  TG: "Togo", NE: "Niger", ML: "Mali", CD: "DR Congo", CG: "Congo"
};

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
  "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
  "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
  "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
  "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
  "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on",
  "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
  "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
  "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this",
  "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
  "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
  "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
  "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "study", "paper", "research", "results", "analysis", "method", "using", "based", "approach",
  "findings", "article", "investigates", "investigated", "examine", "examined", "concludes",
  "objective", "background", "aim", "aims", "significance", "implications"
]);

function extractKeywords(title: string, abstract: string): string[] {
  const combined = `${title} ${title} ${abstract}`.toLowerCase();
  const words = combined.replace(/[^\w\s-]/g, " ").split(/\s+/);
  
  const frequency: Record<string, number> = {};
  for (const w of words) {
    const clean = w.trim();
    if (clean.length > 3 && !STOP_WORDS.has(clean) && !/^\d+$/.test(clean)) {
      frequency[clean] = (frequency[clean] || 0) + 1;
    }
  }

  // Sort by frequency and select top terms
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([term]) => term);
}

function normalizeAuthorName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(dr|prof|professor|mr|ms|mrs|assoc|associate)\.?\s+/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      title = "", 
      abstract = "", 
      excludedAuthors = [], 
      region = "african",
      yearWindow = 3 
    } = body;

    if (!title.trim() && !abstract.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a manuscript title or abstract." },
        { status: 400 }
      );
    }

    // 1. In-memory concept extraction
    const keywords = extractKeywords(title, abstract);
    const searchQuery = keywords.length > 0 
      ? keywords.slice(0, 4).join(" ") 
      : title.trim().slice(0, 60);

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - (yearWindow === 5 ? 5 : 3);
    const yearsFilter = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).join("|");

    // 2. Query verified literature in OpenAlex
    const worksUrl = `https://api.openalex.org/works?search=${encodeURIComponent(searchQuery)}&filter=publication_year:${yearsFilter}&per_page=30&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;

    const res = await fetch(worksUrl, {
      headers: {
        "User-Agent": "AfriJournalIndexRefereeFinder/1.0 (mailto:indexing@afrijournal.org)"
      }
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Academic bibliometrics search is momentarily unavailable." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const works = data.results || [];

    // 3. Prepare excluded authors set for Conflict of Interest (COI) prevention
    const excludedList: string[] = Array.isArray(excludedAuthors)
      ? excludedAuthors
          .map((a: any) => normalizeAuthorName(String(a || "")))
          .filter((a: string) => a.length > 2)
      : [];
    const excludedSet = new Set<string>(excludedList);

    // 4. Map and group candidates
    const candidatesMap = new Map<string, {
      id: string;
      name: string;
      institution: string;
      country: string;
      countryCode: string;
      isAfrican: boolean;
      orcid: string | null;
      publicationCount: number;
      recentWorks: Array<{
        title: string;
        venue: string;
        year: number;
        doi: string | null;
        url: string | null;
      }>;
    }>();

    for (const work of works) {
      const authorships = work.authorships || [];
      
      // Check if any author in this work is an excluded author (co-authorship check)
      const workAuthorNames = authorships.map((a: any) => normalizeAuthorName(a.author?.display_name || ""));
      const hasExcludedAuthor = workAuthorNames.some((name: string) => {
        for (const excluded of Array.from(excludedSet)) {
          if (name.includes(excluded) || excluded.includes(name)) return true;
        }
        return false;
      });

      for (const authorship of authorships) {
        const authorObj = authorship.author;
        if (!authorObj?.display_name) continue;

        const rawName = authorObj.display_name.trim();
        const normName = normalizeAuthorName(rawName);

        // COI Check: Skip if author matches excluded authors
        let isDirectMatch = false;
        for (const excluded of Array.from(excludedSet)) {
          if (normName.includes(excluded) || excluded.includes(normName)) {
            isDirectMatch = true;
            break;
          }
        }
        if (isDirectMatch) continue;

        // COI Check: If this paper co-authored with an excluded author, skip candidate
        if (hasExcludedAuthor) continue;

        const authorKey = authorObj.id || normName;
        const institution = authorship.institutions?.[0]?.display_name || "Academic Institution";
        const countryCode = authorship.countries?.[0] || authorship.institutions?.[0]?.country_code || "";
        const isAfrican = AFRICAN_COUNTRY_CODES.has(countryCode?.toUpperCase());
        const countryName = COUNTRY_CODE_TO_NAME[countryCode?.toUpperCase()] || countryCode || "International";

        const cleanOrcid = authorObj.orcid 
          ? authorObj.orcid.replace(/^https?:\/\/orcid\.org\//i, "").trim()
          : null;

        if (!candidatesMap.has(authorKey)) {
          candidatesMap.set(authorKey, {
            id: authorKey,
            name: rawName,
            institution,
            country: countryName,
            countryCode,
            isAfrican,
            orcid: cleanOrcid,
            publicationCount: 0,
            recentWorks: []
          });
        }

        const candidate = candidatesMap.get(authorKey)!;
        candidate.publicationCount += 1;

        if (candidate.recentWorks.length < 3) {
          const cleanDoi = work.doi ? work.doi.replace(/^https?:\/\/doi\.org\//i, "").trim() : null;
          candidate.recentWorks.push({
            title: work.title || "Scholarly Publication",
            venue: work.primary_location?.source?.display_name || "Peer-Reviewed Journal",
            year: work.publication_year || currentYear,
            doi: cleanDoi,
            url: work.primary_location?.landing_page_url || (cleanDoi ? `https://doi.org/${cleanDoi}` : null)
          });
        }
      }
    }

    // 5. Prioritize and sort candidates
    let candidateList = Array.from(candidatesMap.values());

    if (region === "african") {
      // Prioritize African scholars first
      candidateList.sort((a, b) => {
        if (a.isAfrican && !b.isAfrican) return -1;
        if (!a.isAfrican && b.isAfrican) return 1;
        return b.publicationCount - a.publicationCount;
      });
    } else {
      candidateList.sort((a, b) => b.publicationCount - a.publicationCount);
    }

    // Limit to top 12 verified candidates
    const topCandidates = candidateList.slice(0, 12);

    return NextResponse.json({
      success: true,
      queryKeywords: keywords,
      totalCandidatesFound: topCandidates.length,
      candidates: topCandidates
    });

  } catch (error: any) {
    console.error("Referee finder error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search for referees." },
      { status: 500 }
    );
  }
}
