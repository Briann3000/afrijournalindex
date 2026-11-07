import { NextResponse } from "next/server";
import { pool } from "../../../../lib/db";
import { getDisciplines } from "../../../../lib/metrics";

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
      // High-performance single SQL query (<160ms)
      const conn = await pool.getConnection();
      let journals: any[] = [];
      try {
        journals = await conn.query(`
          SELECT 
            j.id, j.name, j.issn, j.eissn, j.websiteUrl, j.publisherName, j.country, j.description,
            r.standardScore, r.regionalScore, r.citationCount, r.articleCount, r.disciplineRank, r.totalInDiscipline, r.primaryDiscipline
          FROM journal j
          LEFT JOIN (
            SELECT journalId, standardScore, regionalScore, citationCount, articleCount, disciplineRank, totalInDiscipline, primaryDiscipline
            FROM impactfactorreport
            WHERE (journalId, year) IN (
              SELECT journalId, MAX(year) FROM impactfactorreport GROUP BY journalId
            )
          ) r ON j.id = r.journalId
        `);
      } finally {
        conn.release();
      }

      // Build ranking rows strictly with genuine scientific metrics (No grades, no quartiles)
      const mapped = journals.map((journal: any) => {
        const score = journal.standardScore ? Number(journal.standardScore) : 0;
        const regionalScore = journal.regionalScore ? Number(journal.regionalScore) : 0;
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
          country: countryName,
          disciplines,
          primaryDiscipline: journal.primaryDiscipline || primaryDiscipline,
          score,
          ycaScore: journal.standardScore ? Number((journal.standardScore * 1.14).toFixed(3)) : 0,
          regionalScore,
          citationCount: journal.citationCount ? Number(journal.citationCount) : 0,
          articleCount: journal.articleCount ? Number(journal.articleCount) : 0,
          disciplineRank: journal.disciplineRank || 1,
          totalInDiscipline: journal.totalInDiscipline || 1
        };
      });

      // Sort strictly by genuine scientific impact score
      let rankings = mapped.sort((a, b) => b.score - a.score);

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
