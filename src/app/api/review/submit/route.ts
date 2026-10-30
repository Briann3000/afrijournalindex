import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";
import { generateTrackingCode, triggerNextCandidate, CandidateInfo } from "../../../../lib/review-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Please log in to submit a manuscript for review." }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid session. Please log in again." }, { status: 401 });
    }

    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, institution: true, orcid: true }
    });

    if (!author) {
      return NextResponse.json({ success: false, error: "User account not found." }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      abstract,
      discipline,
      targetJournal,
      manuscriptFileUrl,
      supplementaryUrl,
      excludedReviewers,
      selectedReviewers, // Array of CandidateInfo from Reviewer Finder or null
      testOnSameAccount  // Testing flag to test on the same account
    } = body;

    if (!title || !abstract || !discipline || !manuscriptFileUrl) {
      return NextResponse.json({ success: false, error: "Title, abstract, discipline, and manuscript file are required." }, { status: 400 });
    }

    let candidates: CandidateInfo[] = [];

    // If author requested same-account testing
    if (testOnSameAccount) {
      candidates.push({
        id: author.id,
        name: author.name,
        email: author.email,
        institution: author.institution || "Testing Scholar",
        orcid: author.orcid
      });
    }

    // If author supplied candidates from Reviewer Finder
    if (Array.isArray(selectedReviewers) && selectedReviewers.length > 0) {
      for (const r of selectedReviewers) {
        if (!candidates.some(c => c.id === r.id)) {
          candidates.push({
            id: r.id || "",
            name: r.name || "Academic Specialist",
            email: r.email,
            institution: r.institution,
            country: r.country,
            orcid: r.orcid || null
          });
        }
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ success: false, error: "Please select at least one reviewer candidate from the matchmaker results." }, { status: 400 });
    }

    const trackingCode = generateTrackingCode();

    const request = await prisma.manuscriptReviewRequest.create({
      data: {
        trackingCode,
        authorId: author.id,
        title: title.trim(),
        abstract: abstract.trim(),
        discipline: discipline.trim(),
        targetJournal: targetJournal?.trim() || null,
        manuscriptFileUrl: manuscriptFileUrl.trim(),
        supplementaryUrl: supplementaryUrl?.trim() || null,
        excludedReviewers: excludedReviewers?.trim() || null,
        candidateQueue: JSON.stringify(candidates),
        currentCascadeIndex: 0,
        status: "AWAITING_REVIEWER"
      }
    });

    // Extract request origin for email links
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Trigger invitation for Reviewer #1
    await triggerNextCandidate(request.id, origin, Boolean(testOnSameAccount));

    return NextResponse.json({
      success: true,
      message: "Manuscript successfully submitted for peer review.",
      trackingCode,
      requestId: request.id
    });

  } catch (error: any) {
    console.error("Submit manuscript review error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit manuscript." }, { status: 500 });
  }
}
