import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch top verified journals with score >= 4.0
    const journals = await prisma.journal.findMany({
      where: {
        reports: {
          some: {
            year: 2025,
            standardScore: { gte: 4.0 }
          }
        }
      },
      select: {
        id: true,
        name: true,
        issn: true,
        eissn: true,
        country: true,
        description: true,
        qualityGrade: true,
        reports: {
          where: { year: 2025 },
          take: 1,
          select: {
            standardScore: true,
            regionalScore: true,
            citationCount: true,
            articleCount: true,
            quartile: true,
            primaryDiscipline: true,
            disciplineRank: true,
            totalInDiscipline: true
          }
        }
      }
    });

    if (journals.length === 0) {
      return NextResponse.json({ success: true, heroJournal: null, showcaseJournals: [] });
    }

    // Shuffle journals to provide dynamic rotation on each refresh/visit
    const shuffled = [...journals].sort(() => 0.5 - Math.random());

    const formatted = shuffled.map(j => {
      const rep = j.reports[0];
      return {
        id: j.id,
        name: j.name,
        issn: j.issn || j.eissn || "Pending",
        country: j.country || "Africa",
        description: j.description || "Peer-reviewed African academic periodical.",
        qualityGrade: j.qualityGrade || "A",
        score: rep ? rep.standardScore : 4.0,
        ycaScore: rep ? Number((rep.standardScore * 1.14).toFixed(3)) : 4.56,
        regionalScore: rep ? rep.regionalScore : 4.6,
        citationCount: rep ? rep.citationCount : 0,
        articleCount: rep ? rep.articleCount : 0,
        quartile: rep?.quartile || "Q1",
        primaryDiscipline: rep?.primaryDiscipline || "Multidisciplinary",
        disciplineRank: rep?.disciplineRank || 1,
        totalInDiscipline: rep?.totalInDiscipline || 20
      };
    });

    const heroJournal = formatted[0];
    const showcaseJournals = formatted.slice(1, 4);

    return NextResponse.json({
      success: true,
      heroJournal,
      showcaseJournals
    });
  } catch (error: any) {
    console.error("Featured showcase API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
