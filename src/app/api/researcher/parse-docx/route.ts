import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../lib/auth";
import { parseDocxProfile } from "../../../../lib/docx-parser";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Authentication required to parse document." },
        { status: 401 }
      );
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid session." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No document attached." },
        { status: 400 }
      );
    }

    const name = (file.name || "").toLowerCase();
    if (!name.endsWith(".docx")) {
      return NextResponse.json(
        { success: false, error: "Only Word documents (.docx) are supported." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = parseDocxProfile(buffer);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: "Unable to extract content from Word document." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsed
    });
  } catch (error: any) {
    console.error("Docx parse error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to parse Word document." },
      { status: 500 }
    );
  }
}
