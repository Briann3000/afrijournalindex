import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { checkAndCascadeExpiredAssignments } from "../../../../../lib/review-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ success: false, error: "Tracking code is required." }, { status: 400 });
    }

    // Lazy cascade check
    await checkAndCascadeExpiredAssignments().catch(() => {});

    const request = await prisma.manuscriptReviewRequest.findUnique({
      where: { trackingCode: code.toUpperCase() },
      include: {
        assignments: {
          select: {
            id: true,
            status: true,
            invitationExpiresAt: true,
            reviewDeadlineAt: true,
            methodologyScore: true,
            originalityScore: true,
            literatureScore: true,
            integrityScore: true,
            presentationScore: true,
            overallRecommendation: true,
            feedbackSummary: true,
            methodologyCritique: true,
            literatureCritique: true,
            actionableRevisions: true,
            certificateIssued: true,
            certificateVerificationId: true,
            completedAt: true
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!request) {
      return NextResponse.json({ success: false, error: "Review tracking code not found." }, { status: 404 });
    }

    const currentAssignment = request.assignments[0] || null;

    let countdownHours: number | null = null;
    let deadlineDays: number | null = null;

    if (currentAssignment) {
      if (currentAssignment.status === "INVITED") {
        const msRemaining = new Date(currentAssignment.invitationExpiresAt).getTime() - Date.now();
        countdownHours = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60)));
      } else if (currentAssignment.status === "ACCEPTED" && currentAssignment.reviewDeadlineAt) {
        const msRemaining = new Date(currentAssignment.reviewDeadlineAt).getTime() - Date.now();
        deadlineDays = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      }
    }

    const completedAssignment = request.assignments.find(a => a.status === "SUBMITTED");

    return NextResponse.json({
      success: true,
      data: {
        trackingCode: request.trackingCode,
        title: request.title,
        abstract: request.abstract,
        discipline: request.discipline,
        targetJournal: request.targetJournal,
        status: request.status,
        createdAt: request.createdAt,
        completedAt: request.completedAt,
        currentStage: {
          status: currentAssignment?.status || "PENDING",
          countdownHours,
          deadlineDays
        },
        evaluationReport: completedAssignment ? {
          methodologyScore: completedAssignment.methodologyScore,
          originalityScore: completedAssignment.originalityScore,
          literatureScore: completedAssignment.literatureScore,
          integrityScore: completedAssignment.integrityScore,
          presentationScore: completedAssignment.presentationScore,
          overallRecommendation: completedAssignment.overallRecommendation,
          feedbackSummary: completedAssignment.feedbackSummary,
          methodologyCritique: completedAssignment.methodologyCritique,
          literatureCritique: completedAssignment.literatureCritique,
          actionableRevisions: completedAssignment.actionableRevisions,
          completedAt: completedAssignment.completedAt,
          certificateVerificationId: completedAssignment.certificateVerificationId
        } : null
      }
    });

  } catch (error: any) {
    console.error("Track review error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to retrieve tracking information." }, { status: 500 });
  }
}
