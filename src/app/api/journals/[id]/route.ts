import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Journal ID is required." },
        { status: 400 }
      );
    }

    const journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: id },
          { issn: id },
          { eissn: id }
        ]
      },
      include: {
        reports: {
          orderBy: {
            year: "desc"
          }
        },
        articles: {
          orderBy: {
            publishDate: "desc"
          },
          include: {
            citedBy: true
          }
        },
        comments: {
          orderBy: {
            createdAt: "desc"
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                institution: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!journal) {
      return NextResponse.json(
        { success: false, error: "Journal not found." },
        { status: 404 }
      );
    }

    // Format articles with citation count
    const formattedArticles = journal.articles.map(article => ({
      id: article.id,
      title: article.title,
      doi: article.doi,
      publishDate: article.publishDate,
      citationCount: article.citedBy ? article.citedBy.length : 0
    }));

    // Latest impact metrics
    const latestReport = journal.reports[0] || null;

    return NextResponse.json({
      success: true,
      journal: {
        id: journal.id,
        name: journal.name,
        issn: journal.issn,
        eissn: journal.eissn,
        description: journal.description,
        publisherName: journal.publisherName,
        country: journal.country,
        frequency: journal.frequency,
        websiteUrl: journal.websiteUrl,
        isIndexed: journal.isIndexed,
        qualityGrade: journal.qualityGrade,
        indexedAt: journal.indexedAt,
        latestReport: latestReport ? {
          year: latestReport.year,
          standardScore: latestReport.standardScore,
          regionalScore: latestReport.regionalScore,
          citationCount: latestReport.citationCount,
          articleCount: latestReport.articleCount
        } : null,
        historicalReports: journal.reports.map(r => ({
          year: r.year,
          standardScore: r.standardScore,
          regionalScore: r.regionalScore,
          citationCount: r.citationCount,
          articleCount: r.articleCount
        })),
        articles: formattedArticles,
        comments: journal.comments
      }
    });
  } catch (error: any) {
    console.error("Fetch journal detail error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch journal." },
      { status: 500 }
    );
  }
}
