import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/posts/[id]/comments - Fetch all comments for a post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const comments = await (prisma as any).postComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            institution: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      comments: comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.author
      }))
    });
  } catch (error: any) {
    console.error("Fetch post comments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load comments." },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments - Add a scholarly discussion reply to a post
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Please sign in to join the discussion." },
        { status: 401 }
      );
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Comment text cannot be empty." },
        { status: 400 }
      );
    }

    const [comment] = await (prisma as any).$transaction([
      (prisma as any).postComment.create({
        data: {
          postId,
          authorId: userId,
          content
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              institution: true
            }
          }
        }
      }),
      (prisma as any).post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } }
      })
    ]);

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create post comment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to post comment." },
      { status: 500 }
    );
  }
}
