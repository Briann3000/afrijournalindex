import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET() {
  try {
    const journals = await prisma.journal.findMany({
      select: { id: true, name: true, issn: true }
    });
    return NextResponse.json({ success: true, journals });
  } catch (error: any) {
    console.error("List journals error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
