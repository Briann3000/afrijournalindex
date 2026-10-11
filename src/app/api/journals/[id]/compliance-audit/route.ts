import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { evaluateJournalCompliance } from "../../../../../lib/compliance-rules";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Journal ID is required." }, { status: 400 });
    }

    const journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { id },
          { issn: id },
          { eissn: id }
        ]
      },
      include: {
        articles: {
          take: 100,
          select: {
            id: true,
            doi: true,
            publishDate: true,
            abstract: true,
            pdfUrl: true
          }
        },
        reports: {
          orderBy: { year: "desc" },
          take: 1
        }
      }
    });

    if (!journal) {
      return NextResponse.json({ success: false, error: "Journal not found in registry." }, { status: 404 });
    }

    const audit = evaluateJournalCompliance(journal as any);

    return NextResponse.json({
      success: true,
      journalId: journal.id,
      journalName: journal.name,
      overallScore: audit.overallScore,
      status: audit.status,
      doiCoverageRate: audit.doiCoverageRate,
      doajPassedCount: audit.doajPassedCount,
      doajTotalCount: audit.doajTotalCount,
      scopusPassedCount: audit.scopusPassedCount,
      scopusTotalCount: audit.scopusTotalCount,
      doajChecks: audit.doajChecks,
      scopusChecks: audit.scopusChecks,
      checks: audit.allChecks,
      activeTier: journal.activeTier || (journal.certificatePaid ? "BASIC" : "FREE"),
      isPaid: journal.certificatePaid
    });

  } catch (error: any) {
    console.error("Compliance audit error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to generate compliance audit." }, { status: 500 });
  }
}

