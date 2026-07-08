import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ success: false, error: "Institution name query parameter is required." }, { status: 400 });
    }

    const institutionName = name.trim();

    // 1. Fetch all articles authored by researchers matching this institution
    const articles = await prisma.article.findMany({
      where: {
        authors: {
          some: {
            institution: {
              equals: institutionName,
              mode: "insensitive"
            }
          }
        }
      },
      include: {
        journal: {
          select: {
            id: true,
            name: true,
            qualityGrade: true,
            reports: {
              orderBy: { year: "desc" },
              take: 1
            }
          }
        },
        citedBy: true
      }
    });

    // 2. Aggregate statistics
    const totalPublications = articles.length;
    const totalCitations = articles.reduce((sum, art) => sum + art.citedBy.length, 0);
    const averageCitations = totalPublications > 0 ? (totalCitations / totalPublications).toFixed(2) : "0.00";

    // 3. Group and map affiliated journals
    const journalMap: { [key: string]: any } = {};
    for (const art of articles) {
      const j = art.journal;
      if (!journalMap[j.id]) {
        const latestReport = j.reports[0];
        journalMap[j.id] = {
          id: j.id,
          name: j.name,
          qualityGrade: j.qualityGrade || "B",
          ajifScore: latestReport ? latestReport.standardScore : 0,
          articlesCount: 0,
          citationsCount: 0
        };
      }
      journalMap[j.id].articlesCount += 1;
      journalMap[j.id].citationsCount += art.citedBy.length;
    }

    const affiliatedJournals = Object.values(journalMap).sort((a, b) => b.ajifScore - a.ajifScore);

    return NextResponse.json({
      success: true,
      data: {
        institution: institutionName,
        metrics: {
          totalPublications,
          totalCitations,
          averageCitations
        },
        journals: affiliatedJournals
      }
    });

  } catch (error: any) {
    console.error("Get institutional metrics error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
