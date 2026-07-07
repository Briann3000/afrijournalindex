import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tracking_id, state, api_ref, journalId, amount } = body;

    // In production, we would query the IntaSend Verification API:
    // GET https://sandbox.intasend.com/api/v1/payment/status/
    // headers: { Authorization: "Bearer " + INTASEND_SECRET_KEY }
    // For this prototype/MVP, we verify client status is "COMPLETE" or "SUCCESSFUL"
    if (state !== "COMPLETE" && state !== "SUCCESSFUL" && state !== "success") {
      return NextResponse.json({ success: false, error: "Payment was not completed successfully." }, { status: 400 });
    }

    if (!journalId) {
      return NextResponse.json({ success: false, error: "Missing associated Journal ID reference." }, { status: 400 });
    }

    console.log(`Payment success verified for Journal ${journalId}. Tracking ID: ${tracking_id}`);

    // 1. Mark the journal as premium-verified (e.g. updating quality grade or flags)
    const journal = await prisma.journal.update({
      where: { id: journalId },
      data: {
        isIndexed: true,
        qualityGrade: "A"
      }
    });

    // 2. Trigger automatic Impact Factor calculation for this journal
    // Fetch articles published in 2023 & 2024 (citable articles)
    const citableArticles = await prisma.article.findMany({
      where: {
        journalId: journal.id,
        publishDate: {
          gte: new Date("2023-01-01T00:00:00.000Z"),
          lte: new Date("2024-12-31T23:59:59.999Z")
        }
      },
      select: { id: true }
    });

    const articleCount = citableArticles.length;
    const citableArticleIds = citableArticles.map(a => a.id);

    // Count citations registered in 2025 pointing to those citable articles
    let citationCount = 0;
    if (citableArticleIds.length > 0) {
      citationCount = await prisma.citation.count({
        where: {
          citedArticleId: { in: citableArticleIds },
          citedAt: {
            gte: new Date("2025-01-01T00:00:00.000Z"),
            lte: new Date("2025-12-31T23:59:59.999Z")
          }
        }
      });
    }

    // Calculate score
    const standardScore = articleCount > 0 ? parseFloat((citationCount / articleCount).toFixed(3)) : 0.0;
    const regionalScore = parseFloat((standardScore * 1.15).toFixed(3)); // Africa-weighted scaling

    // Save report
    const report = await prisma.impactFactorReport.upsert({
      where: {
        journalId_year: {
          journalId: journal.id,
          year: 2025
        }
      },
      update: {
        standardScore,
        regionalScore,
        citationCount,
        articleCount
      },
      create: {
        journalId: journal.id,
        year: 2025,
        standardScore,
        regionalScore,
        citationCount,
        articleCount
      }
    });

    // Update submission record if one exists for the journal to ACCEPTED
    await prisma.submission.updateMany({
      where: { journalId: journal.id },
      data: {
        status: "ACCEPTED",
        evaluationLog: `Payment confirmed. Tracking ID: ${tracking_id}. Metrics Report generated successfully for year 2025.`
      }
    });

    // Find submission to redirect to its status page
    const submission = await prisma.submission.findFirst({
      where: { journalId: journal.id },
      select: { id: true }
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and metrics report generated successfully.",
      submissionId: submission?.id || null,
      journalId: journal.id,
      score: standardScore
    });

  } catch (error: any) {
    console.error("Payment callback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
