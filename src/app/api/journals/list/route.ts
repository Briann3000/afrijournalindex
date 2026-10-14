import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hasPagination = searchParams.has("page") || searchParams.has("limit");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;
    const country = searchParams.get("country");
    const search = searchParams.get("q")?.trim();

    const where: any = {};
    if (country) {
      where.country = country;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { issn: { contains: search } },
        { eissn: { contains: search } },
        { publisherName: { contains: search } }
      ];
    }

    if (hasPagination) {
      const [total, journals] = await Promise.all([
        prisma.journal.count({ where }),
        prisma.journal.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            issn: true,
            eissn: true,
            publisherName: true,
            country: true,
            frequency: true,
            websiteUrl: true,
            qualityGrade: true,
            isIndexed: true,
            description: true
          },
          orderBy: { name: "asc" }
        })
      ]);
      return NextResponse.json({
        success: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        journals
      }, {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" }
      });
    }

    const journals = await prisma.journal.findMany({
      where,
      select: {
        id: true,
        name: true,
        issn: true,
        eissn: true,
        publisherName: true,
        country: true,
        frequency: true,
        websiteUrl: true,
        qualityGrade: true,
        isIndexed: true,
        description: true
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, total: journals.length, journals }, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" }
    });
  } catch (error: any) {
    console.error("List journals error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

