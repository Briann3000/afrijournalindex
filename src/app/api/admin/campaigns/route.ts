import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";
import { harvestAfricanCandidates } from "../../../../lib/campaign-harvester";
import { generateInvitationEmail } from "../../../../lib/campaign-mailer";
import { sendEmail } from "../../../../lib/email";

export const dynamic = "force-dynamic";

// GET: Retrieve all journal candidates with optional country/track filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const track = searchParams.get("track");
    const status = searchParams.get("status");

    const where: any = {};
    if (country && country !== "All") where.country = country;
    if (track && track !== "All") where.invitationTrack = track;
    if (status && status !== "All") where.invitationStatus = status;

    const candidates = await prisma.journalCandidate.findMany({
      where,
      orderBy: { createdAt: "desc" }
    });

    const summary = {
      total: await prisma.journalCandidate.count(),
      pending: await prisma.journalCandidate.count({ where: { invitationStatus: "PENDING" } }),
      invited: await prisma.journalCandidate.count({ where: { invitationStatus: "INVITED" } }),
      applied: await prisma.journalCandidate.count({ where: { invitationStatus: "APPLIED" } })
    };

    return NextResponse.json({
      success: true,
      summary,
      candidates
    });
  } catch (error: any) {
    console.error("Fetch candidates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Actions (Harvest new leads OR Dispatch invitation emails)
export async function POST(request: Request) {
  try {
    // Session authorization check
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/afriJournalSession=([^;]+)/);
    const token = sessionMatch ? sessionMatch[1] : null;

    let userId: string | null = null;
    if (token) {
      userId = verifySessionToken(token);
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access." }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Administrative privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { action, candidateIds, lang = "en", customSubject, customHtml } = body;

    // Preview Email Template Action
    if (action === "preview") {
      const { candidateId } = body;
      const c = await prisma.journalCandidate.findUnique({ where: { id: candidateId } });
      if (!c) {
        return NextResponse.json({ success: false, error: "Candidate not found." }, { status: 404 });
      }

      const emailData = generateInvitationEmail(
        {
          journalName: c.journalName,
          editorName: c.editorName || "Editor-in-Chief",
          institutionName: c.institutionName || undefined,
          country: c.country,
          discipline: c.discipline || "Multidisciplinary",
          inviteToken: c.inviteToken || c.id,
          track: c.invitationTrack as any,
          journalId: c.journalId || undefined
        },
        lang as any
      );

      return NextResponse.json({
        success: true,
        preview: emailData,
        candidate: c
      });
    }

    // 1. Action: Trigger Harvester
    if (action === "harvest") {
      const { pool } = await import("../../../../lib/db");
      const harvestResult = await harvestAfricanCandidates(pool);
      return NextResponse.json({
        success: true,
        message: `Harvester completed: Added ${harvestResult.added} new candidate(s), skipped ${harvestResult.skipped} existing journals. Total pool: ${harvestResult.total}.`,
        result: harvestResult
      });
    }

    // 2. Action: Dispatch Batch Invitations
    if (action === "dispatch") {
      if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
        return NextResponse.json({ success: false, error: "No candidate IDs selected for dispatch." }, { status: 400 });
      }

      const candidates = await prisma.journalCandidate.findMany({
        where: { id: { in: candidateIds } }
      });

      let sentCount = 0;
      let failureCount = 0;

      for (const c of candidates) {
        try {
          const defaultEmailData = generateInvitationEmail(
            {
              journalName: c.journalName,
              editorName: c.editorName || "Editor-in-Chief",
              institutionName: c.institutionName || undefined,
              country: c.country,
              discipline: c.discipline || "Multidisciplinary",
              inviteToken: c.inviteToken || c.id,
              track: c.invitationTrack as any,
              journalId: c.journalId || undefined
            },
            lang as any
          );

          // Allow custom subject / html override from admin preview editor
          const subjectToSend = customSubject || defaultEmailData.subject;
          const htmlToSend = customHtml
            ? customHtml.replace(/\{\{journalName\}\}/g, c.journalName).replace(/\{\{editorName\}\}/g, c.editorName || "Editor")
            : defaultEmailData.html;

          const result = await sendEmail({
            to: c.editorEmail,
            subject: subjectToSend,
            html: htmlToSend
          });

          if (result.success) {
            sentCount++;
            await prisma.journalCandidate.update({
              where: { id: c.id },
              data: {
                invitationStatus: "INVITED",
                invitedAt: new Date()
              }
            });
          } else {
            failureCount++;
          }
        } catch (dispatchErr) {
          console.error(`Dispatch failure for candidate ${c.id}:`, dispatchErr);
          failureCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Dispatched ${sentCount} invitation(s). Failures: ${failureCount}.`,
        sentCount,
        failureCount
      });
    }

    return NextResponse.json({ success: false, error: "Invalid campaign action specified." }, { status: 400 });
  } catch (error: any) {
    console.error("Campaign API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
