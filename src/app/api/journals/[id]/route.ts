import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

import { getDisciplines, assignQuartiles } from "../../../../lib/metrics";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Journal ID is required." },
        { status: 400 }
      );
    }

    const journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id: id },
          { issn: id },
          { eissn: id },
          { name: { contains: id, mode: "insensitive" } }
        ]
      },
      include: {
        reports: {
          orderBy: {
            year: "desc"
          }
        },
        articles: {
          orderBy: {
            publishDate: "desc"
          },
          include: {
            citedBy: {
              include: {
                citingArticle: true
              }
            }
          }
        },
        comments: {
          orderBy: {
            createdAt: "desc"
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                institution: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!journal) {
      return NextResponse.json(
        { success: false, error: "Journal not found." },
        { status: 404 }
      );
    }

    // Format articles with citation count
    let totalCitations = 0;
    let selfCitations = 0;

    const formattedArticles = journal.articles.map(article => {
      const citations = article.citedBy || [];
      totalCitations += citations.length;
      
      citations.forEach(c => {
        if (c.citingArticle && c.citingArticle.journalId === journal.id) {
          selfCitations++;
        }
      });

      return {
        id: article.id,
        title: article.title,
        doi: article.doi,
        publishDate: article.publishDate,
        citationCount: citations.length
      };
    });

    const selfCitationRate = totalCitations > 0 ? ((selfCitations / totalCitations) * 100) : 0;
    const externalCitationRate = totalCitations > 0 ? (100 - selfCitationRate) : 100;

    // Latest impact metrics
    const latestReport = journal.reports[0] || null;
    const standardScore = latestReport ? latestReport.standardScore : 0;
    const regionalScore = latestReport ? latestReport.regionalScore : 0;

    // Determine disciplines
    const disciplines = getDisciplines(journal.name, journal.description || "");
    const primaryDiscipline = disciplines[0] || "Multidisciplinary";

    // Compute quartile and benchmark against all journals in discipline
    const peerJournals = await prisma.journal.findMany({
      include: {
        reports: {
          orderBy: { year: "desc" },
          take: 1
        }
      }
    });

    const peersInDiscipline = peerJournals
      .filter(p => {
        const pDiscs = getDisciplines(p.name, p.description || "");
        return pDiscs.includes(primaryDiscipline);
      })
      .map(p => ({
        id: p.id,
        name: p.name,
        score: p.reports[0]?.standardScore || 0
      }));

    const rankedPeers = assignQuartiles(peersInDiscipline.length > 0 ? peersInDiscipline : [{ id: journal.id, name: journal.name, score: standardScore }]);
    const currentRanking = rankedPeers.find(p => p.id === journal.id) || {
      quartile: "Q2",
      rank: 1,
      totalInGroup: rankedPeers.length
    };

    // Calculate category median score
    const scoresInGroup = rankedPeers.map(p => p.score).sort((a, b) => a - b);
    const mid = Math.floor(scoresInGroup.length / 2);
    const categoryMedian = scoresInGroup.length % 2 !== 0 
      ? scoresInGroup[mid] 
      : (scoresInGroup[mid - 1] + scoresInGroup[mid]) / 2;

    return NextResponse.json({
      success: true,
      journal: {
        id: journal.id,
        name: journal.name,
        issn: journal.issn,
        eissn: journal.eissn,
        description: journal.description,
        publisherName: journal.publisherName,
        country: journal.country,
        frequency: journal.frequency,
        websiteUrl: journal.websiteUrl,
        isIndexed: journal.isIndexed,
        qualityGrade: journal.qualityGrade,
        indexedAt: journal.indexedAt,
        disciplines,
        primaryDiscipline,
        quartile: currentRanking.quartile,
        disciplineRank: currentRanking.rank,
        totalInDiscipline: currentRanking.totalInGroup,
        categoryMedian: categoryMedian || 0.5,
        selfCitationRate: Number(selfCitationRate.toFixed(1)),
        externalCitationRate: Number(externalCitationRate.toFixed(1)),
        integrityScore: selfCitationRate < 20 ? "High Integrity" : selfCitationRate < 40 ? "Standard" : "Under Audit",
        latestReport: latestReport ? {
          year: latestReport.year,
          standardScore: latestReport.standardScore,
          regionalScore: latestReport.regionalScore,
          citationCount: latestReport.citationCount,
          articleCount: latestReport.articleCount
        } : null,
        historicalReports: journal.reports.map(r => ({
          year: r.year,
          standardScore: r.standardScore,
          regionalScore: r.regionalScore,
          citationCount: r.citationCount,
          articleCount: r.articleCount
        })),
        articles: formattedArticles,
        comments: journal.comments
      }
    });
  } catch (error: any) {
    console.error("Fetch journal detail error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch journal." },
      { status: 500 }
    );
  }
}
