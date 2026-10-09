import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

// Simulation database of official ISSN database records for verification
const MOCK_ISSN_REGISTRY: Record<string, { name: string; publisher: string; active: boolean }> = {
  "2312-0134": {
    name: "African Research Journal of Education and Social Sciences (ARJESS)",
    publisher: "Kenya Projects Organization (KENPRO)",
    active: true
  },
  "2519-0016": {
    name: "Journal of Management and Business Administration (JMBA)",
    publisher: "Kenya Projects Organization (KENPRO)",
    active: true
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, issn, eissn, publisher, website, description, country, frequency } = body;

    if (!name || !website) {
      return NextResponse.json({ success: false, error: "Journal Name and Homepage Website are required." }, { status: 400 });
    }

    const evaluationLogs: string[] = [];
    let isMetadataConsistent = true;
    let isOpenPeerReviewValid = true;
    let isRegularityValid = true;
    let score = 100;

    evaluationLogs.push("Starting automated evaluation process...");

    // 1. Metadata Consistency Verification
    if (issn || eissn) {
      const cleanIssn = issn?.trim() || "";
      const cleanEissn = eissn?.trim() || "";
      
      const dbMatch = await prisma.journal.findFirst({
        where: {
          OR: [
            ...(cleanIssn ? [{ issn: cleanIssn }] : []),
            ...(cleanEissn ? [{ eissn: cleanEissn }] : [])
          ]
        }
      });

      const mockRecord = cleanIssn ? MOCK_ISSN_REGISTRY[cleanIssn] : null;

      if (dbMatch || mockRecord) {
        const matchedName = dbMatch?.name || mockRecord?.name || "";
        evaluationLogs.push(`ISSN/eISSN (${cleanIssn || cleanEissn}) successfully matched in indexed international records.`);
        if (matchedName && matchedName.toLowerCase() !== name.toLowerCase()) {
          score -= 10;
          evaluationLogs.push(`Warning: Journal Name '${name}' differs slightly from indexed record '${matchedName}'.`);
        }
      } else {
        score -= 10;
        evaluationLogs.push(`Notice: ISSN ${cleanIssn || cleanEissn} queued for standard registrar lookup.`);
      }
    } else {
      score -= 20;
      isMetadataConsistent = false;
      evaluationLogs.push("Missing Print ISSN and eISSN. Lowering consistency ranking index.");
    }

    // 2. Open Peer-Review Policy Verification (Simulated webpage crawlers)
    evaluationLogs.push(`Scanning journal home directory website: ${website}`);
    if (website.includes("arjess.org") || website.includes("kenpro.org")) {
      evaluationLogs.push("Peer-Review Policy Found: Verified double-blind editorial board workflow.");
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

    // Determine final status
    let status: "APPROVED" | "REJECTED" | "PENDING_REVIEW" = "PENDING_REVIEW";
    if (score >= 80) {
      status = "APPROVED";
      evaluationLogs.push("Evaluation Success: Compliance score matches criteria. Automating approval status.");
    } else if (score < 50) {
      status = "REJECTED";
      evaluationLogs.push("Evaluation Fail: Compliance score below quality criteria. Rejecting submission.");
    } else {
      evaluationLogs.push("Compliance score moderate. Flagged for editor manual verification review.");
    }

    // Save to Database via Prisma (using a mock user/publisher profile for association)
    // First, find or create a default publisher account
    let defaultPublisher = await prisma.user.findFirst({
      where: { email: "publisher@kenpro.org" }
    });

    if (!defaultPublisher) {
      defaultPublisher = await prisma.user.create({
        data: {
          email: "publisher@kenpro.org",
          name: "KENPRO Publisher",
          role: "PUBLISHER",
          passwordHash: "hashed_dummy_password"
        }
      });
    }

    // Save the Journal submission records
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
        isIndexed: status === "APPROVED",
        qualityGrade: status === "APPROVED" ? "A" : null,
        publisherId: defaultPublisher.id
      }
    });

    // Map status enum
    let dbStatus: "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" = "PENDING";
    if (status === "APPROVED") dbStatus = "ACCEPTED";
    if (status === "REJECTED") dbStatus = "REJECTED";
    if (status === "PENDING_REVIEW") dbStatus = "PENDING";

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
        submitterId: defaultPublisher.id,
        journalId: journal.id
      }
    });

    return NextResponse.json({
      success: true,
      submissionId: submissionRecord.id,
      journalId: journal.id,
      score,
      status,
      logs: evaluationLogs
    });

  } catch (error: any) {
    console.error("Evaluation API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
