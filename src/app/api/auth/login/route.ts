import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { verifyPassword, createSessionToken } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    // Generate cryptographic HMAC-SHA256 signed session token
    const sessionToken = createSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      message: "Authenticated successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orcid: user.orcid,
        role: user.role
      }
    });

    // Set signed cookie valid for 7 days with secure production settings
    response.cookies.set("afriJournalSession", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax"
    });

    return response;

  } catch (error: any) {
    console.error("Login account error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  response.cookies.delete("afriJournalSession");
  return response;
}
