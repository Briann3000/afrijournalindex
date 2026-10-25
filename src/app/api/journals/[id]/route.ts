import { NextResponse } from "next/server";
import { getJournalDetail } from "../../../../lib/journal-detail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Journal ID is required." },
        { status: 400 }
      );
    }

    const journal = await getJournalDetail(id);

    if (!journal) {
      return NextResponse.json(
        { success: false, error: "Journal not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      journal
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error: any) {
    console.error("Fetch journal detail error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch journal." },
      { status: 500 }
    );
  }
}
