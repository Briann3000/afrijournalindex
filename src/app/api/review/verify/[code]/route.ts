import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ success: false, error: "Verification code is required." }, { status: 400 });
    }

    const assignment = await prisma.manuscriptReviewAssignment.findUnique({
      where: { certificateVerificationId: code.toUpperCase() },
      include: {
        reviewer: {
          select: {
            name: true,
            institution: true,
            orcid: true,
            afriScholarId: true
          }
        },
        reviewRequest: {
          select: {
            discipline: true,
            trackingCode: true
          }
        }
      }
    });

    if (!assignment || !assignment.certificateIssued) {
      return NextResponse.json({ success: false, error: "Certificate verification ID not found or invalid." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        verificationId: assignment.certificateVerificationId,
        reviewerName: assignment.reviewer.name,
        reviewerInstitution: assignment.reviewer.institution || "African Academic Institution",
        reviewerAfriScholarId: assignment.reviewer.afriScholarId,
        orcid: assignment.reviewer.orcid,
        discipline: assignment.reviewRequest.discipline,
        trackingCode: assignment.reviewRequest.trackingCode,
        completedAt: assignment.completedAt,
        status: "VERIFIED",
        issuer: "AfriJournal Index Peer Review Registry"
      }
    });

  } catch (error: any) {
    console.error("Certificate verification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to verify certificate." }, { status: 500 });
  }
}
