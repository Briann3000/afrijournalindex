import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";
import { ZenodoClient, ZenodoArticleMetadata } from "@/lib/zenodo";

// STRICT WHITELIST: Only officially agreed/contracted journals can mint DOIs
// Currently only ARJESS is authorized
const AUTHORIZED_JOURNALS_MAP: Record<string, { name: string; communitySlug: string; issn?: string }> = {
  "264679fc-eb2d-4d55-b26e-3204dd06b46a": {
    name: "African Research Journal of Education and Social Sciences (ARJESS)",
    communitySlug: "arjess",
    issn: "2312-0134"
  }
};

/**
 * Maps raw database / submission timestamps to official journal issue publication dates.
 * ARJESS publication schedule:
 * - Issue 1: April 30 (YYYY-04-30)
 * - Issue 2: August 30 (YYYY-08-30)
 * - Issue 3 / 4: December 30 (YYYY-12-30)
 */
function getOfficialJournalPublicationDate(rawDate?: Date | string | null, explicitDate?: string | null): string {
  if (explicitDate && /^\d{4}-\d{2}-\d{2}$/.test(explicitDate.trim())) {
    return explicitDate.trim();
  }

  const d = rawDate ? new Date(rawDate) : new Date();
  const year = !isNaN(d.getFullYear()) ? d.getFullYear() : 2024;
  const month = !isNaN(d.getMonth()) ? d.getMonth() + 1 : 8; // 1-12

  if (month <= 4) {
    return `${year}-04-30`;
  } else if (month <= 8) {
    return `${year}-08-30`;
  } else {
    return `${year}-12-30`;
  }
}

/**
 * Authentication Gate: Verifies active Admin session
 */
async function getAdminUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("afriJournalSession");
  const token = sessionCookie?.value;

  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true }
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

/**
 * GET: Lists articles for an authorized journal with minting status
 * Query params:
 *  - journalId: string (required)
 *  - status: "all" | "pending" | "minted" (default: "pending")
 *  - page: number
 *  - limit: number
 */
