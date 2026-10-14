import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getDisciplines, assignQuartiles } from "../../../../lib/metrics";

// In-memory cache for computed rankings (15 minutes TTL)
let cachedRankingsData: {
  timestamp: number;
  countries: string[];
  disciplines: string[];
  rankings: any[];
} | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const discipline = searchParams.get("discipline");
    const forceRefresh = searchParams.get("refresh") === "true";

    const now = Date.now();
    let baseData = cachedRankingsData;

    if (!baseData || forceRefresh || now - baseData.timestamp > CACHE_TTL_MS) {
      // Fetch journals with only needed fields
      const journals = await prisma.journal.findMany({
        select: {
          id: true,
          name: true,
          issn: true,
          eissn: true,
          websiteUrl: true,
          publisherName: true,
          qualityGrade: true,
          country: true,
          description: true,
          reports: {
            orderBy: { year: "desc" },
            take: 1,
            select: {
              standardScore: true,
              regionalScore: true,
              citationCount: true,
              articleCount: true,
              quartile: true,
              disciplineRank: true,
              totalInDiscipline: true,
              primaryDiscipline: true
            }
          }
        }
      });

    // Build ranking rows with discipline categorization
    const mapped = journals.map((journal) => {
      const latestReport = journal.reports[0];
      const score = latestReport ? latestReport.standardScore : 0;
      const regionalScore = latestReport ? latestReport.regionalScore : 0;
      const countryName = journal.country?.trim() || "Unknown";
      
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
        primaryDiscipline: latestReport?.primaryDiscipline || primaryDiscipline,
        score,
        ycaScore: latestReport ? Number((latestReport.standardScore * 1.14).toFixed(3)) : 0,
        regionalScore,
        citationCount: latestReport ? latestReport.citationCount : 0,
        articleCount: latestReport ? latestReport.articleCount : 0,
        precomputedQuartile: latestReport?.quartile || null,
        precomputedRank: latestReport?.disciplineRank || null,
        precomputedTotal: latestReport?.totalInDiscipline || null
      };
    });

    // Compute relative discipline rankings using assignQuartiles
    const disciplineGroups: Record<string, typeof mapped> = {};
    mapped.forEach((item) => {
      const d = item.primaryDiscipline || "Multidisciplinary";
      if (!disciplineGroups[d]) {
        disciplineGroups[d] = [];
      }
      disciplineGroups[d].push(item);
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

    let rankings = mapped.map((item) => {
      const dynamicMeta = disciplineQuartileMap[item.id];
      return {
        ...item,
        quartile: item.precomputedQuartile || dynamicMeta?.quartile || "Unrated",
        disciplineRank: item.precomputedRank || dynamicMeta?.rank || 1,
        totalInDiscipline: item.precomputedTotal || dynamicMeta?.total || 1
      };
    }).sort((a, b) => b.score - a.score);

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

    cachedRankingsData = {
      timestamp: now,
      countries,
      disciplines: disciplinesList,
      rankings
    };
    baseData = cachedRankingsData;
  }

    let filteredRankings = baseData.rankings;
    if (country) {
      filteredRankings = filteredRankings.filter(
        (ranking) => ranking.country.toLowerCase() === country.toLowerCase()
      );
    }
    if (discipline) {
      filteredRankings = filteredRankings.filter(
        (ranking) => ranking.primaryDiscipline.toLowerCase() === discipline.toLowerCase() || ranking.disciplines.some((d: string) => d.toLowerCase() === discipline.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      countries: baseData.countries,
      disciplines: baseData.disciplines,
      rankings: filteredRankings
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600"
      }
    });
  } catch (error: any) {
    console.error("Fetch AJCI rankings error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
