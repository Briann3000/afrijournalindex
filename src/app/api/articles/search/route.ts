import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// Helper to clean and extract bare DOI if user enters full URL, doi: prefix, or quotes
function extractBareDOI(input: string): string {
  let cleaned = input.trim();
  // Remove wrapping quotes: "10.xxx" or '10.xxx'
  cleaned = cleaned.replace(/^["']|["']$/g, "");
  cleaned = cleaned.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  cleaned = cleaned.replace(/^doi:\s*/i, "");
  return cleaned.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get("q")?.trim() || "";
    const country = searchParams.get("country")?.trim() || "";
    const hasPdf = searchParams.get("hasPdf") === "true";
    const yearStr = searchParams.get("year")?.trim();
    const sortBy = searchParams.get("sortBy")?.trim() || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (rawQ) {
      // Clean query of quotes
      const cleanQ = rawQ.replace(/^["']|["']$/g, "").trim();
      const bareDoi = extractBareDOI(rawQ);
      const isDoiPattern = bareDoi.startsWith("10.") || rawQ.includes("doi.org/");

      const orConditions: any[] = [
        { title: { contains: cleanQ } },
        { abstract: { contains: cleanQ } },
        { doi: { contains: bareDoi } },
        { journal: { name: { contains: cleanQ } } },
        { journal: { issn: { contains: cleanQ } } },
        { journal: { eissn: { contains: cleanQ } } }
      ];

      if (isDoiPattern) {
        orConditions.unshift({ doi: { equals: bareDoi } });
      }

      whereClause.OR = orConditions;
    }

    if (country) {
      whereClause.journal = {
        ...(whereClause.journal || {}),
        country: { equals: country }
      };
    }

    if (hasPdf) {
      whereClause.pdfUrl = { not: null };
    }

    if (yearStr && !isNaN(parseInt(yearStr, 10))) {
      const yearInt = parseInt(yearStr, 10);
      whereClause.publishDate = {
        gte: new Date(`${yearInt}-01-01T00:00:00.000Z`),
        lte: new Date(`${yearInt}-12-31T23:59:59.999Z`)
      };
    }

    let orderByClause: any = { publishDate: "desc" };
    if (sortBy === "oldest") {
      orderByClause = { publishDate: "asc" };
    } else if (sortBy === "citations") {
      orderByClause = { citationCount: "desc" };
    } else if (sortBy === "title") {
      orderByClause = { title: "asc" };
    }

    const [total, articles] = await Promise.all([
      prisma.article.count({ where: whereClause }),
      prisma.article.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: orderByClause,
        include: {
          journal: {
            select: {
              id: true,
              name: true,
              country: true,
              issn: true,
              eissn: true,
              qualityGrade: true
            }
          },
          _count: {
            select: { citedBy: true }
          }
        }
      })
    ]);

    const formattedArticles = articles.map(art => ({
      id: art.id,
      title: art.title,
      doi: art.doi,
      abstract: art.abstract,
      pdfUrl: art.pdfUrl,
      publishDate: art.publishDate,
      journalName: art.journal?.name || "Unknown African Journal",
      journalId: art.journal?.id,
      country: art.journal?.country || "Pan-African",
      issn: art.journal?.issn || art.journal?.eissn || null,
      qualityGrade: art.journal?.qualityGrade || "A",
      citationCount: Math.max(art.citationCount || 0, art._count?.citedBy || 0)
    }));

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      articles: formattedArticles
    });
  } catch (error: any) {
    console.error("Article search error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search articles." },
      { status: 500 }
    );
  }
}