export async function GET(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const journalId = searchParams.get("journalId");
    const status = searchParams.get("status") || "pending";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    if (!journalId) {
      // Return list of authorized journals with their counts
      const authorizedList = [];
      for (const [jId, config] of Object.entries(AUTHORIZED_JOURNALS_MAP)) {
        const total = await prisma.article.count({ where: { journalId: jId } });
        const minted = await prisma.article.count({ where: { journalId: jId, doi: { not: null } } });
        authorizedList.push({
          journalId: jId,
          name: config.name,
          communitySlug: config.communitySlug,
          issn: config.issn,
          totalArticles: total,
          mintedArticles: minted,
          pendingArticles: total - minted
        });
      }

      const client = new ZenodoClient();
      return NextResponse.json({
        success: true,
        environment: client.getEnvironment(),
        authorizedJournals: authorizedList
      });
    }

    // Check Journal Whitelist
    const journalConfig = AUTHORIZED_JOURNALS_MAP[journalId];
    if (!journalConfig) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Forbidden. DOI automated minting is not authorized for this journal. A formal publisher agreement and communication is required." 
        },
        { status: 403 }
      );
    }

    const whereClause: any = { journalId };
    if (status === "pending") {
      whereClause.doi = null;
    } else if (status === "minted") {
      whereClause.doi = { not: null };
    }

    const [total, articles] = await Promise.all([
      prisma.article.count({ where: whereClause }),
      prisma.article.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          doi: true,
          pdfUrl: true,
          publishDate: true,
          abstract: true,
          claims: {
            where: { status: "VERIFIED" },
            select: {
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  institution: true,
                  orcid: true
                }
              }
            }
          }
        },
        orderBy: { publishDate: "desc" },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    const client = new ZenodoClient();

    return NextResponse.json({
      success: true,
      environment: client.getEnvironment(),
      journal: journalConfig,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      articles: articles.map((a: any) => ({
        id: a.id,
        title: a.title,
        doi: a.doi,
        pdfUrl: a.pdfUrl,
        publishDate: a.publishDate,
        officialPublishDate: getOfficialJournalPublicationDate(a.publishDate),
        hasAbstract: Boolean(a.abstract),
        authors: (a.claims || []).map((c: any) => ({
          name: c.user?.name,
          institution: c.user?.institution,
          orcid: c.user?.orcid,
          role: c.role
        }))
      }))
    });
  } catch (err: any) {
    console.error("[DOI Admin GET] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Mints DOI via Zenodo for one or multiple articles
 * Body:
 *  - articleId: string (for single article minting)
 *  - articleIds: string[] (for batch minting)
 *  - overrideAuthors?: Array<{ name: string; affiliation?: string; orcid?: string }>
 */
export async function POST(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const articleId: string | undefined = body.articleId;
    const articleIds: string[] = Array.isArray(body.articleIds) ? body.articleIds : (articleId ? [articleId] : []);
    const datesMap: Record<string, string> = body.datesMap || {}; // Map of articleId -> specific official publication date (YYYY-MM-DD)
    const explicitPublishDate: string | undefined = body.publicationDate;

    if (articleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: articleId or articleIds" },
        { status: 400 }
      );
    }

    // Cap batch size to avoid timeout/rate limits
    const BATCH_LIMIT = 10;
    const targetIds = articleIds.slice(0, BATCH_LIMIT);

    // Fetch articles from database
    const articles = await prisma.article.findMany({
      where: {
        id: { in: targetIds }
      },
      include: {
        journal: true,
        claims: {
          where: { status: "VERIFIED" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                institution: true,
                orcid: true
              }
            }
          }
        }
      }
    });

    if (articles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No matching articles found in database." },
        { status: 404 }
      );
    }

    const client = new ZenodoClient();
    const results: Array<{
      articleId: string;
      title: string;
      success: boolean;
      doi?: string;
      recordUrl?: string;
      error?: string;
    }> = [];

    for (const art of articles) {
      // 1. Verify Journal Whitelist Guard
      const journalConfig = AUTHORIZED_JOURNALS_MAP[art.journalId];
      if (!journalConfig) {
        results.push({
          articleId: art.id,
          title: art.title,
          success: false,
          error: `Journal "${art.journal?.name || art.journalId}" is not whitelisted for automated DOI minting.`
        });
        continue;
      }

      // 2. Skip if already has a persistent DOI
      if (art.doi) {
        results.push({
          articleId: art.id,
          title: art.title,
          success: true,
          doi: art.doi,
          error: "Article already has a registered DOI."
        });
        continue;
      }

      // 3. Ensure valid PDF URL exists
      if (!art.pdfUrl) {
        results.push({
          articleId: art.id,
          title: art.title,
          success: false,
          error: "Article has no valid PDF URL attached."
        });
        continue;
      }

      // 4. Assemble authors / creators
      let creators: Array<{ name: string; affiliation?: string; orcid?: string }> = [];

      if (body.overrideAuthors && Array.isArray(body.overrideAuthors) && body.overrideAuthors.length > 0 && articles.length === 1) {
        creators = body.overrideAuthors;
      } else if (art.claims && art.claims.length > 0) {
        creators = art.claims.map((c: any) => ({
          name: c.user?.name || "Author",
          affiliation: c.user?.institution || art.journal?.name || "Academic Institution",
          orcid: c.user?.orcid || undefined
        }));
      }

      // Fallback creator if none claimed yet
      if (creators.length === 0) {
        creators = [
          {
            name: `${art.journal?.name || "AfriJournal"} Editorial Desk`,
            affiliation: art.journal?.publisherName || art.journal?.name || "African Academic Publisher"
          }
        ];
      }

      // Format publication date according to journal issue schedule
      const targetDateOverride = datesMap[art.id] || explicitPublishDate;
      const pubDateStr = getOfficialJournalPublicationDate(art.publishDate, targetDateOverride);

      const metadata: ZenodoArticleMetadata = {
        title: art.title,
        description: art.abstract 
          ? `<p>${art.abstract.replace(/\n\n+/g, "</p><p>")}</p>` 
          : `<p>Research article published in <em>${art.journal?.name || journalConfig.name}</em>.</p>`,
        publication_date: pubDateStr,
        creators,
        journal_title: art.journal?.name || journalConfig.name,
        journal_issn: art.journal?.issn || journalConfig.issn,
        community_slug: journalConfig.communitySlug,
        access_right: "open",
        license: "cc-by-4.0",
        keywords: [art.journal?.name || "African Research", "Peer-Reviewed Article", "AfriJournal Index"]
      };

      try {
        const mintResult = await client.mintArticleDoi({
          pdfUrl: art.pdfUrl,
          metadata,
          autoPublish: true
        });

        if (mintResult.success && mintResult.doi) {
          // Persist DOI to MariaDB database
          await prisma.article.update({
            where: { id: art.id },
            data: {
              doi: mintResult.doi,
              url: mintResult.recordUrl || art.url
            }
          });

          results.push({
            articleId: art.id,
            title: art.title,
            success: true,
            doi: mintResult.doi,
            recordUrl: mintResult.recordUrl
          });
        } else {
          results.push({
            articleId: art.id,
            title: art.title,
            success: false,
            error: mintResult.error || "Zenodo minting failed"
          });
        }
      } catch (e: any) {
        results.push({
          articleId: art.id,
          title: art.title,
          success: false,
          error: e.message || "Failed processing article"
        });
      }

      // Gentle rate-limiting pause between articles in a batch (2.5 seconds)
      if (targetIds.length > 1) {
        await new Promise(res => setTimeout(res, 2500));
      }
    }

    return NextResponse.json({
      success: true,
      environment: client.getEnvironment(),
      processedCount: results.length,
      successCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results
    });
  } catch (err: any) {
    console.error("[DOI Admin POST] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
