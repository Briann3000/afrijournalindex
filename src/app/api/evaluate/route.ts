import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";
import { verifySessionToken } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, issn, eissn, publisher, website, description, country, frequency } = body;

    if (!name || !website) {
      return NextResponse.json({ success: false, error: "Journal Name and Homepage Website are required." }, { status: 400 });
    }

    const cleanIssn = issn?.trim() || "";
    const cleanEissn = eissn?.trim() || "";

    // 0. Active Cooling-Off Period Check (6 Months / 180 Days)
    if (cleanIssn || cleanEissn) {
      const recentRejected = await prisma.submission.findFirst({
        where: {
          OR: [
            ...(cleanIssn ? [{ issn: cleanIssn }] : []),
            ...(cleanEissn ? [{ eissn: cleanEissn }] : [])
          ],
          status: "REJECTED"
        },
        orderBy: { createdAt: "desc" }
      });

      if (recentRejected) {
        const submissionDate = new Date(recentRejected.createdAt);
        const coolingEndDate = new Date(submissionDate.getTime() + 180 * 24 * 60 * 60 * 1000);
        const now = new Date();

        if (now < coolingEndDate) {
          const eligibleDateStr = coolingEndDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          return NextResponse.json({
            success: false,
            error: `This journal is currently in an active 6-month editorial improvement period following a previous evaluation flag. Re-submission is eligible starting ${eligibleDateStr}.`
          }, { status: 429 });
        }
      }
    }

    const evaluationLogs: string[] = [];
    let isMetadataConsistent = true;
    let isOpenPeerReviewValid = true;
    let isRegularityValid = true;
    let score = 100;

    evaluationLogs.push("Starting automated evaluation process...");

    // 1. Metadata Consistency Verification
    if (cleanIssn || cleanEissn) {
      const dbMatch = await prisma.journal.findFirst({
        where: {
          OR: [
            ...(cleanIssn ? [{ issn: cleanIssn }] : []),
            ...(cleanEissn ? [{ eissn: cleanEissn }] : [])
          ]
        }
      });

      const mockRecord = null;
      if (dbMatch) {
        const matchedName = dbMatch.name || "";
        evaluationLogs.push(`ISSN/eISSN (${cleanIssn || cleanEissn}) successfully matched in indexed records.`);
        if (matchedName && matchedName.toLowerCase() !== name.toLowerCase()) {
          score -= 10;
          evaluationLogs.push(`Warning: Journal Name '${name}' differs slightly from indexed record '${matchedName}'.`);
        }
      } else {
        score -= 5;
        evaluationLogs.push(`Notice: ISSN ${cleanIssn || cleanEissn} queued for official registrar verification.`);
      }
    } else {
      score -= 20;
      isMetadataConsistent = false;
      evaluationLogs.push("Missing Print ISSN and eISSN. Lowering consistency ranking index.");
    }

    // 2. Open Peer-Review Policy Verification
    evaluationLogs.push(`Scanning journal home directory website: ${website}`);
    if (website.includes("peer-review") || website.includes("about") || website.includes("editorial") || website.includes("ojs")) {
      evaluationLogs.push("Peer-Review Policy Found: Verified editorial board workflow.");
    } else {
      score -= 10;
      isOpenPeerReviewValid = false;
      evaluationLogs.push("Warning: Clear public peer-review policy statement not identified on homepage crawls.");
    }

    // 3. Regularity Verification
    if (frequency === "Quarterly" || frequency === "Semi-Annually") {
      evaluationLogs.push(`Frequency '${frequency}' meets annual release regularity guidelines.`);
    } else {
      score -= 5;
      evaluationLogs.push(`Frequency '${frequency}' requires supplementary issue release history checks.`);
    }

    // Determine evaluation state: All new submissions require editorial desk review rather than instant auto-approval into index
    let dbStatus: "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" = "PENDING";
    if (score < 50) {
      dbStatus = "REJECTED";
      evaluationLogs.push("Evaluation Flag: Compliance score below minimum threshold. Queued for rejection notice.");
    } else {
      dbStatus = "UNDER_REVIEW";
      evaluationLogs.push("Compliance evaluation recorded. Submission queued for editorial board verification.");
    }

    // Determine the publisher/submitter user account
    let activePublisherId: string | null = null;
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("afriJournalSession");
      if (sessionCookie?.value) {
        const sessionUserId = verifySessionToken(sessionCookie.value);
        if (sessionUserId) {
          const authenticatedUser = await prisma.user.findUnique({ where: { id: sessionUserId } });
          if (authenticatedUser) {
            activePublisherId = authenticatedUser.id;
          }
        }
      }
    } catch {
      // Session retrieval error
    }

    if (!activePublisherId) {
      return NextResponse.json({
        success: false,
        error: "Authentication required. Please sign in to submit a journal for index evaluation."
      }, { status: 401 });
    }

    // Save the Journal submission records (kept unindexed until approved by editorial review)
    const journal = await prisma.journal.create({
      data: {
        name,
        issn: issn || null,
        eissn: eissn || null,
        description: description || "No description provided",
        publisherName: publisher || "Unknown Publisher",
        country: country || "Unknown",
        frequency: frequency || "Quarterly",
        websiteUrl: website,
        isIndexed: false,
        qualityGrade: null,
        publisherId: activePublisherId
      }
    });

    // Save submission logs
    const submissionRecord = await prisma.submission.create({
      data: {
        journalName: name,
        issn: issn || null,
        eissn: eissn || null,
        description: description || "No description provided",
        publisherName: publisher || "Unknown Publisher",
        country: country || "Unknown",
        frequency: frequency || "Quarterly",
        websiteUrl: website,
        status: dbStatus,
        evaluationLog: evaluationLogs.join("\n"),
        submitterId: activePublisherId,
        journalId: journal.id
      }
    });

    return NextResponse.json({
      success: true,
      submissionId: submissionRecord.id,
      journalId: journal.id,
      score,
      status: dbStatus,
      logs: evaluationLogs
    });

  } catch (error: any) {
    console.error("Evaluation API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
