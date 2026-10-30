import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { crawlInstitutionalWebsite } from "../../../../lib/institution-crawler";
import { verifySessionToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Session check
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/afriJournalSession=([^;]+)/);
    const token = sessionMatch ? sessionMatch[1] : null;

    let sessionUserId: string | null = null;
    if (token) {
      sessionUserId = verifySessionToken(token);
    }

    const body = await request.json();
    const { institutionId, websiteUrl, autoApply } = body;

    if (!institutionId && !websiteUrl) {
      return NextResponse.json({
        success: false,
        error: "Either institutionId or websiteUrl is required."
      }, { status: 400 });
    }

    let targetUrl = websiteUrl;
    let targetInst: any = null;

    if (institutionId) {
      targetInst = await prisma.institution.findUnique({
        where: { id: institutionId }
      });
      if (targetInst && !targetUrl) {
        targetUrl = targetInst.websiteUrl;
      }
    }

    if (!targetUrl) {
      return NextResponse.json({
        success: false,
        error: "No website URL provided or recorded for this institution."
      }, { status: 400 });
    }

    // 2. Perform live metadata crawl
    const crawled = await crawlInstitutionalWebsite(targetUrl);

    // 3. If autoApply is true and institution exists, update database
    let updatedInstitution = null;
    if (targetInst && autoApply) {
      updatedInstitution = await prisma.institution.update({
        where: { id: targetInst.id },
        data: {
          websiteUrl: crawled.url,
          domain: crawled.domain || targetInst.domain,
          logoUrl: crawled.logoUrl || targetInst.logoUrl,
          contactEmail: crawled.contactEmail || targetInst.contactEmail,
          metadataSyncedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: crawled,
      institution: updatedInstitution,
      message: "Institutional metadata extracted successfully from official website."
    });

  } catch (error: any) {
    console.error("Institutional crawl error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to map metadata from website."
    }, { status: 500 });
  }
}
