import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

// POST /api/posts/[id]/like - Toggle like on a scholarly post
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
        { success: false, error: "Please sign in to like or recommend this post." },
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

    // Check if post exists
    const post = await (prisma as any).post.findUnique({
      where: { id: postId },
      select: { id: true, likesCount: true }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found." },
        { status: 404 }
      );
    }

    // Check existing like
    const existingLike = await (prisma as any).postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    let liked = false;
    let newLikesCount = post.likesCount;

    if (existingLike) {
      // Unlike
      await (prisma as any).$transaction([
        (prisma as any).postLike.delete({
          where: { id: existingLike.id }
        }),
        (prisma as any).post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } }
        })
      ]);
      newLikesCount = Math.max(0, post.likesCount - 1);
      liked = false;
    } else {
      // Like
      await (prisma as any).$transaction([
        (prisma as any).postLike.create({
          data: {
            postId,
            userId
          }
        }),
        (prisma as any).post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } }
        })
      ]);
      newLikesCount = post.likesCount + 1;
      liked = true;
    }

    return NextResponse.json({
      success: true,
      liked,
      likesCount: newLikesCount
    });
  } catch (error: any) {
    console.error("Toggle post like error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update like status." },
      { status: 500 }
    );
  }
}
