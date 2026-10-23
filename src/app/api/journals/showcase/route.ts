import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Fetch ARJESS explicitly as the permanent hero showcase journal
    const arjessJournal = await prisma.journal.findFirst({
      where: {
        OR: [
          { eissn: "2312-0134" },
          { name: { contains: "ARJESS" } },
          { name: { contains: "African Research Journal of Education and Social Sciences" } }
        ]
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

    let heroJournal = null;
    if (arjessJournal) {
      const rep = arjessJournal.reports[0];
      heroJournal = {
        id: arjessJournal.id,
        name: arjessJournal.name,
        issn: arjessJournal.eissn || arjessJournal.issn || "2312-0134",
        country: arjessJournal.country || "Kenya",
        description: arjessJournal.description || "Peer-reviewed African academic periodical in Education and Social Sciences.",
        qualityGrade: arjessJournal.qualityGrade || "A+",
        score: rep ? rep.standardScore : 1.818,
        ycaScore: rep ? Number((rep.standardScore * 1.15).toFixed(3)) : 2.091,
        regionalScore: rep ? rep.regionalScore : 2.091,
        citationCount: rep ? rep.citationCount : 80,
        articleCount: rep ? rep.articleCount : 44,
        quartile: rep?.quartile || "Q2",
        primaryDiscipline: rep?.primaryDiscipline || "Education & Social Sciences",
        disciplineRank: rep?.disciplineRank || 2,
        totalInDiscipline: rep?.totalInDiscipline || 40
      };
    }

    // 2. Fetch secondary audited journals for the showcase carousel
    const journals = await prisma.journal.findMany({
      where: {
        id: arjessJournal ? { not: arjessJournal.id } : undefined,
        reports: {
          some: {
            year: 2025,
            standardScore: { gte: 3.5 }
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

    const shuffled = [...journals].sort(() => 0.5 - Math.random());
    const showcaseJournals = shuffled.slice(0, 3).map(j => {
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

    // If ARJESS was somehow not found, fallback to the first showcase journal
    if (!heroJournal && showcaseJournals.length > 0) {
      heroJournal = showcaseJournals[0];
    }

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
