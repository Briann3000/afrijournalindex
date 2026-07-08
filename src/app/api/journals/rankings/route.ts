import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const discipline = searchParams.get("discipline");

    // Fetch journals along with their latest reports and submitter affiliations
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

    // Parse and map rankings data
    const rankings = journals
      .map(journal => {
        const latestReport = journal.reports[0];
        const score = latestReport ? latestReport.standardScore : 0;
        const regionalScore = latestReport ? latestReport.regionalScore : 0;
        const countryName = journal.submissions[0]?.country || "Kenya";
        
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
      // Sort by AJIF standard impact score descending
      .sort((a, b) => b.score - a.score);

    // Apply optional filter parameters
    let filteredRankings = rankings;
    if (country) {
      filteredRankings = filteredRankings.filter(r => r.country.toLowerCase() === country.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      rankings: filteredRankings
    });

  } catch (error: any) {
    console.error("Fetch AJIF rankings error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
