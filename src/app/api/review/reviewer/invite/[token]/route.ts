import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/db";
import { createSessionToken } from "../../../../../../lib/auth";
import { triggerNextCandidate, CandidateInfo } from "../../../../../../lib/review-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ success: false, error: "Invitation token is required." }, { status: 400 });
    }

    const assignment = await prisma.manuscriptReviewAssignment.findUnique({
      where: { invitationToken: token },
      include: {
        reviewRequest: {
          select: {
            id: true,
            title: true,
            abstract: true,
            discipline: true,
            targetJournal: true,
            createdAt: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            institution: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Review invitation not found or link has expired." }, { status: 404 });
    }

    const now = Date.now();
    const expiresMs = new Date(assignment.invitationExpiresAt).getTime();
    const isExpired = expiresMs < now;
    const hoursRemaining = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60)));

    return NextResponse.json({
      success: true,
      data: {
        assignmentId: assignment.id,
        status: isExpired && assignment.status === "INVITED" ? "EXPIRED" : assignment.status,
        invitationExpiresAt: assignment.invitationExpiresAt,
        hoursRemaining,
        reviewerName: assignment.reviewer.name,
        reviewerInstitution: assignment.reviewer.institution,
        manuscript: {
          title: assignment.reviewRequest.title,
          abstract: assignment.reviewRequest.abstract,
          discipline: assignment.reviewRequest.discipline,
          targetJournal: assignment.reviewRequest.targetJournal,
          createdAt: assignment.reviewRequest.createdAt
        }
      }
    });

  } catch (error: any) {
    console.error("Get review invite error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load invitation." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ success: false, error: "Invitation token is required." }, { status: 400 });
    }

    const body = await req.json();
    const { action, declineReason, nominatedColleague } = body;

    if (!["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action. Must be ACCEPT or DECLINE." }, { status: 400 });
    }

    const assignment = await prisma.manuscriptReviewAssignment.findUnique({
      where: { invitationToken: token },
      include: {
        reviewRequest: true,
        reviewer: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Invitation not found or link has expired." }, { status: 404 });
    }

    if (assignment.status !== "INVITED") {
      return NextResponse.json({
        success: false,
        error: `This invitation is already ${assignment.status.toLowerCase()}.`
      }, { status: 400 });
    }

    // Check 48h expiration
    if (new Date(assignment.invitationExpiresAt).getTime() < Date.now()) {
      await prisma.manuscriptReviewAssignment.update({
        where: { id: assignment.id },
        data: { status: "EXPIRED" }
      });
      await triggerNextCandidate(assignment.reviewRequestId);
      return NextResponse.json({ success: false, error: "This invitation has expired (48-hour response limit exceeded)." }, { status: 410 });
    }

    if (action === "ACCEPT") {
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

      // Generate session token so external scholar is seamlessly logged in
      const sessionToken = createSessionToken(assignment.reviewerId);
      const response = NextResponse.json({
        success: true,
        message: "Invitation accepted. Welcome to your double-blind evaluation workspace.",
        workspaceUrl: `/reviewer/workspace/${assignment.id}`
      });

      response.cookies.set("afriJournalSession", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
        sameSite: "lax"
      });

      return response;
    }

    if (action === "DECLINE") {
      const notes = declineReason ? `Referee declined with reason: ${declineReason}` : "Referee declined.";

      // If referee nominated an alternate colleague, append to queue
      if (nominatedColleague?.name && nominatedColleague.name.trim()) {
        try {
          const queue: CandidateInfo[] = JSON.parse(assignment.reviewRequest.candidateQueue || "[]");
          queue.push({
            id: `nominee_${Date.now()}`,
            name: nominatedColleague.name.trim(),
            email: nominatedColleague.email?.trim() || undefined,
            institution: nominatedColleague.institution?.trim() || undefined
          });
          await prisma.manuscriptReviewRequest.update({
            where: { id: assignment.reviewRequestId },
            data: { candidateQueue: JSON.stringify(queue) }
          });
        } catch (e) {
          console.error("Failed to append nominated colleague to queue:", e);
        }
      }

      await prisma.manuscriptReviewAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "DECLINED",
          confidentialNotes: notes
        }
      });

      // Advance cascade immediately to the next candidate
      await triggerNextCandidate(assignment.reviewRequestId);

      return NextResponse.json({
        success: true,
        message: "Thank you for notifying us. The sequential cascade has advanced to the next candidate."
      });
    }

  } catch (error: any) {
    console.error("Process invitation token error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process invitation." }, { status: 500 });
  }
}
