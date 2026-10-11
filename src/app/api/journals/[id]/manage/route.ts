import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../lib/db";
import { verifySessionToken } from "../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Journal ID is required." }, { status: 400 });
    }

    // 1. Verify User Session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Authentication required to manage journal." }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid or expired session token." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User record not found." }, { status: 401 });
    }

    // 2. Fetch Journal
    const journal = await prisma.journal.findUnique({
      where: { id }
    });

    if (!journal) {
      return NextResponse.json({ success: false, error: "Journal not found." }, { status: 404 });
    }

    // 3. Ownership / Entitlement Verification
    const isOwner = journal.publisherId === user.id;
    const isAdmin = user.role === "ADMIN";

    // If journal has no registered publisher yet and user is a PUBLISHER with a paid/claim request:
    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized: You do not possess publisher ownership rights for this journal. If this is your publication, order an Institutional Evaluation Package or contact editorial desk."
      }, { status: 403 });
    }

    // 4. Update allowed fields
    const body = await request.json();
    const { description, frequency, websiteUrl, publisherName, country } = body;

    const updateData: any = {};
    if (typeof description === "string") updateData.description = description.trim();
    if (typeof frequency === "string") updateData.frequency = frequency.trim();
    if (typeof websiteUrl === "string") updateData.websiteUrl = websiteUrl.trim();
    if (typeof publisherName === "string") updateData.publisherName = publisherName.trim();
    if (typeof country === "string") updateData.country = country.trim();

    const updatedJournal = await prisma.journal.update({
      where: { id: journal.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: "Journal profile metadata updated successfully.",
      journal: {
        id: updatedJournal.id,
        name: updatedJournal.name,
        description: updatedJournal.description,
        frequency: updatedJournal.frequency,
        websiteUrl: updatedJournal.websiteUrl,
        publisherName: updatedJournal.publisherName,
        country: updatedJournal.country
      }
    });

  } catch (error: any) {
    console.error("Journal management error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update journal profile." }, { status: 500 });
  }
}
