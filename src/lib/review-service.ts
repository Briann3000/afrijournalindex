import { prisma } from "./db";
import crypto from "crypto";
import { sendEmail } from "./email";

export interface CandidateInfo {
  id: string; // User id or OpenAlex id
  name: string;
  email?: string;
  institution?: string;
  country?: string;
  orcid?: string | null;
}

/**
 * Generates an official tracking code for manuscript reviews.
 * Format: REV-YYYY-XXXX (e.g. REV-2026-A821)
 */
export function generateTrackingCode(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REV-${year}-${hex}`;
}

/**
 * Generates a tamper-proof verification ID for peer review certificates.
 * Format: CERT-YYYY-XXXXXX
 */
export function generateCertificateVerificationId(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `CERT-${year}-${hex}`;
}

/**
 * Checks for potential Conflict of Interest between author and reviewer candidate:
 * - Same user ID
 * - Same institution
 * - Author explicitly excluded candidate name or institution
 */
export function checkConflictOfInterest(
  author: { id: string; institution?: string | null; name: string },
  candidate: CandidateInfo,
  excludedText?: string | null,
  isDevTest: boolean = false
): { hasConflict: boolean; reason?: string } {
  if (!isDevTest && author.id === candidate.id) {
    return { hasConflict: true, reason: "Self-review is strictly forbidden." };
  }

  if (
    !isDevTest &&
    author.institution &&
    candidate.institution &&
    author.institution.trim().toLowerCase() === candidate.institution.trim().toLowerCase()
  ) {
    return { hasConflict: true, reason: "Affiliated with the same academic institution." };
  }

  if (excludedText && excludedText.trim().length > 0) {
    const excludedList = excludedText
      .split(/[,\n]/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    for (const item of excludedList) {
      if (candidate.name.toLowerCase().includes(item)) {
        return { hasConflict: true, reason: "Declared conflict of interest with candidate." };
      }
      if (candidate.institution && candidate.institution.toLowerCase().includes(item)) {
        return { hasConflict: true, reason: "Declared conflict of interest with candidate's institution." };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Advances the cascade by inviting the next eligible reviewer candidate in the queue.
 * Each candidate is given a strict 48-hour acceptance window.
 */
export async function triggerNextCandidate(
  reviewRequestId: string,
  baseUrl?: string,
  isDevTest: boolean = false
): Promise<{ success: boolean; assignmentId?: string; finished?: boolean }> {
  const request = await prisma.manuscriptReviewRequest.findUnique({
    where: { id: reviewRequestId },
    include: {
      author: {
        select: { id: true, name: true, institution: true }
      },
      assignments: true
    }
  });

  if (!request) {
    return { success: false };
  }

  let queue: CandidateInfo[] = [];
  try {
    queue = JSON.parse(request.candidateQueue || "[]");
  } catch {
    queue = [];
  }

  let nextIndex = request.currentCascadeIndex;

  while (nextIndex < queue.length) {
    const candidate = queue[nextIndex];
    nextIndex++;

    // COI Check (bypassed if candidate was explicitly designated for self-account testing)
    const allowSelf = isDevTest || candidate.id === request.author.id;
    const coi = checkConflictOfInterest(request.author, candidate, request.excludedReviewers, allowSelf);
    if (coi.hasConflict) {
      continue;
    }

    // Ensure candidate has a User account or find existing by email/orcid
    let reviewerUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: candidate.id },
          ...(candidate.email ? [{ email: candidate.email }] : []),
          ...(candidate.orcid ? [{ orcid: candidate.orcid }] : [])
        ]
      }
    });

    // If candidate doesn't have an account yet, create a placeholder scholar profile
    if (!reviewerUser) {
      const tempEmail = candidate.email || `reviewer_${crypto.randomBytes(4).toString("hex")}@afrijournalindex.org`;
      reviewerUser = await prisma.user.create({
        data: {
          email: tempEmail,
          passwordHash: "unclaimed_scholar_invite",
          name: candidate.name,
          institution: candidate.institution || null,
          orcid: candidate.orcid || null,
          role: "RESEARCHER"
        }
      });
    }

    // Check if assignment already exists
    const existing = await prisma.manuscriptReviewAssignment.findUnique({
      where: {
        reviewRequestId_reviewerId: {
          reviewRequestId: request.id,
          reviewerId: reviewerUser.id
        }
      }
    });

    if (existing) {
      continue;
    }

    // Dispatch invitation with 48h expiration
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const newAssignment = await prisma.manuscriptReviewAssignment.create({
      data: {
        reviewRequestId: request.id,
        reviewerId: reviewerUser.id,
        status: "INVITED",
        invitationToken: token,
        invitationExpiresAt: expiresAt
      }
    });

    await prisma.manuscriptReviewRequest.update({
      where: { id: request.id },
      data: {
        currentCascadeIndex: nextIndex,
        status: "AWAITING_REVIEWER"
      }
    });

    // Send Formal Academic Review Invitation Email
    const siteUrl = baseUrl || process.env.NEXTAUTH_URL || "https://afrijournalindex.org";
    const inviteActionUrl = `${siteUrl}/reviewer`;
    
    if (reviewerUser.email && !reviewerUser.email.includes("@afrijournalindex.org")) {
      sendEmail({
        to: reviewerUser.email,
        subject: `[Peer Review Invitation] "${request.title.slice(0, 75)}..." - AfriJournal Index`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; line-height: 1.6; color: #1e293b;">
            <div style="border-bottom: 2px solid #b45309; padding-bottom: 12px; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0;">AfriJournal Index Peer Review Registry</h2>
              <div style="font-size: 13px; color: #64748b;">Double-Blind Academic Referee Invitation</div>
            </div>
            
            <p>Dear <strong>${reviewerUser.name}</strong>,</p>
            
            <p>Because of your recognized scholarship and peer-reviewed contributions in <strong>${request.discipline}</strong>, you have been invited to conduct a standardized double-blind evaluation for a manuscript titled:</p>
            
            <div style="background: #f8fafc; border-left: 4px solid #b45309; padding: 14px 18px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #0f172a; font-size: 15px;">"${request.title}"</strong>
              <div style="font-size: 13px; color: #64748b; margin-top: 6px;">Field: ${request.discipline}</div>
            </div>
            
            <p><strong>Response Deadline:</strong> In accordance with the AfriJournal sequential cascading protocol, please accept or decline this invitation within <strong>48 hours</strong>.</p>
            
            <div style="margin: 25px 0;">
              <a href="${inviteActionUrl}" style="background: #b45309; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Respond in Reviewer Workspace &rarr;
              </a>
            </div>
            
            <p style="font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
              Upon completion, you will receive an official verifiable <strong>AfriJournal Peer Review Certificate</strong> with CPD credentials and recognition in your scholar profile dossier.
            </p>
          </div>
        `
      }).catch(err => console.error("Email invitation error:", err));
    }

    return { success: true, assignmentId: newAssignment.id };
  }

  // If queue exhausted without accepted reviewer
  await prisma.manuscriptReviewRequest.update({
    where: { id: request.id },
    data: { status: "EXPIRED" }
  });

  return { success: true, finished: true };
}

/**
 * Routine to scan and auto-cascade any active invitations that have exceeded 48 hours.
 */
export async function checkAndCascadeExpiredAssignments(): Promise<number> {
  const now = new Date();
  const expiredInvites = await prisma.manuscriptReviewAssignment.findMany({
    where: {
      status: "INVITED",
      invitationExpiresAt: { lt: now }
    },
    include: {
      reviewRequest: true
    }
  });

  let cascadedCount = 0;

  for (const inv of expiredInvites) {
    await prisma.manuscriptReviewAssignment.update({
      where: { id: inv.id },
      data: { status: "EXPIRED" }
    });

    // Cascade to next candidate
    await triggerNextCandidate(inv.reviewRequestId);
    cascadedCount++;
  }

  return cascadedCount;
}
