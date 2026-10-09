import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, authenticated: false, error: "Not authenticated." }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ success: false, authenticated: false, error: "Invalid or expired session token." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        orcid: true,
        role: true,
        institution: true
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, authenticated: false, error: "User session not found." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user
    });

  } catch (error: any) {
    console.error("Get current user session error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
