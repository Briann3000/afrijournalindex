import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, authenticated: false, error: "Not authenticated." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
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
