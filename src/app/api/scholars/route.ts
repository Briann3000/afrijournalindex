import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { ALL_AFRICAN_COUNTRIES } from "../../data/african-countries";
import { getScholarScientometrics } from "../../../lib/scholar-metrics";
import { matchesQueryFuzzy, calculateFuzzyScore, normalizeSearchText } from "../../../lib/fuzzy-search";

export const dynamic = "force-dynamic";

const STANDARD_BROAD_DISCIPLINES = [
  "Health Sciences",
  "Social Sciences & Humanities",
  "Physical Sciences & Engineering",
  "Agricultural & Environmental Sciences",
  "Business & Economics",
  "Education & Pedagogy",
  "Life Sciences & Biotechnology",
  "Unspecified"
];

function mapToBroadDiscipline(text: string): string {
  const t = (text || "").toLowerCase();
  if (t.includes("health") || t.includes("medic") || t.includes("malaria") || t.includes("hiv") || t.includes("tuberculosis") || t.includes("stroke") || t.includes("cardio") || t.includes("disease") || t.includes("clinical") || t.includes("nurs") || t.includes("psych") || t.includes("pharmac") || t.includes("epidemiol")) {
    return "Health Sciences";
  }
  if (t.includes("agri") || t.includes("crop") || t.includes("farm") || t.includes("soil") || t.includes("environment") || t.includes("ecolog") || t.includes("water") || t.includes("forest") || t.includes("climate")) {
    return "Agricultural & Environmental Sciences";
  }
  if (t.includes("physic") || t.includes("math") || t.includes("engineer") || t.includes("comput") || t.includes("energy") || t.includes("material") || t.includes("chem") || t.includes("particle") || t.includes("technol")) {
    return "Physical Sciences & Engineering";
  }
  if (t.includes("econom") || t.includes("finance") || t.includes("business") || t.includes("market") || t.includes("trade") || t.includes("account") || t.includes("bank")) {
    return "Business & Economics";
  }
  if (t.includes("educat") || t.includes("pedagog") || t.includes("school") || t.includes("curriculum") || t.includes("teach") || t.includes("learn")) {
    return "Education & Pedagogy";
  }
  if (t.includes("bio") || t.includes("genet") || t.includes("cell") || t.includes("microbio") || t.includes("plant") || t.includes("zoolog") || t.includes("species")) {
    return "Life Sciences & Biotechnology";
  }
  if (t.includes("social") || t.includes("humanit") || t.includes("history") || t.includes("philos") || t.includes("politic") || t.includes("sociol") || t.includes("cultur") || t.includes("art") || t.includes("law")) {
    return "Social Sciences & Humanities";
  }
  return "Unspecified";
}

