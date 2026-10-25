import { prisma } from "./db";
import { getDisciplines } from "./metrics";
import { ALL_AFRICAN_COUNTRIES } from "../app/data/african-countries";

export interface JournalDetail {
  id: string;
  name: string;
  issn: string | null;
  eissn: string | null;
  description: string;
  publisherName: string;
  country: string;
  frequency: string;
  websiteUrl: string;
  isIndexed: boolean;
  hasCrossrefDois?: boolean;
  doiArticleCount?: number;
  hasIssn?: boolean;
  verifiedIssn?: string | null;
  isDoajIndexed?: boolean;
  certificatePaid?: boolean;
  activeTier?: string;
  subscriptionExpiresAt?: string | null;
  publisherId?: string | null;
  qualityGrade: string | null;
  indexedAt: string | null;
  disciplines?: string[];
  primaryDiscipline?: string;
  quartile?: "Q1" | "Q2" | "Q3" | "Q4" | "Pending" | "Unrated";
  disciplineRank?: number | null;
  totalInDiscipline?: number | null;
  categoryMedian?: number | null;
  selfCitationRate?: number;
  externalCitationRate?: number;
  impactWithoutSelfCitations?: number;
  citationDistribution?: {
    total: number;
    zero: { count: number; percentage: number };
    one: { count: number; percentage: number };
    twoToNine: { count: number; percentage: number };
    tenPlus: { count: number; percentage: number };
  };
  integrityScore?: string;
  citationOrigin?: {
    total: number;
    regionalCount: number;
    globalCount: number;
    regionalPercentage: number;
    globalPercentage: number;
    topCitingCountries: Array<{ country: string; count: number }>;
  };
  integrityReport?: {
    selfCitationRate: number;
    externalCitationRate: number;
    integrityScore: string;
    cartelRisk: string;
    coerciveCitationFlag: boolean;
    recommendation: string;
  };
  ycaScore?: number;
  lifetimeCitations?: number;
  journalHIndex?: number;
  latestReport: {
    year: number;
    standardScore: number;
    regionalScore: number;
    citationCount: number;
    articleCount: number;
  } | null;
  historicalReports: Array<{
    year: number;
    standardScore: number;
    regionalScore: number;
    citationCount: number;
    articleCount: number;
  }>;
  articles: Array<{
    id: string;
    title: string;
    doi: string | null;
    url?: string | null;
    pdfUrl?: string | null;
    publishDate: string;
    citationCount: number;
    citations?: Array<{
      id: string;
      citingTitle: string;
      citingDoi: string | null;
      citingPdfUrl: string | null;
      citingJournal: string;
      citingCountry: string;
      citedAt: string;
    }>;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      institution: string | null;
      role: string;
    };
  }>;
}

export async function getJournalDetail(id: string): Promise<JournalDetail | null> {
  if (!id) return null;

  try {
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
      return null;
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
        publishDate: article.publishDate.toISOString(),
        citationCount: count,
        citations: citations.map((c: any) => ({
          id: c.id,
          citingTitle: c.citingArticle?.title || "Scholarly Article",
          citingDoi: c.citingArticle?.doi || null,
          citingPdfUrl: (c.citingArticle as any)?.pdfUrl || null,
          citingJournal: c.citingVenue || c.citingArticle?.journal?.name || "Peer-Reviewed Journal",
          citingCountry: c.citingCountry || c.citingArticle?.journal?.country || "International",
          citedAt: c.citedAt instanceof Date ? c.citedAt.toISOString() : String(c.citedAt)
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

    const latestReport = journal.reports[0] || null;
    const standardScore = latestReport ? latestReport.standardScore : 0;
    const regionalScore = latestReport ? latestReport.regionalScore : 0;

    const disciplines = getDisciplines(journal.name, journal.description || "");
    const primaryDiscipline = latestReport?.primaryDiscipline || disciplines[0] || "Multidisciplinary";

    let quartile: "Q1" | "Q2" | "Q3" | "Q4" | "Pending" | "Unrated" = (latestReport?.quartile as any) || undefined;
    const disciplineRank = latestReport?.disciplineRank || 1;
    const totalInDiscipline = latestReport?.totalInDiscipline || 20;

    if (!quartile) {
      if (standardScore <= 0) quartile = "Unrated";
      else if (standardScore >= 0.500) quartile = "Q1";
      else if (standardScore >= 0.250) quartile = "Q2";
      else if (standardScore >= 0.080) quartile = "Q3";
      else quartile = "Q4";
    }

    const categoryMedian = 0.42;
    const hasArticles = formattedArticles.length > 0;

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

    const sortedCitations = formattedArticles.map(a => a.citationCount).sort((a, b) => b - a);
    let trueHIndex = 0;
    for (let i = 0; i < sortedCitations.length; i++) {
      if (sortedCitations[i] >= i + 1) {
        trueHIndex = i + 1;
      } else {
        break;
      }
    }

    const impactWithoutSelfCitations = Number((standardScore * (externalCitationRate / 100)).toFixed(3));

    const articlesWithDoi = formattedArticles.filter((a: any) => a.doi && a.doi.trim().startsWith("10."));
    const doiArticleCount = articlesWithDoi.length;
    const hasCrossrefDois = doiArticleCount > 0;
    const verifiedIssn = journal.eissn || journal.issn || null;

    return {
      id: journal.id,
      name: journal.name,
      issn: journal.issn,
      eissn: journal.eissn,
      hasCrossrefDois,
      doiArticleCount,
      hasIssn: Boolean(verifiedIssn),
      verifiedIssn,
      isDoajIndexed: false,
      description: journal.description || "",
      publisherName: journal.publisherName,
      country: journal.country,
      frequency: journal.frequency,
      websiteUrl: journal.websiteUrl || "",
      isIndexed: journal.isIndexed,
      certificatePaid: journal.certificatePaid ?? false,
      activeTier: journal.activeTier || (journal.certificatePaid ? "BASIC" : "FREE"),
      subscriptionExpiresAt: journal.subscriptionExpiresAt ? journal.subscriptionExpiresAt.toISOString() : null,
      publisherId: journal.publisherId,
      qualityGrade: journal.qualityGrade,
      indexedAt: journal.indexedAt ? journal.indexedAt.toISOString() : null,
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
        regionalScore: latestReport.regionalScore ?? 0,
        citationCount: latestReport.citationCount,
        articleCount: latestReport.articleCount
      } : null,
      historicalReports: journal.reports.map(r => ({
        year: r.year,
        standardScore: r.standardScore,
        regionalScore: r.regionalScore ?? 0,
        citationCount: r.citationCount,
        articleCount: r.articleCount
      })),
      articles: formattedArticles,
      comments: journal.comments.map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.author.id,
          name: c.author.name,
          institution: c.author.institution,
          role: c.author.role
        }
      }))
    };
  } catch (err) {
    console.error("Error in getJournalDetail:", err);
    return null;
  }
}
