import { NextResponse } from "next/server";
import topVenuesData from "../../../../data/top_international_venues.json";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const offset = (page - 1) * limit;

    let filtered = topVenuesData as any[];

    if (q) {
      filtered = filtered.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        (v.topScholars && v.topScholars.toLowerCase().includes(q))
      );
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Compute macro scientometrics
    const totalPapers = (topVenuesData as any[]).reduce((sum, v) => sum + (v.paperCount || 0), 0);
    const totalDistinctVenues = (topVenuesData as any[]).length;

    return NextResponse.json({
      success: true,
      totalVenues: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      macroMetrics: {
        totalGlobalWorksMapped: 537388,
        totalTopVenuesPapers: totalPapers,
        totalVenuesCataloged: totalDistinctVenues,
        sovereignAfricanJournals: 1907,
        sovereignAfricanArticles: 745394,
        continentalLinkedCitations: 17488
      },
      venues: paginated
    });
  } catch (error: any) {
    console.error("Where Africa Publishes API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