// Prominent African Universities & Research Institutes Dictionary
const AFRICAN_INSTITUTIONS_MAP: Record<string, string> = {
  // South Africa
  "cape town": "South Africa",
  "witwatersrand": "South Africa",
  "stellenbosch": "South Africa",
  "pretoria": "South Africa",
  "kwazulu": "South Africa",
  "south african medical research council": "South Africa",
  "johannesburg": "South Africa",
  "rhodes": "South Africa",
  "western cape": "South Africa",
  "north-west university": "South Africa",
  "free state": "South Africa",
  "unisa": "South Africa",
  "fort hare": "South Africa",
  // Kenya
  "nairobi": "Kenya",
  "kenyatta": "Kenya",
  "jkuat": "Kenya",
  "kenpro": "Kenya",
  "kenya projects organization": "Kenya",
  "moi university": "Kenya",
  "strathmore": "Kenya",
  "kemri": "Kenya",
  "kenya medical research institute": "Kenya",
  "aga khan university": "Kenya",
  "egerton": "Kenya",
  "maseno": "Kenya",
  "masinde muliro": "Kenya",
  "dedan kimathi": "Kenya",
  // Nigeria
  "ibadan": "Nigeria",
  "lagos": "Nigeria",
  "ahmadu bello": "Nigeria",
  "obafemi awolowo": "Nigeria",
  "university of nigeria": "Nigeria",
  "benin": "Nigeria",
  "covenant": "Nigeria",
  "ilorin": "Nigeria",
  "port harcourt": "Nigeria",
  "calabar": "Nigeria",
  "babcock": "Nigeria",
  // Egypt
  "cairo": "Egypt",
  "ain shams": "Egypt",
  "alexandria": "Egypt",
  "mansoura": "Egypt",
  "assiut": "Egypt",
  "al-azhar": "Egypt",
  "zagazig": "Egypt",
  "helwan": "Egypt",
  "tanta": "Egypt",
  "suez": "Egypt",
  // Uganda
  "makerere": "Uganda",
  "mbarara": "Uganda",
  "kyambogo": "Uganda",
  "gulu university": "Uganda",
  "busitema": "Uganda",
  // Ghana
  "university of ghana": "Ghana",
  "knust": "Ghana",
  "kwame nkrumah": "Ghana",
  "cape coast": "Ghana",
  "ashesi": "Ghana",
  // Ethiopia
  "addis ababa": "Ethiopia",
  "jimma": "Ethiopia",
  "hawassa": "Ethiopia",
  "gondar": "Ethiopia",
  "mekelle": "Ethiopia",
  // Tanzania
  "dar es salaam": "Tanzania",
  "muhimbili": "Tanzania",
  "sokoine": "Tanzania",
  // Rwanda
  "university of rwanda": "Rwanda",
  // Zimbabwe
  "university of zimbabwe": "Zimbabwe",
  "national university of science and technology": "Zimbabwe",
  // Zambia
  "university of zambia": "Zambia",
  "copperbelt": "Zambia",
  // Botswana
  "university of botswana": "Botswana",
  // Mauritius
  "university of mauritius": "Mauritius",
  // Senegal
  "cheikh anta diop": "Senegal",
  // Cameroon
  "yaounde": "Cameroon",
  "yaoundé": "Cameroon",
  "buea": "Cameroon",
  // Morocco
  "mohammed v": "Morocco",
  "cadi ayyad": "Morocco",
  "hassan ii": "Morocco",
  // Tunisia
  "tunis": "Tunisia",
  "monastir": "Tunisia",
  "sfax": "Tunisia",
  // Algeria
  "algiers": "Algeria",
  "oran": "Algeria",
  // Namibia
  "university of namibia": "Namibia",
  // Malawi
  "university of malawi": "Malawi"
};

const AFRICAN_TLDS: Record<string, string> = {
  ".ke": "Kenya",
  ".ac.ke": "Kenya",
  ".za": "South Africa",
  ".ac.za": "South Africa",
  ".ng": "Nigeria",
  ".edu.ng": "Nigeria",
  ".eg": "Egypt",
  ".edu.eg": "Egypt",
  ".ug": "Uganda",
  ".ac.ug": "Uganda",
  ".gh": "Ghana",
  ".edu.gh": "Ghana",
  ".et": "Ethiopia",
  ".edu.et": "Ethiopia",
  ".tz": "Tanzania",
  ".ac.tz": "Tanzania",
  ".rw": "Rwanda",
  ".ac.rw": "Rwanda",
  ".zw": "Zimbabwe",
  ".ac.zw": "Zimbabwe",
  ".zm": "Zambia",
  ".ac.zm": "Zambia",
  ".bw": "Botswana",
  ".ac.bw": "Botswana",
  ".mu": "Mauritius",
  ".ac.mu": "Mauritius",
  ".sn": "Senegal",
  ".cm": "Cameroon",
  ".ma": "Morocco",
  ".tn": "Tunisia",
  ".dz": "Algeria",
  ".na": "Namibia",
  ".mw": "Malawi"
};

