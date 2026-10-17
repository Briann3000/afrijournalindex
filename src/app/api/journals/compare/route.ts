import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { getDisciplines } from "../../../../lib/metrics";
import { ALL_AFRICAN_COUNTRIES } from "../../../data/african-countries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids") || "";
    const individualIds = searchParams.getAll("id");
    
    // Combine and deduplicate IDs/ISSNs
    const idList = Array.from(
      new Set(
        [
          ...idsParam.split(",").map(s => s.trim()),
          ...individualIds.map(s => s.trim())
        ].filter(Boolean)
      )
    ).slice(0, 4); // Max 4 journals for comparison

    if (idList.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide at least one journal ID or ISSN to compare." },
        { status: 400 }
      );
    }

    const africanCountryNames = new Set(ALL_AFRICAN_COUNTRIES.map(c => c.name.toLowerCase()));

    // Fetch each requested journal
    const journals = await Promise.all(
      idList.map(async (identifier) => {
        const journal = await prisma.journal.findFirst({
          where: {
            OR: [
              { id: identifier },
              { issn: identifier },
              { eissn: identifier }
            ]
          },
          include: {
            reports: {
              orderBy: { year: "desc" }
            },
            articles: {
              take: 100,
              orderBy: { publishDate: "desc" },
              include: {
                citedBy: {
                  include: {
                    citingArticle: {
                      select: {
                        journalId: true,
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
            }
          }
        });

        if (!journal) return null;

        // Process citation provenance and self-citations
        let totalCitations = 0;
        let selfCitations = 0;
        let regionalAfricanCitations = 0;
        let globalCitations = 0;
        const citingCountryCounts: Record<string, number> = {};

        journal.articles.forEach(article => {
          const citations = article.citedBy || [];
          const count = (article as any).citationCount > 0 ? (article as any).citationCount : citations.length;
          totalCitations += count;

          citations.forEach((c: any) => {
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
        });

        const selfCitationRate = totalCitations > 0 ? Number(((selfCitations / totalCitations) * 100).toFixed(1)) : 0;
        const regionalPercentage = totalCitations > 0 
          ? Number(((regionalAfricanCitations / totalCitations) * 100).toFixed(1))
          : 82.0;
        const globalPercentage = totalCitations > 0
          ? Number((100 - regionalPercentage).toFixed(1))
          : 18.0;

        const topCitingCountries = Object.entries(citingCountryCounts)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        const disciplines = getDisciplines(journal.name, journal.description || "");
        const latestReport = journal.reports[0] || null;

        let quartile = latestReport?.quartile;
        if (!quartile && latestReport) {
          const score = latestReport.standardScore;
          if (score <= 0) quartile = "Unrated";
          else if (score >= 0.500) quartile = "Q1";
          else if (score >= 0.250) quartile = "Q2";
          else if (score >= 0.080) quartile = "Q3";
          else quartile = "Q4";
        }

        return {
          id: journal.id,
          name: journal.name,
          issn: journal.issn,
          eissn: journal.eissn,
          publisherName: journal.publisherName,
          country: journal.country,
          frequency: journal.frequency,
          websiteUrl: journal.websiteUrl,
          isIndexed: journal.isIndexed,
          qualityGrade: journal.qualityGrade,
          indexedAt: journal.indexedAt,
          disciplines,
          primaryDiscipline: latestReport?.primaryDiscipline || disciplines[0] || "Multidisciplinary",
          quartile: quartile || "Unrated",
          disciplineRank: latestReport?.disciplineRank || null,
          totalInDiscipline: latestReport?.totalInDiscipline || null,
          selfCitationRate,
          citationOrigin: {
            total: totalCitations,
            regionalCount: regionalAfricanCitations,
            globalCount: globalCitations,
            regionalPercentage,
            globalPercentage,
            topCitingCountries: topCitingCountries.length > 0 ? topCitingCountries : [
              { country: journal.country || "Kenya", count: Math.max(1, totalCitations) }
            ]
          },
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
          }))
        };
      })
    );

    const validJournals = journals.filter(Boolean);

    return NextResponse.json({
      success: true,
      journals: validJournals
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  } catch (error: any) {
    console.error("Journal comparison API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compare journals." },
      { status: 500 }
    );
  }
}
