import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ success: false, error: "Search query is required." }, { status: 400 });
    }

    const trimmedQuery = query.trim();

    // Look up submission by ISSN first, then eISSN, then matching Journal Name
    const submission = await prisma.submission.findFirst({
      where: {
        OR: [
          { issn: trimmedQuery },
          { eissn: trimmedQuery },
          { journalName: { contains: trimmedQuery, mode: "insensitive" } }
        ]
      },
      orderBy: {
        createdAt: "desc" // Fetch the latest submission record if duplicates exist
      },
      select: {
        id: true
      }
    });

    if (!submission) {
      return NextResponse.json({ success: false, error: "No submission record found matching your query." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id
    });

  } catch (error: any) {
    console.error("Lookup status error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
