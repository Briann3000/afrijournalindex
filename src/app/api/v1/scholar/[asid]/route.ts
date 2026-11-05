import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { normalizeAfriScholarId, isValidAfriScholarId } from "../../../../../lib/afrischolar-id";
import { getScholarScientometrics } from "../../../../../lib/scholar-metrics";

interface RouteParams {
  params: Promise<{ asid: string }>;
}

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept"
    }
  });
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { asid } = await params;

    if (!asid) {
      return NextResponse.json(
        {
          status: "error",
          error: "AfriScholar persistent identifier (ASID) parameter is required."
        },
        { status: 400 }
      );
    }

    const cleanAsid = decodeURIComponent(asid).trim();
    const normalizedAsid = normalizeAfriScholarId(cleanAsid) || cleanAsid;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { afriScholarId: normalizedAsid },
          { afriScholarId: cleanAsid },
          { id: cleanAsid }
        ]
      },
      select: {
        id: true,
        afriScholarId: true,
        name: true,
        email: true,
        institution: true,
        department: true,
        bio: true,
        orcid: true,
        openAlexId: true,
        googleScholarId: true,
        googleScholarUrl: true,
        totalCitations: true,
        hIndex: true,
        i10Index: true,
        citations5Yr: true,
        hIndex5Yr: true,
        i10Index5Yr: true,
        isClaimed: true,
        metricsSource: true,
        institutionRelation: {
          select: {
            id: true,
            name: true,
            country: true,
            rorId: true,
            domain: true
          }
        },
        claims: {
          where: { status: "VERIFIED" },
          select: {
            id: true,
            role: true,
            claimedAt: true,
            article: {
              select: {
                id: true,
                title: true,
                doi: true,
                publishDate: true,
                citationCount: true,
                journal: {
                  select: {
                    name: true,
                    issn: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          code: "NOT_FOUND",
          message: `Scholar record with identifier "${cleanAsid}" could not be located in the AfriScholar Registry.`
        },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    const verifiedMetrics = getScholarScientometrics({
      id: user.id,
      name: user.name,
      orcid: user.orcid,
      bio: user.bio,
      totalCitations: user.totalCitations,
      hIndex: user.hIndex,
      i10Index: user.i10Index,
      citations5Yr: user.citations5Yr,
      hIndex5Yr: user.hIndex5Yr,
      i10Index5Yr: user.i10Index5Yr,
      googleScholarId: user.googleScholarId,
      googleScholarUrl: user.googleScholarUrl,
      openAlexId: user.openAlexId,
      department: user.department
    });

    const canonicalAsid = user.afriScholarId || normalizedAsid;
    const verifiedArticles = (user.claims || []).map(c => ({
      title: c.article.title,
      doi: c.article.doi,
      journal: c.article.journal?.name,
      issn: c.article.journal?.issn,
      publishDate: c.article.publishDate,
      citations: c.article.citationCount,
      authorshipRole: c.role
    }));

    const responsePayload = {
      status: "success",
      meta: {
        schema: "https://schema.org/Person",
        registry: "AfriScholar Registry (Pan-African Academic Identity Index)",
        generatedAt: new Date().toISOString()
      },
      data: {
        id: canonicalAsid,
        canonicalUri: `https://afrijournalindexing.org/scholar/${canonicalAsid}`,
        name: user.name,
        affiliation: {
          institution: user.institutionRelation?.name || user.institution || "Affiliation Unspecified",
          country: user.institutionRelation?.country || null,
          rorId: user.institutionRelation?.rorId || null,
          department: verifiedMetrics?.department || user.department || null
        },
        identifiers: {
          afrischolarId: canonicalAsid,
          orcid: user.orcid || null,
          orcidUri: user.orcid ? `https://orcid.org/${user.orcid}` : null,
          openAlexId: user.openAlexId || null,
          openAlexUri: user.openAlexId ? `https://openalex.org/authors/${user.openAlexId}` : null,
          googleScholarId: user.googleScholarId || null
        },
        scientometrics: {
          totalCitations: verifiedMetrics ? verifiedMetrics.totalCitations : user.totalCitations,
          hIndex: verifiedMetrics ? verifiedMetrics.hIndex : user.hIndex,
          i10Index: verifiedMetrics ? verifiedMetrics.i10Index : user.i10Index,
          citations5Yr: verifiedMetrics ? verifiedMetrics.citationsSince5Yr : user.citations5Yr,
          hIndex5Yr: verifiedMetrics ? verifiedMetrics.hIndexSince5Yr : user.hIndex5Yr,
          verifiedPublicationsCount: verifiedArticles.length
        },
        verifiedWorks: verifiedArticles,
        provenance: {
          isClaimed: user.isClaimed,
          metricsSource: user.metricsSource || "AUTHENTIC_REGISTRY"
        }
      }
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200"
      }
    });
  } catch (error: any) {
    console.error("Public API Scholar retrieval error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "An error occurred while resolving the scholar identifier."
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}
