import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({
        success: true,
        query: "",
        journals: [],
        scholars: [],
        articles: [],
        totalJournals: 0,
        totalScholars: 0,
        totalArticles: 0
      });
    }

    const queryLower = q.toLowerCase();

    // 1. Search Journals
    const [journalsRaw, totalJournals] = await Promise.all([
      prisma.journal.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { publisherName: { contains: q } },
            { issn: { contains: q } },
            { eissn: { contains: q } },
            { country: { contains: q } }
          ]
        },
        take: 6,
        select: {
          id: true,
          name: true,
          publisherName: true,
          country: true,
          qualityGrade: true,
          issn: true,
          isIndexed: true,
          reports: {
            orderBy: { year: "desc" },
            take: 1,
            select: {
              standardScore: true
            }
          }
        }
      }),
      prisma.journal.count({
        where: {
          OR: [
            { name: { contains: q } },
            { publisherName: { contains: q } },
            { issn: { contains: q } },
            { eissn: { contains: q } },
            { country: { contains: q } }
          ]
        }
      })
    ]);

    const formattedJournals = journalsRaw.map(j => ({
      id: j.id,
      name: j.name,
      publisherName: j.publisherName,
      country: j.country,
      qualityGrade: j.qualityGrade || "B",
      issn: j.issn,
      isIndexed: j.isIndexed,
      ajciScore: j.reports?.[0]?.standardScore || null
    }));

    // 2. Search Scholars
    const matchingUsers = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { role: "RESEARCHER" },
              { claims: { some: { status: "VERIFIED" } } }
            ]
          },
          {
            OR: [
              { name: { contains: q } },
              { institution: { contains: q } },
              { bio: { contains: q } },
              { orcid: { contains: q } }
            ]
          }
        ]
      },
      take: 12,
      select: {
        id: true,
        name: true,
        email: true,
        orcid: true,
        institution: true,
        bio: true,
        claims: {
          where: { status: "VERIFIED" },
          select: {
            article: {
              select: {
                id: true,
                citationCount: true,
                citedBy: { select: { id: true } }
              }
            }
          }
        }
      }
    });

    const totalScholars = await prisma.user.count({
      where: {
        AND: [
          {
            OR: [
              { role: "RESEARCHER" },
              { claims: { some: { status: "VERIFIED" } } }
            ]
          },
          {
            OR: [
              { name: { contains: q } },
              { institution: { contains: q } },
              { bio: { contains: q } },
              { orcid: { contains: q } }
            ]
          }
        ]
      }
    });

    const formattedScholars = matchingUsers.map(u => {
      const articles = (u.claims || []).map(c => c.article).filter(Boolean);
      const citationCounts = articles.map(a => {
        const directCites = a.citedBy ? a.citedBy.length : 0;
        return Math.max(directCites, a.citationCount || 0);
      }).sort((a, b) => b - a);

      const totalCitations = citationCounts.reduce((acc, c) => acc + c, 0);

      let hIndex = 0;
      for (let i = 0; i < citationCounts.length; i++) {
        if (citationCounts[i] >= i + 1) {
          hIndex = i + 1;
        } else {
          break;
        }
      }

      let broadDiscipline = "Health Sciences";
      if (u.bio && u.bio.includes("[Discipline:")) {
        const dMatch = u.bio.match(/\[Discipline:\s*(.*?)\]/);
        if (dMatch && dMatch[1]) broadDiscipline = dMatch[1].trim();
      }

      return {
        id: u.id,
        name: u.name,
        institution: u.institution || "African University",
        broadDiscipline,
        articlesCount: articles.length,
        totalCitations,
        hIndex,
        orcid: u.orcid
      };
    }).sort((a, b) => b.totalCitations - a.totalCitations);

    return NextResponse.json({
      success: true,
      query: q,
      journals: formattedJournals,
      scholars: formattedScholars.slice(0, 6),
      totalJournals,
      totalScholars
    });

  } catch (error: any) {
    console.error("Multi-entity search API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
