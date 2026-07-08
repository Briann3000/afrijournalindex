import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

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

    if (!user || user.passwordHash !== `sim_hash_${password}`) {
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    // Set a session cookie containing the user ID for simplicity in Next App Router
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

    // Set cookie valid for 7 days
    response.cookies.set("afriJournalSession", user.id, {
      httpOnly: true,
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
