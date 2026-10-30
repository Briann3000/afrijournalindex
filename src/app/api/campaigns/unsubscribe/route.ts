import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const candidate = await prisma.journalCandidate.findFirst({
      where: { inviteToken: token }
    });

    if (candidate) {
      await prisma.journalCandidate.update({
        where: { id: candidate.id },
        data: { invitationStatus: "UNSUBSCRIBED" }
      });
    }

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head><title>Unsubscribed - AfriJournal Index</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; color: #334155;">
          <h2>Unsubscribed Successfully</h2>
          <p>Your email has been removed from future editorial invitations from the AfriJournal Index.</p>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
