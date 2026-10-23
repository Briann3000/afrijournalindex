import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/posts/[id] - Get a single post with comments and author
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    let currentUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("afriJournalSession");
      if (sessionCookie?.value) {
        currentUserId = verifySessionToken(sessionCookie.value);
      }
    } catch {
      // Guest
    }

    const post = await (prisma as any).post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            institution: true,
            totalCitations: true,
            hIndex: true,
            institutionRelation: {
              select: { country: true }
            }
          }
        },
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true }
        } : false,
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                institution: true
              }
            }
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        postType: post.postType,
        title: post.title,
        content: post.content,
        attachmentUrl: post.attachmentUrl,
        attachmentName: post.attachmentName,
        attachmentType: post.attachmentType || "DOCUMENT",
        tags: post.tags ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        hasLiked: Boolean(post.likes && post.likes.length > 0),
        createdAt: post.createdAt,
        author: {
          id: post.author.id,
          name: post.author.name,
          role: post.author.role,
          institution: post.author.institution,
          country: post.author.institutionRelation?.country || null,
          totalCitations: post.author.totalCitations,
          hIndex: post.author.hIndex
        },
        comments: (post.comments || []).map((c: any) => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: c.author
        }))
      }
    });
  } catch (error: any) {
    console.error("GET /api/posts/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - Delete a post (only author or admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const post = await (prisma as any).post.findUnique({
      where: { id },
      select: { id: true, authorId: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Must be post author or platform admin
    if (post.authorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. You can only delete your own posts." }, { status: 403 });
    }

    await (prisma as any).post.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error: any) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
