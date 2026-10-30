import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/db";
import { verifySessionToken } from "../../../../../lib/auth";
import { triggerNextCandidate } from "../../../../../lib/review-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Please log in to respond to this review invitation." }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid session." }, { status: 401 });
    }

    const body = await req.json();
    const { assignmentId, action } = body; // action: "ACCEPT" | "DECLINE"

    if (!assignmentId || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid parameters." }, { status: 400 });
    }

    const assignment = await prisma.manuscriptReviewAssignment.findUnique({
      where: { id: assignmentId },
      include: { reviewRequest: true }
    });

    if (!assignment || assignment.reviewerId !== userId) {
      return NextResponse.json({ success: false, error: "Review assignment not found or access denied." }, { status: 404 });
    }

    if (assignment.status !== "INVITED") {
      return NextResponse.json({ success: false, error: "This invitation is no longer active." }, { status: 400 });
    }

    // Check if 48h expired
    if (new Date(assignment.invitationExpiresAt).getTime() < Date.now()) {
      await prisma.manuscriptReviewAssignment.update({
        where: { id: assignment.id },
        data: { status: "EXPIRED" }
      });
      // Cascade to next candidate
      await triggerNextCandidate(assignment.reviewRequestId);
      return NextResponse.json({ success: false, error: "This invitation has expired (48-hour response limit exceeded)." }, { status: 410 });
    }

    if (action === "ACCEPT") {
      // 10 days for evaluation
      const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      await prisma.manuscriptReviewAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "ACCEPTED",
          reviewDeadlineAt: deadline
        }
      });

      await prisma.manuscriptReviewRequest.update({
        where: { id: assignment.reviewRequestId },
        data: { status: "UNDER_REVIEW" }
      });

      return NextResponse.json({
        success: true,
        message: "Invitation accepted. You can now begin your evaluation.",
        workspaceUrl: `/reviewer/workspace/${assignment.id}`
      });
    }

    if (action === "DECLINE") {
      await prisma.manuscriptReviewAssignment.update({
        where: { id: assignment.id },
        data: { status: "DECLINED" }
      });

      // Immediately cascade to the next candidate
      await triggerNextCandidate(assignment.reviewRequestId);

      return NextResponse.json({
        success: true,
        message: "Invitation declined. Thank you for notifying us."
      });
    }

  } catch (error: any) {
    console.error("Reviewer respond error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process invitation response." }, { status: 500 });
  }
}
