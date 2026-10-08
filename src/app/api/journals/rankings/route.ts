import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");

    // Fetch journals with their latest report and a submission fallback for legacy rows.
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

    // Build ranking rows from the journal record itself so filtering reflects the database.
    const rankings = journals
      .map((journal) => {
        const latestReport = journal.reports[0];
        const score = latestReport ? latestReport.standardScore : 0;
        const regionalScore = latestReport ? latestReport.regionalScore : 0;
        const countryName =
          journal.country?.trim() ||
          journal.submissions.find((submission) => submission.country?.trim())?.country?.trim() ||
          "Unknown";

        return {
          id: journal.id,
          name: journal.name,
          issn: journal.issn,
          eissn: journal.eissn,
          websiteUrl: journal.websiteUrl,
          publisherName: journal.publisherName,
          qualityGrade: journal.qualityGrade || "B",
          country: countryName,
          score,
          regionalScore,
          citationCount: latestReport ? latestReport.citationCount : 0,
          articleCount: latestReport ? latestReport.articleCount : 0
        };
      })
      .sort((a, b) => b.score - a.score);

    const countries = Array.from(
      new Set(
        rankings
          .map((ranking) => ranking.country)
          .filter((countryName) => countryName !== "Unknown")
      )
    ).sort((a, b) => a.localeCompare(b));

    let filteredRankings = rankings;
    if (country) {
      filteredRankings = filteredRankings.filter(
        (ranking) => ranking.country.toLowerCase() === country.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      countries,
      rankings: filteredRankings
    });
  } catch (error: any) {
    console.error("Fetch AJIF rankings error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
