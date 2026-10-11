import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Submission ID is required." }, { status: 400 });
    }

    const cleanId = id.trim();
    let submission = await prisma.submission.findUnique({
      where: { id: cleanId },
      include: {
        journal: {
          include: {
            reports: true
          }
        }
      }
    });

    // Fallback: search by ISSN, eISSN, or journalId
    if (!submission) {
      submission = await prisma.submission.findFirst({
        where: {
          OR: [
            { issn: cleanId },
            { eissn: cleanId },
            { journalId: cleanId }
          ]
        },
        orderBy: { createdAt: "desc" },
        include: {
          journal: {
            include: {
              reports: true
            }
          }
        }
      });
    }

    if (!submission) {
      return NextResponse.json({ success: false, error: `No submission record found matching "${cleanId}".` }, { status: 404 });
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
