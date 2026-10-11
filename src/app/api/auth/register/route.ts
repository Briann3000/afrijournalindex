import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { hashPassword, createSessionToken } from "../../../../lib/auth";
import { normalizeOrcid, verifyOrcidWithRegistry } from "../../researcher/profile/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, orcid, institution, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters in length." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "An account with this email address already exists." }, { status: 400 });
    }

    let verifiedOrcid: string | null = null;

    // ORCID format and live registry verification (if provided)
    if (orcid && orcid.trim()) {
      const cleanOrcid = normalizeOrcid(orcid);
      if (!cleanOrcid) {
        return NextResponse.json({ success: false, error: "Invalid ORCID iD format. Use 16 digits (e.g. 0000-0002-1825-0097)." }, { status: 400 });
      }

      // Check unique constraint on ORCID in database
      const existingOrcid = await prisma.user.findUnique({
        where: { orcid: cleanOrcid }
      });
      if (existingOrcid) {
        return NextResponse.json({ success: false, error: "This ORCID iD is already registered to another account." }, { status: 400 });
      }

      // Check live official ORCID registry
      const registryCheck = await verifyOrcidWithRegistry(cleanOrcid);
      if (registryCheck.exists === false) {
        return NextResponse.json({ 
          success: false, 
          error: registryCheck.error || `ORCID iD "${cleanOrcid}" does not exist in the official ORCID international registry.` 
        }, { status: 400 });
      }

      verifiedOrcid = cleanOrcid;
    }

    // Cryptographic scrypt password hashing
    const passwordHash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: cleanName,
        passwordHash,
        orcid: verifiedOrcid,
        institution: institution ? institution.trim() : null,
        role: role === "PUBLISHER" ? "PUBLISHER" : "RESEARCHER"
      }
    });

    // Auto-login: issue signed session token immediately
    const sessionToken = createSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Account registered successfully. Welcome to AfriJournal Index!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orcid: user.orcid,
        role: user.role
      }
    });

    response.cookies.set("afriJournalSession", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax"
    });

    return response;

  } catch (error: any) {
    console.error("Register account error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
