import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { tokenizeQuery, matchesQueryFuzzy, calculateFuzzyScore } from "../../../../lib/fuzzy-search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 50);

    if (!q) {
      const topJournals = await prisma.journal.findMany({
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          issn: true,
          eissn: true,
          country: true,
          publisherName: true,
          isIndexed: true,
          qualityGrade: true
        }
      });
      return NextResponse.json({ success: true, journals: topJournals });
    }

    const tokens = tokenizeQuery(q);
    const orConditions: any[] = [
      { name: { contains: q } },
      { issn: { contains: q } },
      { eissn: { contains: q } },
      { publisherName: { contains: q } },
      { country: { contains: q } }
    ];

    for (const t of tokens) {
      if (t.length > 2) {
        orConditions.push({ name: { contains: t } });
        orConditions.push({ publisherName: { contains: t } });
      }
    }

    const journalsRaw = await prisma.journal.findMany({
      where: { OR: orConditions },
      take: 40,
      select: {
        id: true,
        name: true,
        issn: true,
        eissn: true,
        country: true,
        publisherName: true,
        isIndexed: true,
        qualityGrade: true
      }
    });

    const rankedJournals = journalsRaw
      .map(j => {
        const isMatch = matchesQueryFuzzy(q, [j.name, j.publisherName, j.issn, j.country]);
        const score = calculateFuzzyScore(q, j.name, j.publisherName || "");
        return { ...j, isMatch, score };
      })
      .filter(j => j.isMatch || j.score > 80)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ isMatch, score, ...j }) => j);

    return NextResponse.json({ success: true, journals: rankedJournals });
  } catch (error: any) {
    console.error("Journal search error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
