import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, orcid, institution, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "An account with this email address already exists." }, { status: 400 });
    }

    // ORCID format validation (if provided)
    if (orcid) {
      const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
      if (!orcidPattern.test(orcid.trim())) {
        return NextResponse.json({ success: false, error: "Invalid ORCID iD format. Use xxxx-xxxx-xxxx-xxxx." }, { status: 400 });
      }

      // Check unique constraint on ORCID
      const existingOrcid = await prisma.user.findUnique({
        where: { orcid: orcid.trim() }
      });
      if (existingOrcid) {
        return NextResponse.json({ success: false, error: "This ORCID iD is already registered to another account." }, { status: 400 });
      }
    }

    // In production, we would use bcrypt/argon2 to hash the password.
    // For this prototype/MVP, we'll store a simulated hash.
    const passwordHash = `sim_hash_${password}`;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        orcid: orcid ? orcid.trim() : null,
        institution: institution || null,
        role: role === "PUBLISHER" ? "PUBLISHER" : "RESEARCHER"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Account registered successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orcid: user.orcid,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error("Register account error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
