import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getDisciplines } from "../../../../lib/metrics";
import { ALL_AFRICAN_COUNTRIES } from "../../../data/african-countries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
          { name: { contains: id } }
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
                citingArticle: {
                  include: {
                    journal: {
                      select: {
                        id: true,
                        name: true,
                        country: true
                      }
                    }
                  }
                }
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

    // Format articles with citation count and calculate citation provenance
    let totalCitations = 0;
    let selfCitations = 0;
    let regionalAfricanCitations = 0;
    let globalCitations = 0;
    const citingCountryCounts: Record<string, number> = {};

    const africanCountryNames = new Set(ALL_AFRICAN_COUNTRIES.map(c => c.name.toLowerCase()));

    const formattedArticles = journal.articles.map(article => {
      const citations = article.citedBy || [];
      const count = (article as any).citationCount > 0 ? (article as any).citationCount : citations.length;
      totalCitations += count;
      
      citations.forEach((c: any) => {
        // True self-citation check: only if citingArticle is within the same journal AND citingVenue is not an external journal
        const isExternalVenue = c.citingVenue && c.citingVenue.trim().toLowerCase() !== journal.name.trim().toLowerCase();
        if (!isExternalVenue && c.citingArticle && c.citingArticle.journalId === journal.id) {
          selfCitations++;
        }
        const citingCountry = c.citingCountry?.trim() || c.citingArticle?.journal?.country?.trim() || "";
        if (citingCountry) {
          citingCountryCounts[citingCountry] = (citingCountryCounts[citingCountry] || 0) + 1;
          if (africanCountryNames.has(citingCountry.toLowerCase())) {
            regionalAfricanCitations++;
          } else {
            globalCitations++;
          }
        } else {
          regionalAfricanCitations++;
        }
      });

      return {
        id: article.id,
        title: article.title,
        doi: article.doi,
        url: (article as any).url || null,
        pdfUrl: (article as any).pdfUrl || null,
        publishDate: article.publishDate,
        citationCount: count,
        citations: citations.map((c: any) => ({
          id: c.id,
          citingTitle: c.citingArticle?.title || "Scholarly Article",
          citingDoi: c.citingArticle?.doi || null,
          citingPdfUrl: (c.citingArticle as any)?.pdfUrl || null,
          citingJournal: c.citingVenue || c.citingArticle?.journal?.name || "Peer-Reviewed Journal",
          citingCountry: c.citingCountry || c.citingArticle?.journal?.country || "International",
          citedAt: c.citedAt
        }))
      };
    });

    const selfCitationRate = totalCitations > 0 ? ((selfCitations / totalCitations) * 100) : 0;
    const externalCitationRate = totalCitations > 0 ? (100 - selfCitationRate) : 100;

    const regionalPercentage = totalCitations > 0 
      ? Number(((regionalAfricanCitations / totalCitations) * 100).toFixed(1))
      : 0;
    const globalPercentage = totalCitations > 0
      ? Number((100 - regionalPercentage).toFixed(1))
      : 0;

    const topCitingCountries = Object.entries(citingCountryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const citationOrigin = {
      total: totalCitations,
      regionalCount: regionalAfricanCitations,
      globalCount: globalCitations,
      regionalPercentage,
      globalPercentage,
      topCitingCountries: topCitingCountries
    };

    let cartelRisk = "Low";
    if (selfCitationRate > 35) cartelRisk = "Elevated Risk — High Self-Citation Concentration";
    else if (selfCitationRate > 20) cartelRisk = "Moderate — Specialized Field Velocity";

    const integrityReport = {
      selfCitationRate: Number(selfCitationRate.toFixed(1)),
      externalCitationRate: Number(externalCitationRate.toFixed(1)),
      integrityScore: selfCitationRate < 20 ? "High Integrity" : selfCitationRate < 40 ? "Standard" : "Under Audit",
      cartelRisk,
      coerciveCitationFlag: selfCitationRate > 35,
      recommendation: selfCitationRate > 25 
        ? "Diversify external peer review and encourage citations from cross-institutional African repositories." 
        : "Citation profile conforms to international academic publishing integrity benchmarks."
    };

    // Latest impact metrics
    const latestReport = journal.reports[0] || null;
    const standardScore = latestReport ? latestReport.standardScore : 0;
    const regionalScore = latestReport ? latestReport.regionalScore : 0;

    // Determine disciplines
    const disciplines = getDisciplines(journal.name, journal.description || "");
    const primaryDiscipline = latestReport?.primaryDiscipline || disciplines[0] || "Multidisciplinary";

    // Fast path: Use precomputed quartile and rankings from database
    let quartile = latestReport?.quartile;
    let disciplineRank = latestReport?.disciplineRank || 1;
    let totalInDiscipline = latestReport?.totalInDiscipline || 20;

    if (!quartile) {
      if (standardScore <= 0) quartile = "Unrated";
      else if (standardScore >= 0.500) quartile = "Q1";
      else if (standardScore >= 0.250) quartile = "Q2";
      else if (standardScore >= 0.080) quartile = "Q3";
      else quartile = "Q4";
    }

    const categoryMedian = 0.42; // standard regional discipline median benchmark

    const hasArticles = formattedArticles.length > 0;

    // Authentic Citation Distribution calculation
    const totalArticlesCount = formattedArticles.length;
    const zeroCitations = formattedArticles.filter(a => a.citationCount === 0).length;
    const oneCitation = formattedArticles.filter(a => a.citationCount === 1).length;
    const twoToNineCitations = formattedArticles.filter(a => a.citationCount >= 2 && a.citationCount <= 9).length;
    const tenPlusCitations = formattedArticles.filter(a => a.citationCount >= 10).length;

    const citationDistribution = {
      total: totalArticlesCount,
      zero: {
        count: zeroCitations,
        percentage: totalArticlesCount > 0 ? Number(((zeroCitations / totalArticlesCount) * 100).toFixed(1)) : 0
      },
      one: {
        count: oneCitation,
        percentage: totalArticlesCount > 0 ? Number(((oneCitation / totalArticlesCount) * 100).toFixed(1)) : 0
      },
      twoToNine: {
        count: twoToNineCitations,
        percentage: totalArticlesCount > 0 ? Number(((twoToNineCitations / totalArticlesCount) * 100).toFixed(1)) : 0
      },
      tenPlus: {
        count: tenPlusCitations,
        percentage: totalArticlesCount > 0 ? Number(((tenPlusCitations / totalArticlesCount) * 100).toFixed(1)) : 0
      }
    };

    // Authentic mathematical h-index calculation from genuine article citations
    const sortedCitations = formattedArticles.map(a => a.citationCount).sort((a, b) => b - a);
    let trueHIndex = 0;
    for (let i = 0; i < sortedCitations.length; i++) {
      if (sortedCitations[i] >= i + 1) {
        trueHIndex = i + 1;
      } else {
        break;
      }
    }

    // Impact Factor without self-citations
    const impactWithoutSelfCitations = Number((standardScore * (externalCitationRate / 100)).toFixed(3));

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
        certificatePaid: journal.certificatePaid ?? false,
        activeTier: journal.activeTier || (journal.certificatePaid ? "BASIC" : "FREE"),
        subscriptionExpiresAt: journal.subscriptionExpiresAt,
        publisherId: journal.publisherId,
        qualityGrade: journal.qualityGrade,
        indexedAt: journal.indexedAt,
        disciplines,
        primaryDiscipline,
        quartile: hasArticles ? quartile : "Pending",
        disciplineRank: hasArticles ? disciplineRank : null,
        totalInDiscipline: hasArticles ? totalInDiscipline : null,
        categoryMedian: categoryMedian || null,
        selfCitationRate: Number(selfCitationRate.toFixed(1)),
        externalCitationRate: Number(externalCitationRate.toFixed(1)),
        impactWithoutSelfCitations,
        integrityScore: integrityReport.integrityScore,
        citationOrigin,
        citationDistribution,
        integrityReport,
        ycaScore: hasArticles && latestReport ? latestReport.standardScore : 0,
        lifetimeCitations: totalCitations,
        journalHIndex: trueHIndex,
        latestReport: hasArticles && latestReport ? {
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
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
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
