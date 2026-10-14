import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";
import { verifySessionToken } from "../../../../lib/auth";

// GET: Search unclaimed journals or check claim status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const journalId = searchParams.get("journalId")?.trim();

    // Check claim status for a specific journal
    if (journalId) {
      const journal = await prisma.journal.findUnique({
        where: { id: journalId },
        select: {
          id: true,
          name: true,
          publisherId: true,
          publisherName: true,
          publisher: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!journal) {
        return NextResponse.json({ success: false, error: "Journal not found." }, { status: 404 });
      }

      // Check user session
      let currentUserId: string | null = null;
      try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("afriJournalSession");
        if (sessionCookie?.value) {
          currentUserId = verifySessionToken(sessionCookie.value);
        }
      } catch {
        // Not logged in
      }

      return NextResponse.json({
        success: true,
        journalId: journal.id,
        isClaimed: Boolean(journal.publisherId),
        isOwner: Boolean(currentUserId && journal.publisherId === currentUserId),
        publisherName: journal.publisherName
      });
    }

    // Search unclaimed journals for the publisher dashboard
    if (search && search.length >= 2) {
      const unclaimedJournals = await prisma.journal.findMany({
        where: {
          publisherId: null,
          OR: [
            { name: { contains: search } },
            { issn: { contains: search } },
            { eissn: { contains: search } },
            { publisherName: { contains: search } }
          ]
        },
        take: 12,
        select: {
          id: true,
          name: true,
          issn: true,
          eissn: true,
          publisherName: true,
          country: true,
          websiteUrl: true,
          qualityGrade: true,
          isIndexed: true
        }
      });

      return NextResponse.json({
        success: true,
        journals: unclaimedJournals
      });
    }

    return NextResponse.json({ success: true, journals: [] });

  } catch (error: any) {
    console.error("Journal claim query error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to search unclaimed journals." }, { status: 500 });
  }
}

// POST: Claim an unassigned journal
export async function POST(request: Request) {
  try {
    // 1. Authenticate user session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please log in to claim editorial ownership of this journal." },
        { status: 401 }
      );
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    // 2. Parse request payload
    const body = await request.json();
    const { journalId, roleTitle, editorialEmail } = body;

    if (!journalId) {
      return NextResponse.json(
        { success: false, error: "Journal ID is required." },
        { status: 400 }
      );
    }

    // 3. Find the journal
    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
      include: {
        publisher: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!journal) {
      return NextResponse.json(
        { success: false, error: "Journal record not found in the index." },
        { status: 404 }
      );
    }

    // 4. Check if journal is already claimed by someone else
    if (journal.publisherId && journal.publisherId !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: `This journal is already managed by a verified publisher account (${journal.publisher?.name || "Verified Editorial Team"}). If you are the legitimate owner, please contact editorial disputes support.` 
        },
        { status: 400 }
      );
    }

    // If already owned by current user
    if (journal.publisherId === user.id) {
      return NextResponse.json({
        success: true,
        alreadyOwned: true,
        message: `You already manage "${journal.name}" in your dashboard.`,
        journal: {
          id: journal.id,
          name: journal.name
        }
      });
    }

    // 5. Transfer/Assign ownership to current user
    await prisma.journal.update({
      where: { id: journal.id },
      data: {
        publisherId: user.id
      }
    });

    // Upgrade user role to PUBLISHER if currently RESEARCHER
    if (user.role === "RESEARCHER") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "PUBLISHER"
        }
      });
    }

    // Link any submissions matching this journal to this user as well
    await prisma.submission.updateMany({
      where: {
        journalId: journal.id,
        submitterId: { not: user.id }
      },
      data: {
        submitterId: user.id
      }
    });

    console.log(`Journal "${journal.name}" (${journal.id}) successfully claimed by user ${user.name} (${user.email}, ${roleTitle || "Editor"}).`);

    return NextResponse.json({
      success: true,
      message: `Congratulations! "${journal.name}" has been successfully linked to your publisher dashboard.`,
      journal: {
        id: journal.id,
        name: journal.name,
        publisherId: user.id
      }
    });

  } catch (error: any) {
    console.error("Claim journal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to claim journal." },
      { status: 500 }
    );
  }
}

// DELETE: Unlink/disassociate journal from publisher account
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { journalId } = body;

    if (!journalId) {
      return NextResponse.json(
        { success: false, error: "Journal ID is required." },
        { status: 400 }
      );
    }

    const journal = await prisma.journal.findUnique({
      where: { id: journalId }
    });

    if (!journal) {
      return NextResponse.json(
        { success: false, error: "Journal not found." },
        { status: 404 }
      );
    }

    // Must be the owner or an ADMIN
    if (journal.publisherId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "You do not have permission to unlink this journal." },
        { status: 403 }
      );
    }

    await prisma.journal.update({
      where: { id: journalId },
      data: {
        publisherId: null
      }
    });

    return NextResponse.json({
      success: true,
      message: `Journal "${journal.name}" has been unlinked successfully.`
    });

  } catch (error: any) {
    console.error("Unlink journal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to unlink journal." },
      { status: 500 }
    );
  }
}

