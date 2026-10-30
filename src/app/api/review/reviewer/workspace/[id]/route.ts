import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../../lib/db";
import { verifySessionToken } from "../../../../../../lib/auth";
import { generateCertificateVerificationId } from "../../../../../../lib/review-service";
import { sendEmail } from "../../../../../../lib/email";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Please log in to access the Reviewer Workspace." }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid session." }, { status: 401 });
    }

    const assignment = await prisma.manuscriptReviewAssignment.findUnique({
      where: { id },
      include: {
        reviewRequest: {
          select: {
            id: true,
            trackingCode: true,
            title: true,
            abstract: true,
            discipline: true,
            targetJournal: true,
            manuscriptFileUrl: true,
            supplementaryUrl: true,
            createdAt: true
            // Double-blind: authorId, author details strictly omitted!
          }
        }
      }
    });

    if (!assignment || assignment.reviewerId !== userId) {
      return NextResponse.json({ success: false, error: "Assignment not found or access denied." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        assignmentId: assignment.id,
        status: assignment.status,
        reviewDeadlineAt: assignment.reviewDeadlineAt,
        manuscript: assignment.reviewRequest,
        rubric: {
          methodologyScore: assignment.methodologyScore,
          originalityScore: assignment.originalityScore,
          literatureScore: assignment.literatureScore,
          integrityScore: assignment.integrityScore,
          presentationScore: assignment.presentationScore,
          overallRecommendation: assignment.overallRecommendation,
          feedbackSummary: assignment.feedbackSummary,
          methodologyCritique: assignment.methodologyCritique,
          literatureCritique: assignment.literatureCritique,
          actionableRevisions: assignment.actionableRevisions,
          confidentialNotes: assignment.confidentialNotes
        }
      }
    });

  } catch (error: any) {
    console.error("Get reviewer workspace error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load workspace." }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Please log in to submit your evaluation." }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid session." }, { status: 401 });
    }

    const assignment = await prisma.manuscriptReviewAssignment.findUnique({
      where: { id },
      include: {
        reviewRequest: {
          include: {
            author: {
              select: { email: true, name: true }
            }
          }
        }
      }
    });

    if (!assignment || assignment.reviewerId !== userId) {
      return NextResponse.json({ success: false, error: "Assignment not found or access denied." }, { status: 403 });
    }

    if (assignment.status === "SUBMITTED") {
      return NextResponse.json({ success: false, error: "This evaluation has already been submitted." }, { status: 400 });
    }

    const body = await req.json();
    const {
      methodologyScore,
      originalityScore,
      literatureScore,
      integrityScore,
      presentationScore,
      overallRecommendation,
      feedbackSummary,
      methodologyCritique,
      literatureCritique,
      actionableRevisions,
      confidentialNotes
    } = body;

    // Validate 1-5 ratings
    const scores = [methodologyScore, originalityScore, literatureScore, integrityScore, presentationScore];
    for (const s of scores) {
      if (typeof s !== "number" || s < 1 || s > 5) {
        return NextResponse.json({ success: false, error: "All 5 academic rubric dimensions must be scored between 1 and 5." }, { status: 400 });
      }
    }

    if (!overallRecommendation || !["ACCEPT_AS_IS", "MINOR_REVISION", "MAJOR_REVISION", "REJECT_RESUBMIT"].includes(overallRecommendation)) {
      return NextResponse.json({ success: false, error: "Please select an overall recommendation." }, { status: 400 });
    }

    if (!actionableRevisions || actionableRevisions.trim().length < 30) {
      return NextResponse.json({ success: false, error: "Please provide detailed, actionable revision notes for the author (minimum 30 characters)." }, { status: 400 });
    }

    const certId = generateCertificateVerificationId();
    const completedAt = new Date();

    await prisma.manuscriptReviewAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "SUBMITTED",
        methodologyScore,
        originalityScore,
        literatureScore,
        integrityScore,
        presentationScore,
        overallRecommendation,
        feedbackSummary: feedbackSummary?.trim() || null,
        methodologyCritique: methodologyCritique?.trim() || null,
        literatureCritique: literatureCritique?.trim() || null,
        actionableRevisions: actionableRevisions.trim(),
        confidentialNotes: confidentialNotes?.trim() || null,
        certificateIssued: true,
        certificateVerificationId: certId,
        completedAt
      }
    });

    // Mark the review request as completed
    await prisma.manuscriptReviewRequest.update({
      where: { id: assignment.reviewRequestId },
      data: {
        status: "COMPLETED",
        completedAt
      }
    });

    // Automated Notification Email to Author
    const authorEmail = assignment.reviewRequest.author?.email;
    if (authorEmail) {
      const baseUrl = process.env.NEXTAUTH_URL || "https://afrijournalindex.org";
      const trackingUrl = `${baseUrl}/review/track/${assignment.reviewRequest.trackingCode}`;
      const recMap: Record<string, string> = {
        ACCEPT_AS_IS: "Accept As Is",
        MINOR_REVISION: "Minor Revision",
        MAJOR_REVISION: "Major Revision",
        REJECT_RESUBMIT: "Reject & Resubmit to Alternate Venue"
      };
      const recText = recMap[overallRecommendation] || overallRecommendation;

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="margin-bottom: 20px;">
            <span style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 14px; text-transform: uppercase;">
              Peer Review Completed
            </span>
          </div>
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px;">
            Academic Review Report Ready
          </h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
            Your manuscript titled <strong>"${assignment.reviewRequest.title}"</strong> has completed formal double-blind peer review by an accredited African subject-matter referee.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Tracking Reference</div>
            <div style="font-size: 16px; font-weight: 800; color: #b45309; font-family: monospace; margin-bottom: 12px;">${assignment.reviewRequest.trackingCode}</div>

            <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Referee Scholarly Recommendation</div>
            <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${recText}</div>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
            You can access your complete 5-pillar evaluation dossier, including numbered actionable revisions and certificate verification details, via the live tracker.
          </p>

          <a href="${trackingUrl}" style="display: inline-block; background: #b45309; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px;">
            Open Review Dossier & Actionable Revisions
          </a>

          <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 16px; font-size: 12px; color: #94a3b8;">
            AfriJournal Index Peer Review Desk &bull; Independent African Academic Indexing
          </div>
        </div>
      `;

      sendEmail({
        to: authorEmail,
        subject: `[AfriJournal Index] Peer Review Completed: ${assignment.reviewRequest.title.substring(0, 50)}...`,
        html: emailHtml
      }).catch(err => console.error("Author review completed email failed:", err));
    }

    return NextResponse.json({
      success: true,
      message: "Academic evaluation successfully submitted. Your peer review certificate has been issued.",
      certificateVerificationId: certId
    });

  } catch (error: any) {
    console.error("Submit reviewer evaluation error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit evaluation." }, { status: 500 });
  }
}
