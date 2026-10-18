import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { COUNTRY_META_MAP } from "../../../../data/african-countries";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Article ID is required." },
        { status: 400 }
      );
    }

    // Fetch the target article details
    const targetArticle = await prisma.article.findUnique({
      where: { id },
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
    });

    if (!targetArticle) {
      return NextResponse.json(
        { success: false, error: "Article not found." },
        { status: 404 }
      );
    }

    // Fetch authentic citing records from Citation ledger
    const citations = await prisma.citation.findMany({
      where: { citedArticleId: id },
      include: {
        citingArticle: {
          select: {
            id: true,
            title: true,
            doi: true,
            url: true,
            pdfUrl: true,
            publishDate: true,
            citationCount: true,
            journal: {
              select: {
                id: true,
                name: true,
                country: true,
                qualityGrade: true,
                isIndexed: true
              }
            }
          }
        }
      },
      orderBy: { citedAt: "desc" }
    });

    const mappedCitations = citations.map(c => {
      const art = c.citingArticle;
      const pubDate = art?.publishDate ? new Date(art.publishDate) : (c.citedAt ? new Date(c.citedAt) : new Date());
      const citingCountry = (c as any).citingCountry || art?.journal?.country || "International";
      const meta = COUNTRY_META_MAP[citingCountry] || COUNTRY_META_MAP[citingCountry.toLowerCase()];

      return {
        id: c.id,
        citingArticleId: art?.id || c.citingArticleId,
        title: art?.title || "External Citing Article",
        doi: art?.doi || null,
        url: art?.url || (art?.doi ? `https://doi.org/${art.doi}` : null),
        pdfUrl: art?.pdfUrl || null,
        venue: (c as any).citingVenue || art?.journal?.name || "Academic Literature",
        country: citingCountry,
        countryFlag: meta ? meta.flag : "🌐",
        publishedYear: !isNaN(pubDate.getFullYear()) ? pubDate.getFullYear() : 2024,
        isIndexed: art?.journal?.isIndexed ?? false,
        journalGrade: art?.journal?.qualityGrade || null,
        citationCount: art?.citationCount || 0,
        citedAt: c.citedAt
      };
    });

    return NextResponse.json({
      success: true,
      article: {
        id: targetArticle.id,
        title: targetArticle.title,
        doi: targetArticle.doi,
        publishedYear: new Date(targetArticle.publishDate).getFullYear(),
        journalName: targetArticle.journal?.name,
        totalCitations: mappedCitations.length
      },
      citations: mappedCitations
    });

  } catch (error: any) {
    console.error("Fetch article citations error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch citing articles." },
      { status: 500 }
    );
  }
}
