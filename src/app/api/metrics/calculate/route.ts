import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getDisciplines, assignQuartiles } from "../../../../lib/metrics";

export async function POST(request: Request) {
  try {
    const journals = await prisma.journal.findMany({
      include: {
        articles: {
          where: {
            publishDate: {
              gte: new Date("2023-01-01T00:00:00.000Z"),
              lte: new Date("2024-12-31T23:59:59.999Z")
            }
          },
          select: {
            id: true,
            citedBy: {
              where: {
                citedAt: {
                  gte: new Date("2025-01-01T00:00:00.000Z"),
                  lte: new Date("2025-12-31T23:59:59.999Z")
                }
              },
              select: { id: true }
            }
          }
        }
      }
    });

    // 1. Calculate raw impact scores and assign primary discipline
    const calculatedList = journals.map(journal => {
      const articleCount = journal.articles.length;
      let citationCount = 0;
      journal.articles.forEach(art => {
        citationCount += art.citedBy.length;
      });

      const standardScore = articleCount > 0 ? parseFloat((citationCount / articleCount).toFixed(3)) : 0.0;
      const regionalScore = parseFloat((standardScore * 1.15).toFixed(3));

      const disciplines = getDisciplines(journal.name, journal.description || "");
      const primaryDiscipline = disciplines[0] || "Multidisciplinary";

      return {
        journalId: journal.id,
        name: journal.name,
        issn: journal.issn,
        articleCount,
        citationCount,
        standardScore,
        regionalScore,
        score: standardScore,
        primaryDiscipline
      };
    });

    // 2. Group by primary discipline and compute quartile & rank within discipline
    const disciplineGroups: Record<string, typeof calculatedList> = {};
    calculatedList.forEach(item => {
      if (!disciplineGroups[item.primaryDiscipline]) {
        disciplineGroups[item.primaryDiscipline] = [];
      }
      disciplineGroups[item.primaryDiscipline].push(item);
    });

    const rankingMap = new Map<string, { quartile: string; rank: number; totalInGroup: number }>();
    Object.keys(disciplineGroups).forEach(disc => {
      const rankedGroup = assignQuartiles(disciplineGroups[disc]);
      rankedGroup.forEach(r => {
        rankingMap.set(r.journalId, {
          quartile: r.quartile,
          rank: r.rank,
          totalInGroup: r.totalInGroup
        });
      });
    });

    // 3. Persist reports into database
    const results: any[] = [];
    for (const item of calculatedList) {
      const rankInfo = rankingMap.get(item.journalId) || { quartile: "Unrated", rank: 1, totalInGroup: 1 };

      await prisma.impactFactorReport.upsert({
        where: {
          journalId_year: {
            journalId: item.journalId,
            year: 2025
          }
        },
        update: {
          standardScore: item.standardScore,
          regionalScore: item.regionalScore,
          citationCount: item.citationCount,
          articleCount: item.articleCount,
          quartile: rankInfo.quartile,
          disciplineRank: rankInfo.rank,
          totalInDiscipline: rankInfo.totalInGroup,
          primaryDiscipline: item.primaryDiscipline
        },
        create: {
          journalId: item.journalId,
          year: 2025,
          standardScore: item.standardScore,
          regionalScore: item.regionalScore,
          citationCount: item.citationCount,
          articleCount: item.articleCount,
          quartile: rankInfo.quartile,
          disciplineRank: rankInfo.rank,
          totalInDiscipline: rankInfo.totalInGroup,
          primaryDiscipline: item.primaryDiscipline
        }
      });

      results.push({
        journal: item.name,
        issn: item.issn,
        primaryDiscipline: item.primaryDiscipline,
        articlesWindow: item.articleCount,
        citationsWindow: item.citationCount,
        ajifScore: item.standardScore,
        regionalScore: item.regionalScore,
        quartile: rankInfo.quartile,
        disciplineRank: rankInfo.rank
      });
    }

    return NextResponse.json({
      success: true,
      message: "AJIF metrics and subject quartile rankings calculated and saved successfully.",
      totalJournals: results.length,
      results
    });

  } catch (error: any) {
    console.error("Calculate metrics error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

