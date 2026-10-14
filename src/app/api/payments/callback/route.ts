import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";
import { getDisciplines, assignQuartiles } from "../../../../lib/metrics";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Handle IntaSend Webhook Challenge / Handshake test
    if (body.challenge) {
      return NextResponse.json({ challenge: body.challenge }, { status: 200 });
    }

    const tracking_id = body.tracking_id || body.invoice_id;
    const state = body.state || body.status;
    const api_ref = body.api_ref || body.account;
    
    // Extract journalId from explicit field or api_ref (e.g., "AJCI_journal-id-here", "AJIF_journal-id-here" or direct id)
    const journalId = body.journalId || (
      api_ref?.startsWith("AJCI_") ? api_ref.replace("AJCI_", "") :
      api_ref?.startsWith("AJIF_") ? api_ref.replace("AJIF_", "") :
      api_ref
    );

    if (!journalId) {
      if (body.event === "test" || !tracking_id) {
        return NextResponse.json({ success: true, message: "Webhook ping received" });
      }
      return NextResponse.json({ success: false, error: "Missing associated Journal ID or api_ref reference." }, { status: 400 });
    }

    // Verify Journal exists
    const existingJournal = await prisma.journal.findUnique({
      where: { id: journalId }
    });

    if (!existingJournal) {
      return NextResponse.json({ success: false, error: "Journal not found in registry." }, { status: 404 });
    }

    const secretKey = process.env.INTASEND_SECRET_KEY;
    let isPaymentVerified = false;

    // 2. Strict Server-to-Server IntaSend Verification
    if (secretKey && tracking_id) {
      try {
        const isTest = secretKey.includes("_sandbox_") || process.env.INTASEND_TEST_MODE === "true";
        const verifyUrl = isTest 
          ? `https://sandbox.intasend.com/api/v1/payment/status/`
          : `https://payment.intasend.com/api/v1/payment/status/`;

        const verifyResponse = await fetch(verifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secretKey}`
          },
          body: JSON.stringify({ tracking_id })
        });

        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          const invoiceState = (verifyData?.invoice?.state || verifyData?.state || "").toUpperCase();
          if (invoiceState === "COMPLETE" || invoiceState === "SUCCESSFUL" || invoiceState === "SUCCESS") {
            isPaymentVerified = true;
          }
        }
      } catch (verifyErr) {
        console.error("IntaSend API verification error:", verifyErr);
      }
    }

    // Fallback only permitted in local dev without live secret key
    if (!isPaymentVerified) {
      if (!secretKey && process.env.NODE_ENV !== "production") {
        const normalizedState = (state || "").toUpperCase();
        if (normalizedState === "COMPLETE" || normalizedState === "SUCCESSFUL" || normalizedState === "SUCCESS") {
          isPaymentVerified = true;
        }
      }
    }

    if (!isPaymentVerified) {
      return NextResponse.json({
        success: false,
        error: "IntaSend payment verification failed. Payment was not confirmed as completed by the gateway."
      }, { status: 400 });
    }

    // 3. Resolve user session if available
    let authenticatedUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("afriJournalSession");
      if (sessionCookie?.value) {
        authenticatedUserId = verifySessionToken(sessionCookie.value);
      }
    } catch {
      // Guest payment
    }
    if (!authenticatedUserId && body.userId) {
      authenticatedUserId = body.userId;
    }

    // 4. Resolve tier & pricing
    const rawTier = (body.tier || "").toUpperCase();
    const selectedTier = rawTier === "PREMIUM" ? "PREMIUM" : "BASIC";
    const amountPaid = Number(body.amount) || (selectedTier === "PREMIUM" ? 45000 : 12800);
    const currency = (body.currency || "KES").toUpperCase();

    // 5. Record transaction in Payment audit table
    await prisma.payment.upsert({
      where: { trackingId: tracking_id },
      create: {
        trackingId: tracking_id,
        journalId: existingJournal.id,
        userId: authenticatedUserId,
        amount: amountPaid,
        currency,
        tier: selectedTier,
        status: "COMPLETE",
        customerEmail: body.email || body.customerEmail || null,
        rawResponse: JSON.stringify(body)
      },
      update: {
        status: "COMPLETE",
        tier: selectedTier,
        userId: authenticatedUserId
      }
    });

    // 6. Update Journal entitlements
    // Maintain academic integrity: preserve existing quality grade or default to "B" for new entries; NEVER auto-promote to "A"
    const qualityGrade = existingJournal.qualityGrade || "B";

    const journalUpdateData: any = {
      isIndexed: true,
      certificatePaid: true,
      activeTier: selectedTier,
      qualityGrade,
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1-year accreditation cycle
    };

    // If Premium tier and user is authenticated, link publisher claim ownership
    if (selectedTier === "PREMIUM" && authenticatedUserId) {
      journalUpdateData.publisherId = authenticatedUserId;
    }

    const journal = await prisma.journal.update({
      where: { id: existingJournal.id },
      data: journalUpdateData
    });

    // 7. Calculate Citation Index (AJCI) & Quartiles
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

    const standardScore = articleCount > 0 ? parseFloat((citationCount / articleCount).toFixed(3)) : 0.0;
    const regionalScore = parseFloat((standardScore * 1.15).toFixed(3));

    const disciplines = getDisciplines(journal.name, journal.description || "");
    const primaryDiscipline = disciplines[0] || "Multidisciplinary";

    // Assign quartile in accordance with discipline percentile distribution
    const peerReports = await prisma.impactFactorReport.findMany({
      where: { year: 2025, primaryDiscipline },
      select: { journalId: true, standardScore: true }
    });
    const poolForRanking = [
      ...peerReports.filter(p => p.journalId !== journal.id).map(p => ({ journalId: p.journalId, score: p.standardScore })),
      { journalId: journal.id, score: standardScore }
    ];
    const rankedPool = assignQuartiles(poolForRanking);
    const selfRanked = rankedPool.find(p => p.journalId === journal.id);
    const quartile = selfRanked?.quartile || "Unrated";
    const disciplineRank = selfRanked?.rank || 1;
    const totalInDiscipline = selfRanked?.totalInGroup || poolForRanking.length;

    // Save report with precomputed ranking metadata
    await prisma.impactFactorReport.upsert({
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
        articleCount,
        quartile,
        disciplineRank,
        totalInDiscipline,
        primaryDiscipline
      },
      create: {
        journalId: journal.id,
        year: 2025,
        standardScore,
        regionalScore,
        citationCount,
        articleCount,
        quartile,
        disciplineRank,
        totalInDiscipline,
        primaryDiscipline
      }
    });

    // Update submission record if one exists
    await prisma.submission.updateMany({
      where: { journalId: journal.id },
      data: {
        status: "ACCEPTED",
        evaluationLog: `Payment confirmed (${selectedTier} Tier). Tracking ID: ${tracking_id}. Metrics Report generated for year 2025.`
      }
    });

    const submission = await prisma.submission.findFirst({
      where: { journalId: journal.id },
      select: { id: true }
    });

    return NextResponse.json({
      success: true,
      message: `Payment verified successfully for ${selectedTier} package.`,
      trackingId: tracking_id,
      tier: selectedTier,
      submissionId: submission?.id || null,
      journalId: journal.id,
      score: standardScore,
      quartile
    });

  } catch (error: any) {
    console.error("Payment callback error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

