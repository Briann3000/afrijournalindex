import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/db";

// GET: Retrieve comments for a specific journal
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const journalId = searchParams.get("journalId");

    if (!journalId) {
      return NextResponse.json({ success: false, error: "Journal ID is required." }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { journalId },
      include: {
        author: {
          select: {
            name: true,
            role: true,
            institution: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.author
      }))
    });

  } catch (error: any) {
    console.error("Fetch comments error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add a new comment review
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "You must be logged in to post comments." }, { status: 401 });
    }

    const body = await request.json();
    const { journalId, content } = body;

    if (!journalId || !content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Journal ID and comment content are required." }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Session user not found." }, { status: 401 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        journalId,
        authorId: user.id
      },
      include: {
        author: {
          select: {
            name: true,
            role: true,
            institution: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.createdAt,
        author: newComment.author
      }
    });

  } catch (error: any) {
    console.error("Add comment error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
