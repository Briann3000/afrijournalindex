import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

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

    const journals = await prisma.journal.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { issn: { contains: q } },
          { eissn: { contains: q } },
          { publisherName: { contains: q } },
          { country: { contains: q } }
        ]
      },
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

    return NextResponse.json({ success: true, journals });
  } catch (error: any) {
    console.error("Journal search error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
