import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
    }

    // Query submissions where authorId is the logged-in user
    const requests = await prisma.manuscriptReviewRequest.findMany({
      where: {
        authorId: userId
      },
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          select: {
            id: true,
            status: true,
            certificateIssued: true,
            certificateVerificationId: true,
            overallRecommendation: true,
            completedAt: true
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    const submissions = requests.map((req: any) => {
      const assignmentsList: any[] = req.assignments || [];
      const activeOrSubmitted = assignmentsList.find((a: any) => a.status === "SUBMITTED") || assignmentsList[0];
      return {
        id: req.id,
        trackingCode: req.trackingCode,
        title: req.title,
        discipline: req.discipline,
        targetJournal: req.targetJournal,
        status: req.status,
        createdAt: req.createdAt,
        completedAt: req.completedAt,
        recommendation: activeOrSubmitted?.overallRecommendation || null,
        certificateVerificationId: activeOrSubmitted?.certificateVerificationId || null
      };
    });

    return NextResponse.json({
      success: true,
      submissions
    });
  } catch (error: any) {
    console.error("Fetch my submissions error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load submissions" }, { status: 500 });
  }
}