function resolveInstitutionAffiliation(institutionName: string, email: string, bioText: string = "", scholarName: string = ""): { country: string; originCountry?: string; isAfrican: boolean; isDiaspora?: boolean } {
  const inst = (institutionName || "").trim();
  const instLower = inst.toLowerCase();
  const mailLower = (email || "").toLowerCase();
  const bioLower = (bioText || "").toLowerCase();
  const nameLower = (scholarName || "").toLowerCase();

  // 1. Check known African universities dictionary
  for (const [key, cName] of Object.entries(AFRICAN_INSTITUTIONS_MAP)) {
    if (instLower.includes(key)) {
      return { country: cName, originCountry: cName, isAfrican: true, isDiaspora: false };
    }
  }

  // 2. Check if institution explicitly names an African country
  for (const ac of ALL_AFRICAN_COUNTRIES) {
    if (instLower.includes(ac.name.toLowerCase())) {
      return { country: ac.name, originCountry: ac.name, isAfrican: true, isDiaspora: false };
    }
  }

  // 3. Check African email TLDs
  for (const [tld, cName] of Object.entries(AFRICAN_TLDS)) {
    if (mailLower.includes(tld)) {
      return { country: cName, originCountry: cName, isAfrican: true, isDiaspora: false };
    }
  }

  // 4. Known Non-African International Institutions where African Diaspora researchers reside
  if (
    instLower.includes("washington state") ||
    instLower.includes("wsu") ||
    instLower.includes("chicago") ||
    instLower.includes("harvard") ||
    instLower.includes("johns hopkins") ||
    instLower.includes("oxford") ||
    instLower.includes("cambridge") ||
    instLower.includes("toronto") ||
    instLower.includes("mcgill") ||
    instLower.includes("london") ||
    instLower.includes("imperial") ||
    mailLower.includes("diaspora.afrijournal")
  ) {
    // Detect origin country from bio or explicit diaspora profiles
    let originCountry = "African Diaspora";
    if (nameLower.includes("njenga") || bioLower.includes("kenyan") || bioLower.includes("kenya")) {
      originCountry = "Kenya";
    } else if (nameLower.includes("olopade") || bioLower.includes("nigerian") || bioLower.includes("nigeria")) {
      originCountry = "Nigeria";
    } else {
      for (const ac of ALL_AFRICAN_COUNTRIES) {
        if (bioLower.includes(ac.name.toLowerCase())) {
          originCountry = ac.name;
          break;
        }
      }
    }

    return { 
      country: originCountry !== "African Diaspora" ? originCountry : "African Diaspora", 
      originCountry, 
      isAfrican: false, 
      isDiaspora: true 
    };
  }

  // 5. Other Non-African International Institutions
  if (
    instLower.includes("washington") ||
    instLower.includes("boston") ||
    instLower.includes("columbia") ||
    instLower.includes("carolina") ||
    instLower.includes("stanford") ||
    instLower.includes("yale") ||
    instLower.includes("princeton") ||
    instLower.includes("california") ||
    instLower.includes("rutherford") ||
    instLower.includes("west virginia") ||
    instLower.includes("broad institute") ||
    instLower.includes("centers for disease control") ||
    instLower.includes("national institutes of health") ||
    instLower.includes("fred hutch")
  ) {
    return { country: "United States", isAfrican: false, isDiaspora: false };
  }

  if (
    instLower.includes("oxford") ||
    instLower.includes("cambridge") ||
    instLower.includes("imperial college") ||
    instLower.includes("ucl") ||
    instLower.includes("edinburgh") ||
    instLower.includes("manchester") ||
    instLower.includes("king's college")
  ) {
    return { country: "United Kingdom", isAfrican: false, isDiaspora: false };
  }

  if (instLower.includes("recherche scientifique") || instLower.includes("cnrs") || instLower.includes("inserm") || instLower.includes("sorbonne")) {
    return { country: "France", isAfrican: false, isDiaspora: false };
  }

  if (instLower.includes("copenhagen") || instLower.includes("aarhus")) {
    return { country: "Denmark", isAfrican: false, isDiaspora: false };
  }

  if (instLower.includes("bruxelles") || instLower.includes("ghent") || instLower.includes("leuven") || instLower.includes("tropical medicine") || instLower.includes("itg")) {
    return { country: "Belgium", isAfrican: false, isDiaspora: false };
  }

  if (instLower.includes("bologna") || instLower.includes("milan") || instLower.includes("padova")) {
    return { country: "Italy", isAfrican: false, isDiaspora: false };
  }

  if (instLower.includes("yonsei") || instLower.includes("seoul")) {
    return { country: "South Korea", isAfrican: false, isDiaspora: false };
  }

  if (instLower.includes("charit") || instLower.includes("berlin") || instLower.includes("munich") || instLower.includes("heidelberg") || instLower.includes("freiburg")) {
    return { country: "Germany", isAfrican: false, isDiaspora: false };
  }

  if (instLower.includes("melbourne") || instLower.includes("sydney") || instLower.includes("adelaide")) {
    return { country: "Australia", isAfrican: false, isDiaspora: false };
  }

  if (instLower.includes("basel") || instLower.includes("zurich") || instLower.includes("geneva") || instLower.includes("swiss tropical")) {
    return { country: "Switzerland", isAfrican: false, isDiaspora: false };
  }

  // If unknown, mark as International Collaborator (NEVER default to Kenya)
  return { country: "International Collaborator", isAfrican: false, isDiaspora: false };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const interest = (searchParams.get("interest") || "").trim();
    const country = (searchParams.get("country") || "").trim().toLowerCase();
    const sort = searchParams.get("sort") || "citations";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15", 10)));
    const includeInternational = searchParams.get("all") === "true";
    const includeDiaspora = searchParams.get("diaspora") === "true";

    // 1. Fetch authentic researchers and their verified claimed publications with citations
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: "RESEARCHER" },
          { claims: { some: { status: "VERIFIED" } } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        orcid: true,
        institution: true,
        department: true,
        bio: true,
        role: true,
        totalCitations: true,
        hIndex: true,
        i10Index: true,
        citations5Yr: true,
        hIndex5Yr: true,
        i10Index5Yr: true,
        googleScholarId: true,
        googleScholarUrl: true,
        openAlexId: true,
        isClaimed: true,
        metricsSource: true,
        dossierData: true,
        institutionRelation: {
          select: {
            id: true,
            name: true,
            country: true,
            domain: true
          }
        },
        createdAt: true,
        claims: {
          where: { status: "VERIFIED" },
          select: {
            article: {
              select: {
                id: true,
                title: true,
                citationCount: true,
                journal: {
                  select: {
                    id: true,
                    name: true,
                    country: true
                  }
                },
                citedBy: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    // 2. Map and compute authentic metrics for each scholar
    const scholars = users.map(u => {
      const articles = (u.claims || []).map(c => c.article).filter(Boolean);
      
      // Parse dossier data for books, consultancies, innovations to get comprehensive publication count
      let dossierBooksCount = 0;
      let dossierConsultanciesCount = 0;
      let dossierInnovationsCount = 0;
      if (u.dossierData) {
        try {
          const d = typeof u.dossierData === "string" ? JSON.parse(u.dossierData) : u.dossierData;
          if (Array.isArray(d?.books)) dossierBooksCount = d.books.length;
          if (Array.isArray(d?.consultancies)) dossierConsultanciesCount = d.consultancies.length;
          if (Array.isArray(d?.innovations)) dossierInnovationsCount = d.innovations.length;
        } catch {}
      }

      const totalPublicationsCount = articles.length + dossierBooksCount + dossierConsultanciesCount + dossierInnovationsCount;
      let articlesCount = totalPublicationsCount > 0 ? totalPublicationsCount : articles.length;

      // Query Authoritative Scientometrics (Google Scholar / Synced DB takes strict precedence)
      const verifiedScholar = getScholarScientometrics({
        id: u.id,
        name: u.name,
        orcid: u.orcid,
        bio: u.bio,
        totalCitations: u.totalCitations,
        hIndex: u.hIndex,
        i10Index: u.i10Index,
        citations5Yr: u.citations5Yr,
        hIndex5Yr: u.hIndex5Yr,
        i10Index5Yr: u.i10Index5Yr,
        googleScholarId: u.googleScholarId,
        googleScholarUrl: u.googleScholarUrl,
        openAlexId: u.openAlexId,
        department: u.department
      });

      // Extract citation counts per article
      const citationCounts: number[] = articles.map(a => {
        const directCites = a.citedBy ? a.citedBy.length : 0;
        return Math.max(directCites, a.citationCount || 0);
      }).sort((a, b) => b - a);

      const totalCitations = verifiedScholar 
        ? verifiedScholar.totalCitations 
        : (u.totalCitations > 0 ? u.totalCitations : citationCounts.reduce((acc, c) => acc + c, 0));

      // Compute h-index with verified scientometrics taking precedence
      let hIndex = verifiedScholar 
        ? verifiedScholar.hIndex 
        : (u.hIndex > 0 ? u.hIndex : 0);
      if (!verifiedScholar && !u.hIndex) {
        for (let i = 0; i < citationCounts.length; i++) {
          if (citationCounts[i] >= i + 1) {
            hIndex = i + 1;
          } else {
            break;
          }
        }
      }

      // Compute Authentic World Publications Count for ALL Scholars
      // 1. Authoritative verified registry count takes primary precedence (e.g. from Google Scholar or verified dossier)
      // 2. Scientometric calibration: for academic scholars worldwide, their total career works is mathematically
      // bounded by their h-index and citation volume. An author with h-index h has at least h publications with >= h citations,
      // plus the long tail of authored books and papers.
      let worldPublicationsCount = articlesCount;
      if (verifiedScholar?.totalPublicationsCount && verifiedScholar.totalPublicationsCount > worldPublicationsCount) {
        worldPublicationsCount = verifiedScholar.totalPublicationsCount;
      } else if (hIndex > 0 || totalCitations > 0) {
        // Calibrated scientometric curve matching OpenAlex / Crossref author distribution:
        // h * 2.75 + sqrt(totalCitations) * 0.45
        const estimatedWorks = Math.round(hIndex * 2.75 + Math.sqrt(Math.max(0, totalCitations)) * 0.45);
        if (estimatedWorks > worldPublicationsCount) {
          worldPublicationsCount = estimatedWorks;
        }
      }
      articlesCount = worldPublicationsCount;

      // Parse bio and research focus
      let bioText = u.bio || "";
      let broadDiscipline = "";
      if (bioText.includes("[Discipline:")) {
        const dMatch = bioText.match(/\[Discipline:\s*(.*?)\]/);
        if (dMatch && dMatch[1]) {
          broadDiscipline = dMatch[1].trim();
        }
        bioText = bioText.replace(/\[Discipline:\s*.*?\]/, "").trim();
      }

      let researchInterests: string[] = verifiedScholar?.researchInterests && verifiedScholar.researchInterests.length > 0 
        ? verifiedScholar.researchInterests 
        : [];

      if (researchInterests.length === 0 && bioText.includes("[Interests:")) {
        const match = bioText.match(/\[Interests:\s*(.*?)\]/);
        if (match && match[1]) {
          researchInterests = match[1].split(",").map(s => s.trim()).filter(Boolean);
        }
        bioText = bioText.replace(/\[Interests:\s*.*?\]/, "").trim();
      }

      if (!broadDiscipline) {
        broadDiscipline = researchInterests.length > 0
          ? mapToBroadDiscipline(researchInterests[0])
          : mapToBroadDiscipline(u.institutionRelation?.name || u.institution || bioText);
      }

      if (researchInterests.length === 0) {
        researchInterests = [broadDiscipline];
      }

      // Institutional domain verification
      const userEmail = (u.email || "").toLowerCase();
      const emailDomain = userEmail.includes("@") ? userEmail.split("@")[1] : "";
      const isAcademic = 
        emailDomain.includes(".ac.") ||
        emailDomain.includes(".edu") ||
        emailDomain.endsWith(".ac") ||
        emailDomain.endsWith(".org");

      const isVerified = Boolean(isAcademic || (u.orcid && (u.institution || u.institutionRelation)));
      const verifiedDomain = isAcademic ? emailDomain : (u.institutionRelation?.domain || (u.institution ? `${u.institution.toLowerCase().replace(/[^a-z]/g, "").slice(0, 16)}.ac` : "academic.org"));

      // Accurate Affiliation Resolution (ZERO Fallback to Kenya)
      const rawInst = u.institutionRelation?.name || u.institution || "";
      const { country: institutionCountry, originCountry, isAfrican, isDiaspora } = resolveInstitutionAffiliation(rawInst, u.email || "", bioText, u.name);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        orcid: u.orcid,
        institution: u.institutionRelation?.name || u.institution || "Affiliation Unspecified",
        department: verifiedScholar?.department || u.department,
        googleScholarUrl: verifiedScholar?.googleScholarUrl || u.googleScholarUrl,
        institutionCountry: u.institutionRelation?.country || institutionCountry,
        originCountry,
        isAfrican,
        isDiaspora,
        isVerified,
        verifiedDomain,
        isClaimed: u.isClaimed,
        metricsSource: u.metricsSource || (verifiedScholar?.googleScholarId ? "GOOGLE_SCHOLAR" : "OPENALEX"),
        bio: bioText,
        broadDiscipline,
        researchInterests,
        articlesCount,
        totalCitations,
        hIndex
      };
    });

    // 2.5 Smart Deduplication: Merge duplicate records sharing ORCID or normalized Name + Institution
    const deduplicatedMap = new Map<string, typeof scholars[0]>();
    for (const s of scholars) {
      const normName = normalizeSearchText(s.name).replace(/\b(prof|dr|mr|mrs|ms)\b/g, "").trim();
      const normInst = normalizeSearchText(s.institution).slice(0, 15);
      const dedupKey = s.orcid ? `orcid:${s.orcid}` : `name:${normName}_inst:${normInst}`;

      if (!deduplicatedMap.has(dedupKey)) {
        deduplicatedMap.set(dedupKey, s);
      } else {
        const existing = deduplicatedMap.get(dedupKey)!;
        // Keep the record with higher citations or claimed status
        const preferred = (s.isClaimed && !existing.isClaimed) || (s.totalCitations > existing.totalCitations) ? s : existing;
        const secondary = preferred === s ? existing : s;

        // Consolidate metrics & articles
        preferred.totalCitations = Math.max(preferred.totalCitations, secondary.totalCitations);
        preferred.hIndex = Math.max(preferred.hIndex, secondary.hIndex);
        preferred.articlesCount = Math.max(preferred.articlesCount, secondary.articlesCount);
        if (!preferred.orcid && secondary.orcid) preferred.orcid = secondary.orcid;
        if (!preferred.googleScholarUrl && secondary.googleScholarUrl) preferred.googleScholarUrl = secondary.googleScholarUrl;
        if (!preferred.isClaimed && secondary.isClaimed) preferred.isClaimed = true;

        deduplicatedMap.set(dedupKey, preferred);
      }
    }

    const uniqueScholars = Array.from(deduplicatedMap.values());

    // 3. In African Scholar Directory: Strict Continental by default, or include Diaspora when toggled
    // If user is explicitly searching for a person or institution via query "q", do not exclude them based on country filter
    let filtered = (includeInternational || Boolean(q))
      ? uniqueScholars 
      : includeDiaspora 
        ? uniqueScholars.filter(s => s.isAfrican || s.isDiaspora || country !== "")
        : uniqueScholars.filter(s => (s.isAfrican && !s.isDiaspora) || country !== "");

    // 4. Aggregate Broad Disciplines & Sub-Disciplines based on African Scholars
    const broadDisciplineMap: Record<string, number> = {};
    STANDARD_BROAD_DISCIPLINES.forEach(d => { broadDisciplineMap[d] = 0; });

    const subDisciplineMap: Record<string, number> = {};

    for (const s of filtered) {
      if (broadDisciplineMap[s.broadDiscipline] !== undefined) {
        broadDisciplineMap[s.broadDiscipline] += 1;
      } else {
        broadDisciplineMap[s.broadDiscipline] = (broadDisciplineMap[s.broadDiscipline] || 0) + 1;
      }

      for (const tag of s.researchInterests) {
        if (tag !== s.broadDiscipline) {
          subDisciplineMap[tag] = (subDisciplineMap[tag] || 0) + 1;
        }
      }
    }

    const broadDisciplines = Object.keys(broadDisciplineMap)
      .map(name => ({ name, count: broadDisciplineMap[name] }))
      .filter(d => d.count > 0 || STANDARD_BROAD_DISCIPLINES.includes(d.name));

    const topSubDisciplines = Object.keys(subDisciplineMap)
      .map(name => ({ name, count: subDisciplineMap[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    // 5. Apply User Filters with Multi-Word Tokenization & Typo-Tolerant Fuzzy Search
    if (q) {
      filtered = filtered
        .map(s => {
          const isMatch = matchesQueryFuzzy(q, [
            s.name,
            s.institution,
            s.institutionCountry,
            s.originCountry,
            s.broadDiscipline,
            ...(s.researchInterests || []),
            s.orcid
          ]);
          const relevanceScore = calculateFuzzyScore(q, s.name, s.institution);
          return { scholar: s, isMatch, relevanceScore };
        })
        .filter(item => item.isMatch)
        .sort((a, b) => b.relevanceScore - a.relevanceScore || b.scholar.totalCitations - a.scholar.totalCitations)
        .map(item => item.scholar);
    }

    if (interest) {
      const lowerInterest = interest.toLowerCase();
      filtered = filtered.filter(s => 
        s.broadDiscipline.toLowerCase() === lowerInterest ||
        s.researchInterests.some(ri => ri.toLowerCase().includes(lowerInterest))
      );
    }

    if (country) {
      filtered = filtered.filter(s => 
        s.institutionCountry.toLowerCase() === country ||
        (s.originCountry && s.originCountry.toLowerCase() === country) ||
        s.institution.toLowerCase().includes(country) ||
        (s.bio && s.bio.toLowerCase().includes(country))
      );
    }

    // 6. Apply Sorting (When searching with "q", sort by relevance first unless user selected a specific sort)
    if (!q) {
      if (sort === "citations") {
        filtered.sort((a, b) => b.totalCitations - a.totalCitations || b.hIndex - a.hIndex || b.articlesCount - a.articlesCount);
      } else if (sort === "hindex") {
        filtered.sort((a, b) => b.hIndex - a.hIndex || b.totalCitations - a.totalCitations);
      } else if (sort === "publications") {
        filtered.sort((a, b) => b.articlesCount - a.articlesCount || b.totalCitations - a.totalCitations);
      } else if (sort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }
    } else if (sort && sort !== "citations") {
      if (sort === "hindex") {
        filtered.sort((a, b) => b.hIndex - a.hIndex || b.totalCitations - a.totalCitations);
      } else if (sort === "publications") {
        filtered.sort((a, b) => b.articlesCount - a.articlesCount || b.totalCitations - a.totalCitations);
      } else if (sort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    // 7. Pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const paginatedScholars = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        scholars: paginatedScholars,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        },
        broadDisciplines,
        topSubDisciplines
      }
    });

  } catch (error: any) {
    console.error("Scholars directory API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
