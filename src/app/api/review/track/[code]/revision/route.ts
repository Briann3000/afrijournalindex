import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/db";
import { sendEmail } from "../../../../../../lib/email";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ success: false, error: "Tracking code is required." }, { status: 400 });
    }

    const body = await req.json();
    const { revisedFileUrl, rebuttalNotes } = body;

    if (!revisedFileUrl || !rebuttalNotes || rebuttalNotes.trim().length < 20) {
      return NextResponse.json({
        success: false,
        error: "Revised manuscript URL and a detailed author rebuttal letter (min 20 characters) are required."
      }, { status: 400 });
    }

    const request = await prisma.manuscriptReviewRequest.findUnique({
      where: { trackingCode: code.toUpperCase() },
      include: {
        assignments: {
          where: { status: "SUBMITTED" },
          include: {
            reviewer: { select: { email: true, name: true } }
          }
        }
      }
    });

    if (!request) {
      return NextResponse.json({ success: false, error: "Review tracking record not found." }, { status: 404 });
    }

    // Record revision data in supplementaryUrl JSON
    let existingMeta: any = {};
    try {
      existingMeta = request.supplementaryUrl ? JSON.parse(request.supplementaryUrl) : {};
    } catch {
      existingMeta = { originalSupplementaryUrl: request.supplementaryUrl };
    }

    existingMeta.revisionSubmittedAt = new Date().toISOString();
    existingMeta.revisedManuscriptUrl = revisedFileUrl.trim();
    existingMeta.authorRebuttalNotes = rebuttalNotes.trim();

    await prisma.manuscriptReviewRequest.update({
      where: { id: request.id },
      data: {
        supplementaryUrl: JSON.stringify(existingMeta)
      }
    });

    // Notify reviewer if available
    const reviewer = request.assignments[0]?.reviewer;
    if (reviewer && reviewer.email && !reviewer.email.includes("@afrijournalindex.org")) {
      const baseUrl = process.env.NEXTAUTH_URL || "https://afrijournalindex.org";
      sendEmail({
        to: reviewer.email,
        subject: `[Author Revision Lodged] Revised Manuscript & Rebuttal for "${request.title.slice(0, 50)}..."`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
            <h3 style="color: #0f172a; margin-top: 0;">Author Revisions Submitted</h3>
            <p>Dear <strong>${reviewer.name}</strong>,</p>
            <p>The author of manuscript <strong>"${request.title}"</strong> (${request.trackingCode}) has submitted a revised manuscript and response rebuttal addressing your peer evaluation.</p>
            <div style="background: #f8fafc; border-left: 4px solid #b45309; padding: 12px 16px; margin: 16px 0;">
              <strong>Author Rebuttal Summary:</strong>
              <div style="font-size: 13px; color: #475569; margin-top: 6px; white-space: pre-line;">${rebuttalNotes.slice(0, 400)}...</div>
            </div>
            <p><a href="${baseUrl}/reviewer" style="background: #b45309; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">View in Peer Review Portal &rarr;</a></p>
          </div>
        `
      }).catch(err => console.error("Reviewer revision notification error:", err));
    }

    return NextResponse.json({
      success: true,
      message: "Revised manuscript and point-by-point rebuttal recorded successfully."
    });

  } catch (error: any) {
    console.error("Submit revision error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit revision." }, { status: 500 });
  }
}
