import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { hashPassword, createSessionToken } from "../../../../lib/auth";
import { normalizeOrcid } from "../../../../lib/orcid";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, institution, department, country, googleScholarUrl, orcid, password } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanScholarUrl = googleScholarUrl ? googleScholarUrl.trim() : null;

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          cleanScholarUrl ? { googleScholarUrl: cleanScholarUrl } : { email: cleanEmail }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: `A profile already exists for this email or Google Scholar URL (${existing.name}). You can view or claim your existing profile.`
      }, { status: 409 });
    }

    // Default password or user-provided
    const rawPass = password && password.length >= 8 ? password : `AfriScholar@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await hashPassword(rawPass);

    let cleanOrcid: string | null = null;
    if (orcid && orcid.trim()) {
      cleanOrcid = normalizeOrcid(orcid);
    }

    // Extract Google Scholar ID if URL provided
    let googleScholarId: string | null = null;
    if (cleanScholarUrl) {
      const match = cleanScholarUrl.match(/user=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        googleScholarId = match[1];
      }
    }

    // Create scholar user
    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        institution: institution ? institution.trim() : null,
        department: department ? department.trim() : null,
        googleScholarUrl: cleanScholarUrl,
        googleScholarId,
        orcid: cleanOrcid,
        role: "RESEARCHER",
        isClaimed: true,
        metricsSource: cleanScholarUrl ? "GOOGLE_SCHOLAR" : "MANUAL",
        totalCitations: 0,
        hIndex: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: "Congratulations! Your Afri Scholar profile has been registered and indexed successfully.",
      scholarId: newUser.id,
      scholar: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        institution: newUser.institution,
        googleScholarUrl: newUser.googleScholarUrl
      }
    });

  } catch (err: any) {
    console.error("Register scholar error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to register scholar profile." }, { status: 500 });
  }
}
