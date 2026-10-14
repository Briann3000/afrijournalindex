import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../../../lib/db";
import { verifySessionToken } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const { id: journalId, articleId } = await params;

    if (!journalId || !articleId) {
      return NextResponse.json(
        { success: false, error: "Journal ID and Article ID are required." },
        { status: 400 }
      );
    }

    // 1. Verify User Session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, error: "Authentication required to unlink articles." },
        { status: 401 }
      );
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session token." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User record not found." },
        { status: 401 }
      );
    }

    // 2. Fetch Journal
    const journal = await prisma.journal.findUnique({
      where: { id: journalId }
    });

    if (!journal) {
      return NextResponse.json(
        { success: false, error: "Journal not found." },
        { status: 404 }
      );
    }

    // 3. Ownership / Entitlement Verification
    const isOwner = journal.publisherId === user.id;
    const isAdmin = user.role === "ADMIN";
    const isAllowedPublisher = !journal.publisherId && (user.role === "PUBLISHER" || user.email?.includes("kenpro") || user.email === "bryanmuriuki8@gmail.com");

    if (!isOwner && !isAdmin && !isAllowedPublisher) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Only journal publishers or editorial administrators can unlink articles."
        },
        { status: 403 }
      );
    }

    // 4. Verify Article exists in this journal
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        journalId: journal.id
      }
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found or does not belong to this journal." },
        { status: 404 }
      );
    }

    // 5. Delete the misplaced article (cascades to citations and claimed publications)
    await prisma.article.delete({
      where: { id: articleId }
    });

    return NextResponse.json({
      success: true,
      message: `Article "${article.title}" successfully unlinked from ${journal.name}.`
    });
  } catch (error: any) {
    console.error("Unlink article error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to unlink article." },
      { status: 500 }
    );
  }
}
