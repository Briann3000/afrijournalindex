import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifySessionToken } from "../../../lib/auth";

// Helper to authenticate and verify ADMIN role
async function getAdminUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("afriJournalSession");
  const token = sessionCookie?.value;

  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true }
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const searchJournal = searchParams.get("searchJournal") || "";

    // 1. Safe overview counts (isolated so one never cancels others)
    const totalJournals = await prisma.journal.count().catch(() => 0);
    const indexedJournals = await prisma.journal.count({ where: { isIndexed: true } }).catch(() => 0);
    const paidCertificates = await prisma.journal.count({ where: { certificatePaid: true } }).catch(() => 0);
    const totalSubmissions = await prisma.submission.count().catch(() => 0);
    const pendingSubmissions = await prisma.submission.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }).catch(() => 0);
    const totalClaims = await prisma.claimedPublication.count().catch(() => 0);
    const pendingClaims = await prisma.claimedPublication.count({ where: { status: "PENDING_EDITORIAL_AUDIT" } }).catch(() => 0);
    const totalUsers = await prisma.user.count().catch(() => 0);

    // 2. Submissions list
    let submissions: any[] = [];
    try {
      submissions = await prisma.submission.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          submitter: {
            select: { id: true, name: true, email: true, institution: true }
          },
          journal: {
            select: { id: true, name: true, isIndexed: true, certificatePaid: true }
          }
        }
      });
    } catch (err: any) {
      console.error("Admin submissions error:", err);
    }

    // 3. Pending & recent publication claims
    let claims: any[] = [];
    try {
      claims = await prisma.claimedPublication.findMany({
        take: 100,
        orderBy: { claimedAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, institution: true, orcid: true }
          },
          article: {
            select: {
              id: true,
              title: true,
              doi: true,
              publishDate: true,
              journal: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });
    } catch (err: any) {
      console.error("Admin claims error:", err);
    }

    // 4. Journals list with live search support
    let journals: any[] = [];
    const journalWhere: any = {};
    if (searchJournal.trim()) {
      journalWhere.OR = [
        { name: { contains: searchJournal.trim() } },
        { issn: { contains: searchJournal.trim() } },
        { eissn: { contains: searchJournal.trim() } },
        { country: { contains: searchJournal.trim() } },
        { publisherName: { contains: searchJournal.trim() } }
      ];
    }

    try {
      journals = await prisma.journal.findMany({
        where: journalWhere,
        take: 300,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          issn: true,
          eissn: true,
          country: true,
          publisherName: true,
          isIndexed: true,
          certificatePaid: true,
          qualityGrade: true,
          activeTier: true,
          publisherId: true,
          websiteUrl: true,
          publisher: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    } catch (err: any) {
      console.error("Admin journals error:", err);
    }

    return NextResponse.json({
      success: true,
      admin: adminUser,
      stats: {
        totalJournals,
        indexedJournals,
        paidCertificates,
        totalSubmissions,
        pendingSubmissions,
        totalClaims,
        pendingClaims,
        totalUsers
      },
      submissions,
      claims,
      journals
    });
  } catch (error: any) {
    console.error("Admin overview error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch admin overview data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // -------------------------------------------------------------
    // Action 1: Update Submission Status
    // -------------------------------------------------------------
    if (action === "updateSubmission") {
      const { submissionId, status, reviewNotes, qualityGrade } = body;
      if (!submissionId || !status) {
        return NextResponse.json({ success: false, error: "submissionId and status are required." }, { status: 400 });
      }

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { journal: true }
      });

      if (!submission) {
        return NextResponse.json({ success: false, error: "Submission not found." }, { status: 404 });
      }

      const updated = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status,
          evaluationLog: reviewNotes
            ? `${submission.evaluationLog || ""}\n[Editorial Note]: ${reviewNotes}`
            : submission.evaluationLog
        }
      });

      // If accepted, index the journal if linked, or create one if missing
      if (status === "ACCEPTED") {
        if (submission.journalId) {
          await prisma.journal.update({
            where: { id: submission.journalId },
            data: {
              isIndexed: true,
              indexedAt: new Date(),
              qualityGrade: qualityGrade || submission.journal?.qualityGrade || "A"
            }
          });
        } else {
          // Create or link journal
          const newJournal = await prisma.journal.create({
            data: {
              name: submission.journalName,
              issn: submission.issn,
              eissn: submission.eissn,
              publisherName: submission.publisherName || "Pan-African Press",
              country: submission.country || "Pan-African",
              websiteUrl: submission.websiteUrl || "",
              description: submission.description || "African peer-reviewed journal.",
              frequency: submission.frequency || "Quarterly",
              isIndexed: true,
              indexedAt: new Date(),
              qualityGrade: qualityGrade || "A",
              publisherId: submission.submitterId
            }
          });

          await prisma.submission.update({
            where: { id: submissionId },
            data: { journalId: newJournal.id }
          });
        }
      } else if (status === "REJECTED" && submission.journalId) {
        // Delist if rejected
        await prisma.journal.update({
          where: { id: submission.journalId },
          data: { isIndexed: false }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Submission status updated to ${status}.`,
        submission: updated
      });
    }

    // -------------------------------------------------------------
    // Action 2: Update Publication Claim
    // -------------------------------------------------------------
    if (action === "updateClaim") {
      const { claimId, status } = body;
      if (!claimId || !status) {
        return NextResponse.json({ success: false, error: "claimId and status are required." }, { status: 400 });
      }

      const updated = await prisma.claimedPublication.update({
        where: { id: claimId },
        data: { status }
      });

      return NextResponse.json({
        success: true,
        message: `Publication claim marked as ${status}.`,
        claim: updated
      });
    }

    // -------------------------------------------------------------
    // Action 3: Quick Journal Updates (Indexed, Certificate, Grade, Publisher)
    // -------------------------------------------------------------
    if (action === "updateJournal") {
      const { journalId, isIndexed, certificatePaid, qualityGrade, activeTier, publisherId } = body;
      if (!journalId) {
        return NextResponse.json({ success: false, error: "journalId is required." }, { status: 400 });
      }

      const dataToUpdate: any = {};
      if (typeof isIndexed === "boolean") {
        dataToUpdate.isIndexed = isIndexed;
        if (isIndexed) dataToUpdate.indexedAt = new Date();
      }
      if (typeof certificatePaid === "boolean") {
        dataToUpdate.certificatePaid = certificatePaid;
      }
      if (qualityGrade !== undefined) {
        dataToUpdate.qualityGrade = qualityGrade;
      }
      if (activeTier !== undefined) {
        dataToUpdate.activeTier = activeTier;
      }
      if (publisherId !== undefined) {
        dataToUpdate.publisherId = publisherId || null;
      }

      const updated = await prisma.journal.update({
        where: { id: journalId },
        data: dataToUpdate
      });

      return NextResponse.json({
        success: true,
        message: `Journal "${updated.name}" updated successfully.`,
        journal: updated
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Admin POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute admin action." },
      { status: 500 }
    );
  }
}
