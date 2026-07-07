import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Submission ID is required." }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        journal: {
          include: {
            reports: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ success: false, error: "Submission not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        submission,
        journal: submission.journal
      }
    });

  } catch (error: any) {
    console.error("Fetch submission status error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
