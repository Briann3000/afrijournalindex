import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

import { getDisciplines, assignQuartiles } from "../../../../lib/metrics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const discipline = searchParams.get("discipline");

    // Fetch journals with their latest report and description
    const journals = await prisma.journal.findMany({
      include: {
        reports: {
          orderBy: {
            year: "desc"
          },
          take: 1
        },
        submissions: {
          select: {
            country: true
          }
        }
      }
    });

    // Build ranking rows with discipline categorization
    const mapped = journals.map((journal) => {
      const latestReport = journal.reports[0];
      const score = latestReport ? latestReport.standardScore : 0;
      const regionalScore = latestReport ? latestReport.regionalScore : 0;
      const countryName =
        journal.country?.trim() ||
        journal.submissions.find((submission) => submission.country?.trim())?.country?.trim() ||
        "Unknown";
      
      const disciplines = getDisciplines(journal.name, journal.description || "");
      const primaryDiscipline = disciplines[0] || "Multidisciplinary";

      return {
        id: journal.id,
        name: journal.name,
        issn: journal.issn,
        eissn: journal.eissn,
        websiteUrl: journal.websiteUrl,
        publisherName: journal.publisherName,
        qualityGrade: journal.qualityGrade || "B",
        country: countryName,
        disciplines,
        primaryDiscipline,
        score,
        regionalScore,
        citationCount: latestReport ? latestReport.citationCount : 0,
        articleCount: latestReport ? latestReport.articleCount : 0
      };
    });

    // Compute overall quartiles and per-discipline rankings
    const allRanked = assignQuartiles(mapped);

    // Also compute discipline-specific quartiles
    const disciplineGroups: Record<string, typeof mapped> = {};
    allRanked.forEach((item) => {
      if (!disciplineGroups[item.primaryDiscipline]) {
        disciplineGroups[item.primaryDiscipline] = [];
      }
      disciplineGroups[item.primaryDiscipline].push(item);
    });

    const disciplineQuartileMap: Record<string, { quartile: string; rank: number; total: number }> = {};
    Object.keys(disciplineGroups).forEach((disc) => {
      const rankedInDisc = assignQuartiles(disciplineGroups[disc]);
      rankedInDisc.forEach((item) => {
        disciplineQuartileMap[item.id] = {
          quartile: item.quartile,
          rank: item.rank,
          total: item.totalInGroup
        };
      });
    });

    const rankings = allRanked.map((item) => ({
      ...item,
      quartile: disciplineQuartileMap[item.id]?.quartile || item.quartile,
      disciplineRank: disciplineQuartileMap[item.id]?.rank || 1,
      totalInDiscipline: disciplineQuartileMap[item.id]?.total || 1
    }));

    const countries = Array.from(
      new Set(
        rankings
          .map((ranking) => ranking.country)
          .filter((countryName) => countryName !== "Unknown")
      )
    ).sort((a, b) => a.localeCompare(b));

    const disciplinesList = Array.from(
      new Set(rankings.map((r) => r.primaryDiscipline))
    ).sort((a, b) => a.localeCompare(b));

    let filteredRankings = rankings;
    if (country) {
      filteredRankings = filteredRankings.filter(
        (ranking) => ranking.country.toLowerCase() === country.toLowerCase()
      );
    }
    if (discipline) {
      filteredRankings = filteredRankings.filter(
        (ranking) => ranking.primaryDiscipline.toLowerCase() === discipline.toLowerCase() || ranking.disciplines.some(d => d.toLowerCase() === discipline.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      countries,
      disciplines: disciplinesList,
      rankings: filteredRankings
    });
  } catch (error: any) {
    console.error("Fetch AJIF rankings error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
