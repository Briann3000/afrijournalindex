import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  response.cookies.set("afriJournalSession", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const response = NextResponse.redirect(new URL("/login", origin));
  response.cookies.set("afriJournalSession", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}
