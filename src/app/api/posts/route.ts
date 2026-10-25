import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/posts - List posts with dynamic trending tags and pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag")?.trim();
    const authorId = searchParams.get("authorId");
    const likedBy = searchParams.get("likedBy");
    const filter = searchParams.get("filter"); // "drafts" | "feed"
    const draftId = searchParams.get("draftId");
    const shareToken = searchParams.get("token");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    // Optional user session to check like status
    let currentUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("afriJournalSession");
      if (sessionCookie?.value) {
        currentUserId = verifySessionToken(sessionCookie.value);
      }
    } catch {
      // Guest visitor
    }

    const where: any = {};

    // 1. Single draft view with private reviewer token or author check
    if (draftId) {
      where.id = draftId;
      const targetDraft = await (prisma as any).post.findUnique({
        where: { id: draftId },
        include: {
          author: {
            select: { id: true, name: true, role: true, institution: true, totalCitations: true, hIndex: true }
          }
        }
      });

      if (!targetDraft) {
        return NextResponse.json({ success: false, error: "Draft manuscript not found." }, { status: 404 });
      }

      const isPrivateDraft = targetDraft.postType === "MANUSCRIPT_DRAFT" || targetDraft.postType === "PRIVATE";
      if (isPrivateDraft) {
        const isAuthor = currentUserId && targetDraft.authorId === currentUserId;
        const isValidToken = shareToken && targetDraft.attachmentUrl && targetDraft.attachmentUrl.includes(shareToken);
        if (!isAuthor && !isValidToken) {
          return NextResponse.json({
            success: false,
            error: "This manuscript draft is private. Only the author or designated reviewers with a valid review link can view it."
          }, { status: 403 });
        }
      }

      return NextResponse.json({
        success: true,
        post: targetDraft,
        isReviewerMode: Boolean(currentUserId !== targetDraft.authorId)
      });
    }

    // 2. Author's private drafts list
    if (filter === "drafts") {
      if (!currentUserId) {
        return NextResponse.json({ success: true, posts: [], total: 0, trendingTags: [] });
      }
      where.authorId = currentUserId;
      where.postType = { in: ["MANUSCRIPT_DRAFT", "PRIVATE"] };
    } else {
      // 3. Public community feed - strictly exclude private manuscript drafts to protect IP
      if (authorId) {
        where.authorId = authorId;
        if (authorId !== currentUserId) {
          where.postType = { notIn: ["MANUSCRIPT_DRAFT", "PRIVATE"] };
        }
      } else {
        where.postType = { notIn: ["MANUSCRIPT_DRAFT", "PRIVATE"] };
      }
    }

    if (tag) {
      where.tags = { contains: tag };
    }
    if (likedBy) {
      where.likes = { some: { userId: likedBy } };
    }

    const [total, postsRaw, allPostsWithTags] = await Promise.all([
      (prisma as any).post.count({ where }),
      (prisma as any).post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
            take: 25,
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
      }),
      // Query tags directly from database for dynamic trending topics
      (prisma as any).post.findMany({
        where: { tags: { not: null } },
        select: { tags: true },
        take: 100
      })
    ]);

    // Calculate dynamic trending tags directly from active posts in the database
    const tagCounts: Record<string, number> = {};
    allPostsWithTags.forEach((p: any) => {
      if (p.tags) {
        p.tags.split(/[,\s#]+/).map((t: string) => t.trim()).filter(Boolean).forEach((t: string) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
      }
    });

    const trendingTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));

    const formattedPosts = postsRaw.map((p: any) => ({
      id: p.id,
      postType: p.postType,
      title: p.title,
      content: p.content,
      attachmentUrl: p.attachmentUrl,
      attachmentName: p.attachmentName,
      attachmentType: p.attachmentType || "DOCUMENT",
      tags: p.tags ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      sharesCount: p.sharesCount,
      hasLiked: Boolean(p.likes && p.likes.length > 0),
      createdAt: p.createdAt,
      author: {
        id: p.author.id,
        name: p.author.name,
        role: p.author.role,
        institution: p.author.institution,
        country: p.author.institutionRelation?.country || null,
        totalCitations: p.author.totalCitations,
        hIndex: p.author.hIndex
      },
      recentComments: (p.comments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.author
      }))
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      trendingTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Fetch posts API error:", error);
    return NextResponse.json({ success: false, error: "Failed to load scholarly posts." }, { status: 500 });
  }
}

// POST /api/posts - Create a new unified scholarly post / draft
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Authentication required to publish a post." },
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
    const { action, draftId, title, content, attachmentUrl, attachmentName, attachmentType, tags, audience, isDraft } = body;

    // Action: Publish existing draft manuscript to public feed
    if (action === "publishDraft" && draftId) {
      const existing = await (prisma as any).post.findUnique({
        where: { id: draftId }
      });

      if (!existing || existing.authorId !== userId) {
        return NextResponse.json({ success: false, error: "Draft not found or unauthorized." }, { status: 403 });
      }

      const published = await (prisma as any).post.update({
        where: { id: draftId },
        data: {
          postType: "SCHOLARLY_POST",
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: "Manuscript successfully published to the public AfriJournal feed!",
        post: published
      });
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Post content or draft text is required." },
        { status: 400 }
      );
    }

    const cleanTitle = title ? title.trim() : null;
    const cleanContent = content.trim();
    const cleanTags = Array.isArray(tags) ? tags.join(", ") : (tags ? tags.trim() : null);

    // Identify if this is a private manuscript draft
    const isManuscriptDraft = Boolean(isDraft || audience === "PRIVATE" || body.postType === "MANUSCRIPT_DRAFT");
    const postType = isManuscriptDraft
      ? "MANUSCRIPT_DRAFT"
      : audience === "FOLLOWERS"
      ? "FOLLOWERS"
      : "SCHOLARLY_POST";

    // Normalize attachmentType
    let normAttachmentType = null;
    if (attachmentUrl) {
      const typeUpper = (attachmentType || "").toUpperCase();
      if (typeUpper.includes("IMAGE") || typeUpper.includes("PHOTO")) {
        normAttachmentType = "IMAGE";
      } else if (typeUpper.includes("AUDIO") || typeUpper.includes("SOUND") || typeUpper.includes("VOICE")) {
        normAttachmentType = "AUDIO";
      } else {
        normAttachmentType = "DOCUMENT";
      }
    }

    const post = await (prisma as any).post.create({
      data: {
        authorId: userId,
        postType,
        title: cleanTitle,
        content: cleanContent,
        attachmentUrl: attachmentUrl ? attachmentUrl.trim() : null,
        attachmentName: attachmentName ? attachmentName.trim() : null,
        attachmentType: normAttachmentType,
        tags: cleanTags
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            institution: true,
            totalCitations: true,
            hIndex: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      post
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish scholarly post." },
      { status: 500 }
    );
  }
}
