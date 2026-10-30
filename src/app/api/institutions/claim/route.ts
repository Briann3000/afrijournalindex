import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const id = searchParams.get("id");

    if (!name && !id) {
      return NextResponse.json({ success: false, error: "Institution name or ID is required." }, { status: 400 });
    }

    const institution = await prisma.institution.findFirst({
      where: id ? { id } : { name: { contains: name! } },
      select: {
        id: true,
        name: true,
        country: true,
        domain: true,
        websiteUrl: true,
        isClaimed: true,
        claimedByUserId: true,
        isKenproVerified: true,
        logoUrl: true,
        bannerUrl: true,
        accreditationBody: true,
        contactEmail: true,
        totalPublications: true,
        totalCitations: true,
        institutionalHIndex: true
      }
    });

    if (!institution) {
      return NextResponse.json({ success: false, error: "Institution not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      institution
    });
  } catch (error: any) {
    console.error("Institution claim check error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Verify user session
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/afriJournalSession=([^;]+)/);
    const token = sessionMatch ? sessionMatch[1] : null;

    let userId: string | null = null;
    if (token) {
      userId = verifySessionToken(token);
    }

    const body = await request.json();
    const targetUserId = body.userId || userId;
    const { institutionId, roleTitle, officialEmail, logoUrl, accreditationBody, verificationDocUrl } = body;

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: "You must be signed in to submit an institutional claim request."
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User account not found." }, { status: 404 });
    }

    if (!institutionId) {
      return NextResponse.json({ success: false, error: "Institution ID is required." }, { status: 400 });
    }

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId }
    });

    if (!institution) {
      return NextResponse.json({ success: false, error: "Institution record not found." }, { status: 404 });
    }

    if (institution.isClaimed && institution.claimedByUserId !== user.id) {
      return NextResponse.json({
        success: false,
        error: "This institution is already claimed and managed by another verified administrator."
      }, { status: 400 });
    }

    // Domain Verification: User's email or provided official email must match the university domain
    const candidateEmail = (officialEmail || user.email).toLowerCase().trim();
    const candidateDomain = candidateEmail.includes("@") ? candidateEmail.split("@")[1] : "";
    const instDomain = (institution.domain || "").toLowerCase().trim();

    if (instDomain && candidateDomain && !candidateDomain.includes(instDomain) && !instDomain.includes(candidateDomain)) {
      return NextResponse.json({
        success: false,
        error: `Your email domain (@${candidateDomain}) does not match the official institution domain (@${instDomain}). Please sign in with your official university address.`
      }, { status: 400 });
    }

    // Update institution and link user
    const updatedInstitution = await prisma.institution.update({
      where: { id: institution.id },
      data: {
        isClaimed: true,
        claimedByUserId: user.id,
        isKenproVerified: true,
        verificationDate: new Date(),
        ...(logoUrl ? { logoUrl } : {}),
        ...(accreditationBody ? { accreditationBody } : {}),
        ...(verificationDocUrl ? { verificationDocUrl } : {}),
        ...(officialEmail ? { contactEmail: officialEmail } : {})
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        institutionId: institution.id,
        institution: institution.name,
        role: "PUBLISHER" // Grants publisher/administrative powers
      }
    });

    return NextResponse.json({
      success: true,
      message: `Institution "${institution.name}" has been officially claimed and verified under your account (${user.name}, ${roleTitle || "University Representative"}).`,
      institution: updatedInstitution
    });

  } catch (error: any) {
    console.error("Institution claim error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
