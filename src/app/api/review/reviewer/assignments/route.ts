import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/db";
import { verifySessionToken } from "../../../../../lib/auth";
import { checkAndCascadeExpiredAssignments } from "../../../../../lib/review-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, authenticated: false, error: "Please log in to access the Reviewer Hub." }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ success: false, authenticated: false, error: "Invalid session." }, { status: 401 });
    }

    // Lazy check on expired 48h invitations
    await checkAndCascadeExpiredAssignments().catch(() => {});

    const assignments = await prisma.manuscriptReviewAssignment.findMany({
      where: { reviewerId: userId },
      include: {
        reviewRequest: {
          select: {
            id: true,
            trackingCode: true,
            title: true,
            abstract: true,
            discipline: true,
            targetJournal: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const now = Date.now();

    const pendingInvitations = assignments
      .filter(a => a.status === "INVITED" && new Date(a.invitationExpiresAt).getTime() > now)
      .map(a => {
        const msRemaining = new Date(a.invitationExpiresAt).getTime() - now;
        return {
          id: a.id,
          invitationToken: a.invitationToken,
          title: a.reviewRequest.title,
          abstract: a.reviewRequest.abstract,
          discipline: a.reviewRequest.discipline,
          targetJournal: a.reviewRequest.targetJournal,
          invitationExpiresAt: a.invitationExpiresAt,
          hoursRemaining: Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)))
        };
      });

    const activeReviews = assignments
      .filter(a => a.status === "ACCEPTED")
      .map(a => {
        const msRemaining = a.reviewDeadlineAt ? new Date(a.reviewDeadlineAt).getTime() - now : 0;
        return {
          id: a.id,
          title: a.reviewRequest.title,
          discipline: a.reviewRequest.discipline,
          reviewDeadlineAt: a.reviewDeadlineAt,
          daysRemaining: Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
        };
      });

    const completedReviews = assignments
      .filter(a => a.status === "SUBMITTED")
      .map(a => ({
        id: a.id,
        title: a.reviewRequest.title,
        discipline: a.reviewRequest.discipline,
        overallRecommendation: a.overallRecommendation,
        completedAt: a.completedAt,
        certificateVerificationId: a.certificateVerificationId,
        certificateIssued: a.certificateIssued
      }));

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        pendingInvitations,
        activeReviews,
        completedReviews
      }
    });

  } catch (error: any) {
    console.error("Get reviewer assignments error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load reviewer tasks." }, { status: 500 });
  }
}
