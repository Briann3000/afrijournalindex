import { NextResponse } from "next/server";
import { checkAndCascadeExpiredAssignments } from "../../../../lib/review-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET || "afrijournal-cron-internal-key-2026";

    const isAuthorized =
      key === expectedSecret ||
      authHeader === `Bearer ${expectedSecret}`;

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized cron access." }, { status: 401 });
    }

    const cascadedCount = await checkAndCascadeExpiredAssignments();

    return NextResponse.json({
      success: true,
      message: `Cascade cycle completed. Advanced ${cascadedCount} expired reviewer assignments.`,
      cascadedCount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Cron cascade error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to run cascade cron." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
