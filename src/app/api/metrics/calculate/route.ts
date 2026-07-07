import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const journals = await prisma.journal.findMany();
    const results: any[] = [];

    for (const journal of journals) {
      // 1. Fetch articles published in 2023 & 2024 (citable articles)
      const citableArticles = await prisma.article.findMany({
        where: {
          journalId: journal.id,
          publishDate: {
            gte: new Date("2023-01-01T00:00:00.000Z"),
            lte: new Date("2024-12-31T23:59:59.999Z")
          }
        },
        select: { id: true }
      });

      const articleCount = citableArticles.length;
      const citableArticleIds = citableArticles.map(a => a.id);

      // 2. Count citations registered in 2025 pointing to those citable articles
      let citationCount = 0;
      if (citableArticleIds.length > 0) {
        citationCount = await prisma.citation.count({
          where: {
            citedArticleId: { in: citableArticleIds },
            citedAt: {
              gte: new Date("2025-01-01T00:00:00.000Z"),
              lte: new Date("2025-12-31T23:59:59.999Z")
            }
          }
        });
      }

      // 3. Calculate impact factor score
      const standardScore = articleCount > 0 ? parseFloat((citationCount / articleCount).toFixed(3)) : 0.0;
      const regionalScore = parseFloat((standardScore * 1.15).toFixed(3)); // Africa-weighted scaling

      // 4. Save report
      const report = await prisma.impactFactorReport.upsert({
        where: {
          journalId_year: {
            journalId: journal.id,
            year: 2025
          }
        },
        update: {
          standardScore,
          regionalScore,
          citationCount,
          articleCount
        },
        create: {
          journalId: journal.id,
          year: 2025,
          standardScore,
          regionalScore,
          citationCount,
          articleCount
        }
      });

      results.push({
        journal: journal.name,
        issn: journal.issn,
        articlesWindow: articleCount,
        citationsWindow: citationCount,
        ajifScore: standardScore,
        regionalScore
      });
    }

    return NextResponse.json({
      success: true,
      message: "AJIF metrics calculated successfully.",
      results
    });

  } catch (error: any) {
    console.error("Calculate metrics error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
