import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

function sanitizePlain(text: string): string {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

// GET /api/forum/topics/[idOrSlug] - Fetch single topic with its replies and author profiles
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Topic identifier required." }, { status: 400 });
    }

    // Try finding by slug first, then by UUID id
    let topic = await prisma.forumTopic.findFirst({
      where: {
        OR: [{ slug: id }, { id }]
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            institution: true,
            department: true,
            totalCitations: true,
            hIndex: true,
            googleScholarId: true,
            institutionRelation: {
              select: { name: true, country: true }
            }
          }
        },
        replies: {
          orderBy: { createdAt: "asc" },
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
                  select: { name: true, country: true }
                }
              }
            }
          }
        }
      }
    });

    if (!topic) {
      return NextResponse.json({ success: false, error: "Discussion topic not found." }, { status: 404 });
    }

    // Increment views count asynchronously
    prisma.forumTopic.update({
      where: { id: topic.id },
      data: { viewsCount: { increment: 1 } }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      topic: {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        content: topic.content,
        isPinned: topic.isPinned,
        isLocked: topic.isLocked,
        viewsCount: topic.viewsCount + 1,
        category: topic.category,
        author: {
          ...topic.author,
          country: topic.author.institutionRelation?.country || null
        },
        replies: topic.replies.map(r => ({
          id: r.id,
          content: r.content,
          createdAt: r.createdAt,
          author: {
            ...r.author,
            country: r.author.institutionRelation?.country || null
          }
        })),
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt
      }
    });
  } catch (error: any) {
    console.error("Fetch forum topic details error:", error);
    return NextResponse.json({ success: false, error: "Failed to load discussion thread." }, { status: 500 });
  }
}

// POST /api/forum/topics/[idOrSlug] - Add a reply to this thread (authenticated)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Please sign in to reply to this discussion." },
        { status: 401 }
      );
    }

    const userId = verifySessionToken(sessionCookie.value);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid session. Please sign in again." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 401 }
      );
    }

    const targetTopic = await prisma.forumTopic.findFirst({
      where: { OR: [{ slug: id }, { id }] }
    });

    if (!targetTopic) {
      return NextResponse.json({ success: false, error: "Topic not found." }, { status: 404 });
    }

    if (targetTopic.isLocked) {
      return NextResponse.json(
        { success: false, error: "This discussion thread has been locked by editorial moderators." },
        { status: 403 }
      );
    }

    // Rate-limiting / anti-spam cooldown: 5 seconds for replies
    const recentReply = await prisma.forumReply.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    });
    if (recentReply) {
      const diffMs = Date.now() - new Date(recentReply.createdAt).getTime();
      if (diffMs < 5000) {
        return NextResponse.json(
          { success: false, error: "Please wait a few seconds before posting another reply." },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const rawContent = typeof body.content === "string" ? body.content.trim() : "";

    if (rawContent.length < 5) {
      return NextResponse.json(
        { success: false, error: "Reply content must be at least 5 characters long." },
        { status: 400 }
      );
    }
    if (rawContent.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Reply content cannot exceed 5,000 characters." },
        { status: 400 }
      );
    }

    const sanitizedContent = sanitizePlain(rawContent);

    const reply = await prisma.forumReply.create({
      data: {
        content: sanitizedContent,
        topicId: targetTopic.id,
        authorId: userId
      },
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
        }
      }
    });

    // Touch topic updatedAt so active threads bubble to the top
    await prisma.forumTopic.update({
      where: { id: targetTopic.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: "Reply posted successfully.",
      reply: {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        author: {
          ...reply.author,
          country: reply.author.institutionRelation?.country || null
        }
      }
    });
  } catch (error: any) {
    console.error("Post forum reply error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to post reply." },
      { status: 500 }
    );
  }
}
