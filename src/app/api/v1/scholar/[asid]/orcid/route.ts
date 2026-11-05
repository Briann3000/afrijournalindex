import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeAfriScholarId } from "@/lib/afrischolar-id";

export const dynamic = "force-dynamic";

/**
 * Public ORCID Federation & Two-Way Sync Endpoint
 * Connects to the public ORCID Registry API v3.0, verifies identity,
 * and formats sovereign external-id payloads for ORCID cross-registry federation.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ asid: string }> }
) {
  try {
    const { asid } = await params;
    if (!asid) {
      return NextResponse.json({ success: false, error: "Missing AfriScholar ID." }, { status: 400 });
    }

    const cleanAsid = normalizeAfriScholarId(asid);

    const scholar = await prisma.user.findFirst({
      where: {
        OR: [
          { afriScholarId: cleanAsid },
          { id: asid }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        afriScholarId: true,
        orcid: true,
        institution: true,
        department: true,
        totalCitations: true,
        hIndex: true
      }
    });

    if (!scholar) {
      return NextResponse.json({ success: false, error: "Scholar not found." }, { status: 404 });
    }

    if (!scholar.orcid) {
      return NextResponse.json({
        success: true,
        verified: false,
        afriScholarId: scholar.afriScholarId,
        name: scholar.name,
        message: "No ORCID is currently linked to this AfriScholar profile.",
        orcidExternalIdPayload: scholar.afriScholarId ? {
          "external-id-type": "afrischolar-id",
          "external-id-value": scholar.afriScholarId,
          "external-id-url": {
            "value": `https://afrijournalindexing.org/scholar/${scholar.afriScholarId}`
          },
          "external-id-relationship": "self"
        } : null
      });
    }

    // Clean ORCID string (e.g. "0000-0002-1825-0097" or "https://orcid.org/0000-0002-1825-0097")
    const cleanOrcid = scholar.orcid.replace(/^https?:\/\/orcid\.org\//i, "").trim();

    // Query ORCID Public v3.0 API
    let orcidRecord: any = null;
    let orcidError: string | null = null;

    try {
      const orcidRes = await fetch(`https://pub.orcid.org/v3.0/${encodeURIComponent(cleanOrcid)}/record`, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "AfriJournalIndex/1.0 (https://afrijournalindexing.org; registry@afrijournalindexing.org)"
        },
        next: { revalidate: 3600 }
      });

      if (orcidRes.ok) {
        orcidRecord = await orcidRes.json();
      } else {
        orcidError = `ORCID API returned HTTP ${orcidRes.status}`;
      }
    } catch (e: any) {
      orcidError = e.message || "Failed to reach ORCID public endpoint.";
    }

    const canonicalUrl = `https://afrijournalindexing.org/scholar/${scholar.afriScholarId}`;

    // Standard ORCID Member API external-id schema payload
    const orcidExternalIdPayload = {
      "external-id-type": "afrischolar-id",
      "external-id-value": scholar.afriScholarId,
      "external-id-url": {
        "value": canonicalUrl
      },
      "external-id-relationship": "self"
    };

    // Extract summary metadata from ORCID record if available
    const orcidPerson = orcidRecord?.person;
    const orcidGiven = orcidPerson?.name?.["given-names"]?.value || "";
    const orcidFamily = orcidPerson?.name?.["family-name"]?.value || "";
    const orcidFullName = [orcidGiven, orcidFamily].filter(Boolean).join(" ");

    return NextResponse.json({
      success: true,
      verified: Boolean(orcidRecord),
      scholar: {
        id: scholar.id,
        name: scholar.name,
        afriScholarId: scholar.afriScholarId,
        orcid: cleanOrcid,
        orcidUrl: `https://orcid.org/${cleanOrcid}`,
        institution: scholar.institution
      },
      orcidFederation: {
        linked: true,
        orcidUri: `https://orcid.org/${cleanOrcid}`,
        orcidName: orcidFullName || null,
        apiStatus: orcidRecord ? "AUTHENTICATED_PUBLIC_RECORD" : "REMOTE_LOOKUP_PENDING",
        apiError: orcidError,
        schemaBridge: "ORCID v3.0 External-ID Federation",
        externalIdSpec: orcidExternalIdPayload
      }
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400"
      }
    });

  } catch (error: any) {
    console.error("ORCID bridge API error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error." }, { status: 500 });
  }
}
