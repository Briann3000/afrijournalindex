import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";

const ADMIN_PASSCODE = process.env.ADMIN_SETUP_KEY || "afri-editorial-admin-2026";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    const token = sessionCookie?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, isAdmin: false });
    }

    const userId = verifySessionToken(token);
    if (!userId) {
      return NextResponse.json({ authenticated: false, isAdmin: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, isAdmin: false });
    }

    return NextResponse.json({
      authenticated: true,
      isAdmin: user.role === "ADMIN",
      user
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    const token = sessionCookie?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Please log in first before claiming Admin privileges." }, { status: 401 });
    }

    const userId = verifySessionToken(token);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid or expired session. Please log in again." }, { status: 401 });
    }

    const { passcode } = await request.json();
    if (!passcode || passcode !== ADMIN_PASSCODE) {
      return NextResponse.json({ success: false, error: "Incorrect Admin setup key." }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true }
    });

    return NextResponse.json({
      success: true,
      message: `Account ${updatedUser.email} has been elevated to Chief Administrator.`,
      user: updatedUser
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update role." }, { status: 500 });
  }
}
