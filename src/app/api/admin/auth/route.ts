import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifyPassword, createSessionToken, verifySessionToken } from "../../../../lib/auth";

const ADMIN_PASSCODE = process.env.ADMIN_SETUP_KEY || "afri-editorial-admin-2026";

/**
 * GET /api/admin/auth
 * Verifies if the current caller has an active, valid administrator session.
 */
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
      select: { id: true, email: true, name: true, role: true, institution: true }
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

/**
 * POST /api/admin/auth
 * Handles:
 * 1. Dedicated Admin Direct Login ({ email, password })
 * 2. Elevation Passkey ({ passcode }) for legacy promotion
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Option 1: Direct Admin Sign-in via Email & Password
    if (body.email && body.password) {
      const cleanEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      if (!user || !verifyPassword(body.password, user.passwordHash)) {
        return NextResponse.json(
          { success: false, error: "Invalid admin credentials." },
          { status: 401 }
        );
      }

      if (user.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Access denied. Account does not have administrator privileges." },
          { status: 403 }
        );
      }

      const sessionToken = createSessionToken(user.id);
      const response = NextResponse.json({
        success: true,
        message: "Admin authentication successful.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
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
    }

    // Option 2: Elevation Passkey for active user session
    if (body.passcode) {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("afriJournalSession");
      const token = sessionCookie?.value;

      if (!token) {
        return NextResponse.json(
          { success: false, error: "Please log in first before claiming Admin privileges." },
          { status: 401 }
        );
      }

      const userId = verifySessionToken(token);
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired session. Please log in again." },
          { status: 401 }
        );
      }

      if (body.passcode !== ADMIN_PASSCODE) {
        return NextResponse.json(
          { success: false, error: "Incorrect Admin setup key." },
          { status: 403 }
        );
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
    }

    return NextResponse.json(
      { success: false, error: "Missing admin credentials or passkey." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Admin authentication error." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth
 * Terminates the admin session and clears the auth cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session terminated successfully."
  });

  response.cookies.set("afriJournalSession", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    sameSite: "lax"
  });

  return response;
}
