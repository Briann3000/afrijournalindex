import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { tokenizeQuery, matchesQueryFuzzy, calculateFuzzyScore, normalizeSearchText } from "../../../lib/fuzzy-search";

export const dynamic = "force-dynamic";

/**
 * Builds a safe MySQL Boolean Mode Fulltext query string.
 * Strips syntax characters and attaches prefix wildcard (*) for substring/stem matching.
 */
function buildBooleanFulltextQuery(query: string): string {
  const trimmed = query.trim();
  // Preserve exact phrase queries wrapped in quotes
  if (/^".+"$/.test(trimmed) && trimmed.length > 2) {
    const inner = trimmed.slice(1, -1).replace(/["*+\-<>~()@]/g, " ").trim();
    return inner.length > 0 ? `"${inner}"` : "";
  }

  // Strip special MySQL boolean operators
  const sanitized = trimmed.replace(/["*+\-<>~()@]/g, " ").trim();
  const words = sanitized
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  if (words.length === 0) return "";
  return words.map((w) => `+${w}*`).join(" ");
}

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const typeParam = (searchParams.get("type") || "all").toLowerCase();
    const validTypes = ["all", "articles", "journals", "scholars"];
    const type = validTypes.includes(typeParam) ? typeParam : "all";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const defaultLimit = type === "all" ? 10 : 20;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10)));
    const offset = (page - 1) * limit;

    if (!q) {
      return NextResponse.json({
        success: true,
        query: "",
        type,
        page: 1,
        limit,
        totalPages: 0,
        latencyMs: 0,
        journals: [],
        scholars: [],
        articles: [],
        totalJournals: 0,
        totalScholars: 0,
        totalArticles: 0
      });
    }

    const tokens = tokenizeQuery(q);
    const cleanQ = q.replace(/^["']|["']$/g, "").trim();
    const upperCleanQ = cleanQ.toUpperCase();
    const isDirectAsidQuery = upperCleanQ.startsWith("ASID-") || /^ASID/i.test(upperCleanQ);

    // ==========================================
    // 0. High-Priority Direct ASID Interceptor (<1ms)
    // ==========================================
    if (isDirectAsidQuery) {
      const exactScholar = await prisma.user.findFirst({
        where: { afriScholarId: upperCleanQ },
        select: {
          id: true,
          name: true,
          email: true,
          afriScholarId: true,
          orcid: true,
          institution: true,
          department: true,
          bio: true,
          isClaimed: true,
          totalCitations: true,
          hIndex: true,
          i10Index: true,
          claims: {
            where: { status: "VERIFIED" },
            select: {
              article: {
                select: {
                  id: true,
                  title: true,
                  doi: true,
                  publishDate: true,
                  citationCount: true,
                  journal: {
                    select: {
                      id: true,
                      name: true,
                      country: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (exactScholar && exactScholar.afriScholarId) {
        const scholarArticles = (exactScholar.claims || []).map((c) => c.article).filter(Boolean);
        const formattedScholarItem = {
          id: exactScholar.id,
          name: exactScholar.name,
          email: exactScholar.email,
          afriScholarId: exactScholar.afriScholarId,
          institution: exactScholar.institution || "African University",
          broadDiscipline: exactScholar.department || "Academic Research",
          articlesCount: scholarArticles.length,
          totalCitations: exactScholar.totalCitations || 0,
          hIndex: exactScholar.hIndex || 0,
          orcid: exactScholar.orcid,
          isClaimed: exactScholar.isClaimed,
          isExactAsid: true,
          score: 100000
        };

        const mappedArticles = scholarArticles.map((a) => ({
          id: a.id,
          title: a.title,
          doi: a.doi,
          abstract: null,
          url: null,
          pdfUrl: null,
          publishDate: a.publishDate ? a.publishDate.toISOString() : null,
          year: a.publishDate ? new Date(a.publishDate).getFullYear() : null,
          citationCount: a.citationCount || 0,
          journal: a.journal,
          isMatch: true,
          score: 1000
        }));

        return NextResponse.json({
          success: true,
          query: q,
          type,
          page: 1,
          limit,
          totalPages: 1,
          latencyMs: Date.now() - startTime,
          directAsidMatch: true,
          journals: [],
          scholars: [formattedScholarItem],
          articles: mappedArticles,
          totalJournals: 0,
          totalScholars: 1,
          totalArticles: mappedArticles.length
        });
      }
    }

    const shouldSearchJournals = type === "all" || type === "journals";
    const shouldSearchScholars = type === "all" || type === "scholars";
    const shouldSearchArticles = type === "all" || type === "articles";

    // ==========================================
    // 1. Search Journals (Fast Index + Fuzzy Scoring)
    // ==========================================
    let scoredJournals: any[] = [];
    let totalJournalsCount = 0;

    if (shouldSearchJournals) {
      const journalCandidateOrs: any[] = [
        { name: { contains: cleanQ } },
        { publisherName: { contains: cleanQ } },
        { issn: { contains: cleanQ } },
        { eissn: { contains: cleanQ } },
        { country: { contains: cleanQ } }
      ];

      for (const t of tokens) {
        if (t.length > 2) {
          journalCandidateOrs.push({ name: { contains: t } });
          journalCandidateOrs.push({ publisherName: { contains: t } });
        }
      }

      const journalTake = type === "journals" ? limit : 25;
      const journalSkip = type === "journals" ? offset : 0;

      const [journalsRaw, jCount] = await Promise.all([
        prisma.journal.findMany({
          where: { OR: journalCandidateOrs },
          take: journalTake,
          skip: journalSkip,
          select: {
            id: true,
            name: true,
            publisherName: true,
            country: true,
            qualityGrade: true,
            issn: true,
            eissn: true,
            isIndexed: true,
            reports: {
              orderBy: { year: "desc" },
              take: 1,
              select: {
                standardScore: true
              }
            }
          }
        }),
        type === "journals"
          ? prisma.journal.count({ where: { OR: journalCandidateOrs } })
          : Promise.resolve(0)
      ]);

      scoredJournals = journalsRaw.map((j) => {
        const isMatch = matchesQueryFuzzy(q, [j.name, j.publisherName, j.issn, j.country]);
        const score = calculateFuzzyScore(q, j.name, (j.publisherName || "") + " " + (j.country || ""));
        return {
          id: j.id,
          name: j.name,
          publisherName: j.publisherName,
          country: j.country,
          qualityGrade: j.qualityGrade || "B",
          issn: j.issn || j.eissn,
          ajciScore: j.reports[0]?.standardScore || null,
          isMatch,
          score
        };
      }).sort((a, b) => b.score - a.score);

      totalJournalsCount = type === "journals" ? jCount : scoredJournals.length;
    }

    // ==========================================
    // 2. Search Scholars (Targeted Index + Fuzzy Scoring)
    // ==========================================
    let formattedScholars: any[] = [];
    let totalScholarsCount = 0;

    if (shouldSearchScholars) {
      const scholarConditions: any[] = [
        { name: { contains: cleanQ } },
        { afriScholarId: { contains: cleanQ } },
        { institution: { contains: cleanQ } }
      ];

      for (const t of tokens) {
        if (t.length > 2) {
          scholarConditions.push({ name: { contains: t } });
        }
      }

      const scholarTake = type === "scholars" ? limit : 30;
      const scholarSkip = type === "scholars" ? offset : 0;

      const [scholarsRaw, sCount] = await Promise.all([
        prisma.user.findMany({
          where: { OR: scholarConditions },
          take: scholarTake,
          skip: scholarSkip,
          select: {
            id: true,
            name: true,
            email: true,
            afriScholarId: true,
            orcid: true,
            openAlexId: true,
            institution: true,
            department: true,
            bio: true,
            isClaimed: true,
            totalCitations: true,
            hIndex: true,
            i10Index: true,
            dossierData: true,
            claims: {
              where: { status: "VERIFIED" },
              select: { articleId: true }
            }
          }
        }),
        type === "scholars"
          ? prisma.user.count({ where: { OR: scholarConditions } })
          : Promise.resolve(0)
      ]);

      const dedupScholarMap = new Map<string, any>();

      for (const u of scholarsRaw) {
        const isMatch = matchesQueryFuzzy(q, [u.name, u.institution, u.department, u.afriScholarId, u.orcid]);
        let score = calculateFuzzyScore(q, u.name, (u.institution || "") + " " + (u.department || ""));

        const isExactAsid = Boolean(u.afriScholarId && u.afriScholarId.toUpperCase() === upperCleanQ);
        if (isExactAsid) score += 10000;

        const isExactName = u.name.toLowerCase() === cleanQ.toLowerCase();
        if (isExactName) score += 500;

        let broadDiscipline = "Health Sciences";
        if (u.bio && u.bio.includes("[Discipline:")) {
          const dMatch = u.bio.match(/\[Discipline:\s*(.*?)\]/);
          if (dMatch && dMatch[1]) broadDiscipline = dMatch[1].trim();
        }

        const scholarItem = {
          id: u.id,
          name: u.name,
          email: u.email,
          afriScholarId: u.afriScholarId,
          institution: u.institution || "African University",
          broadDiscipline,
          articlesCount: u.claims.length || (u.hIndex > 0 ? Math.max(1, Math.round(u.hIndex * 1.8)) : 10),
          totalCitations: u.totalCitations || 0,
          hIndex: u.hIndex || 0,
          orcid: u.orcid,
          isClaimed: u.isClaimed,
          isExactAsid,
          score
        };

        const dedupKey = u.afriScholarId ? `asid:${u.afriScholarId}` : `id:${u.id}`;
        if (!dedupScholarMap.has(dedupKey) || score > dedupScholarMap.get(dedupKey).score) {
          dedupScholarMap.set(dedupKey, scholarItem);
        }
      }

      formattedScholars = Array.from(dedupScholarMap.values())
        .sort((a, b) => b.score - a.score || b.totalCitations - a.totalCitations);

      totalScholarsCount = type === "scholars" ? sCount : formattedScholars.length;
    }

    // ==========================================
    // 3. Search Articles (MySQL Native FULLTEXT Engine: Sub-20ms)
    // ==========================================
    let formattedArticles: any[] = [];
    let totalArticlesCount = 0;

    if (shouldSearchArticles) {
      const isDoi = cleanQ.startsWith("10.") || cleanQ.includes("doi.org/");
      const bareDoi = cleanQ.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").trim();

      // Tier 0: Direct Indexed DOI Fast-Path
      if (isDoi || bareDoi.length > 7) {
        const doiArticles: any[] = (await prisma.$queryRaw<any[]>`
          SELECT 
            a.id, a.title, a.doi, a.abstract, a.url, a.pdfUrl, a.publishDate, a.citationCount,
            j.id AS journalId, j.name AS journalName, j.country AS journalCountry,
            j.qualityGrade AS journalQualityGrade, j.issn AS journalIssn, j.eissn AS journalEissn
          FROM article a
          JOIN journal j ON a.journalId = j.id
          WHERE a.doi = ${bareDoi} OR a.doi LIKE ${`%${bareDoi}%`}
          LIMIT ${limit} OFFSET ${offset}
        `) || [];

        if (doiArticles.length > 0) {
          formattedArticles = doiArticles.map((a) => {
            let snippet = "";
            if (a.abstract) {
              const cleanAbs = a.abstract.replace(/<[^>]*>?/gm, "").trim();
              snippet = cleanAbs.length > 240 ? cleanAbs.slice(0, 240) + "..." : cleanAbs;
            }
            return {
              id: a.id,
              title: a.title,
              doi: a.doi,
              abstract: snippet,
              url: a.url,
              pdfUrl: a.pdfUrl,
              publishDate: a.publishDate ? new Date(a.publishDate).toISOString() : null,
              year: a.publishDate ? new Date(a.publishDate).getFullYear() : null,
              citationCount: a.citationCount || 0,
              journal: {
                id: a.journalId,
                name: a.journalName,
                country: a.journalCountry,
                qualityGrade: a.journalQualityGrade,
                issn: a.journalIssn,
                eissn: a.journalEissn
              },
              isMatch: true,
              score: 10000
            };
          });
          totalArticlesCount = formattedArticles.length;
        }
      }

      // Tier 1: High-Speed MySQL Inverted FULLTEXT Search
      if (formattedArticles.length === 0) {
        const booleanQuery = buildBooleanFulltextQuery(cleanQ);

        if (booleanQuery) {
          try {
            const articleLimit = type === "articles" ? limit : 20;
            const articleOffset = type === "articles" ? offset : 0;

            const [articlesRaw, countRows] = (await Promise.all([
              prisma.$queryRaw<any[]>`
                SELECT 
                  a.id, a.title, a.doi, a.abstract, a.url, a.pdfUrl, a.publishDate, a.citationCount,
                  j.id AS journalId, j.name AS journalName, j.country AS journalCountry,
                  j.qualityGrade AS journalQualityGrade, j.issn AS journalIssn, j.eissn AS journalEissn,
                  MATCH(a.title, a.abstract) AGAINST (${booleanQuery} IN BOOLEAN MODE) AS score
                FROM article a
                JOIN journal j ON a.journalId = j.id
                WHERE MATCH(a.title, a.abstract) AGAINST (${booleanQuery} IN BOOLEAN MODE)
                ORDER BY score DESC, a.citationCount DESC
                LIMIT ${articleLimit} OFFSET ${articleOffset}
              `,
              type === "articles"
                ? prisma.$queryRaw<any[]>`
                    SELECT COUNT(*) as total
                    FROM article
                    WHERE MATCH(title, abstract) AGAINST (${booleanQuery} IN BOOLEAN MODE)
                  `
                : Promise.resolve([{ total: 0 }])
            ])) as [any[], any[]];

            if (articlesRaw.length > 0) {
              formattedArticles = articlesRaw.map((a) => {
                let snippet = "";
                if (a.abstract) {
                  const cleanAbs = a.abstract.replace(/<[^>]*>?/gm, "").trim();
                  snippet = cleanAbs.length > 240 ? cleanAbs.slice(0, 240) + "..." : cleanAbs;
                }
                return {
                  id: a.id,
                  title: a.title,
                  doi: a.doi,
                  abstract: snippet,
                  url: a.url,
                  pdfUrl: a.pdfUrl,
                  publishDate: a.publishDate ? new Date(a.publishDate).toISOString() : null,
                  year: a.publishDate ? new Date(a.publishDate).getFullYear() : null,
                  citationCount: a.citationCount || 0,
                  journal: {
                    id: a.journalId,
                    name: a.journalName,
                    country: a.journalCountry,
                    qualityGrade: a.journalQualityGrade,
                    issn: a.journalIssn,
                    eissn: a.journalEissn
                  },
                  isMatch: true,
                  score: Number(a.score) || 50
                };
              });

              totalArticlesCount = type === "articles" ? Number(countRows[0]?.total || articlesRaw.length) : articlesRaw.length;
            }
          } catch (fulltextErr) {
            console.warn("Fulltext query failed, falling back to title lookup:", fulltextErr);
          }
        }

        // Tier 2: Acronym / Short Query Fallback (Title-Only, Skips Abstract Scan)
        if (formattedArticles.length === 0 && cleanQ.length >= 2) {
          const articleLimit = type === "articles" ? limit : 20;
          const articleOffset = type === "articles" ? offset : 0;
          const titlePattern = `%${cleanQ}%`;

          const [fallbackRows, fallbackCount] = (await Promise.all([
            prisma.$queryRaw<any[]>`
              SELECT 
                a.id, a.title, a.doi, a.abstract, a.url, a.pdfUrl, a.publishDate, a.citationCount,
                j.id AS journalId, j.name AS journalName, j.country AS journalCountry,
                j.qualityGrade AS journalQualityGrade, j.issn AS journalIssn, j.eissn AS journalEissn,
                50 AS score
              FROM article a
              JOIN journal j ON a.journalId = j.id
              WHERE a.title LIKE ${titlePattern}
              ORDER BY a.citationCount DESC
              LIMIT ${articleLimit} OFFSET ${articleOffset}
            `,
            type === "articles"
              ? prisma.$queryRaw<any[]>`
                  SELECT COUNT(*) as total
                  FROM article
                  WHERE title LIKE ${titlePattern}
                `
              : Promise.resolve([{ total: 0 }])
          ])) as [any[], any[]];

          formattedArticles = fallbackRows.map((a) => {
            let snippet = "";
            if (a.abstract) {
              const cleanAbs = a.abstract.replace(/<[^>]*>?/gm, "").trim();
              snippet = cleanAbs.length > 240 ? cleanAbs.slice(0, 240) + "..." : cleanAbs;
            }
            return {
              id: a.id,
              title: a.title,
              doi: a.doi,
              abstract: snippet,
              url: a.url,
              pdfUrl: a.pdfUrl,
              publishDate: a.publishDate ? new Date(a.publishDate).toISOString() : null,
              year: a.publishDate ? new Date(a.publishDate).getFullYear() : null,
              citationCount: a.citationCount || 0,
              journal: {
                id: a.journalId,
                name: a.journalName,
                country: a.journalCountry,
                qualityGrade: a.journalQualityGrade,
                issn: a.journalIssn,
                eissn: a.journalEissn
              },
              isMatch: true,
              score: 50
            };
          });

          totalArticlesCount = type === "articles" ? Number(fallbackCount[0]?.total || fallbackRows.length) : fallbackRows.length;
        }
      }
    }

    const hasDirectAsidMatch = formattedScholars.length > 0 && Boolean(formattedScholars[0].isExactAsid);
    const latencyMs = Date.now() - startTime;

    const totalActiveCount =
      type === "articles"
        ? totalArticlesCount
        : type === "journals"
        ? totalJournalsCount
        : type === "scholars"
        ? totalScholarsCount
        : totalArticlesCount + totalJournalsCount + totalScholarsCount;

    const totalPages = Math.max(1, Math.ceil(totalActiveCount / limit));

    return NextResponse.json({
      success: true,
      query: q,
      type,
      page,
      limit,
      totalPages,
      latencyMs,
      directAsidMatch: hasDirectAsidMatch,
      journals: type === "all" ? scoredJournals.slice(0, 8) : scoredJournals,
      scholars: type === "all" ? formattedScholars.slice(0, 12) : formattedScholars,
      articles: type === "all" ? formattedArticles.slice(0, 20) : formattedArticles,
      totalJournals: totalJournalsCount,
      totalScholars: totalScholarsCount,
      totalArticles: totalArticlesCount
    });

  } catch (error: any) {
    console.error("Optimized Search API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
