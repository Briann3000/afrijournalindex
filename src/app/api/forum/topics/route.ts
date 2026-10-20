import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

function sanitizePlain(text: string): string {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}

// GET /api/forum/topics - List topics with category filter & pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ];
    }

    const [total, topics] = await Promise.all([
      prisma.forumTopic.count({ where }),
      prisma.forumTopic.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: "desc" },
          { updatedAt: "desc" }
        ],
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true }
          },
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
          _count: {
            select: { replies: true }
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      topics: topics.map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        snippet: t.content.substring(0, 200),
        isPinned: t.isPinned,
        isLocked: t.isLocked,
        viewsCount: t.viewsCount,
        category: t.category,
        author: {
          id: t.author.id,
          name: t.author.name,
          role: t.author.role,
          institution: t.author.institution,
          country: t.author.institutionRelation?.country || null,
          totalCitations: t.author.totalCitations,
          hIndex: t.author.hIndex
        },
        repliesCount: t._count.replies,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Fetch forum topics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch discussion topics." },
      { status: 500 }
    );
  }
}

// POST /api/forum/topics - Create a new discussion topic (authenticated)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, error: "Authentication required to start a discussion." },
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
      where: { id: userId },
      select: { id: true, role: true }
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User profile not found." },
        { status: 401 }
      );
    }

    // Rate-limiting / anti-spam cooldown: 15 seconds
    const recentTopic = await prisma.forumTopic.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    });
    if (recentTopic) {
      const diffMs = Date.now() - new Date(recentTopic.createdAt).getTime();
      if (diffMs < 15000) {
        return NextResponse.json(
          { success: false, error: "Please wait at least 15 seconds before publishing another discussion." },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
    const rawContent = typeof body.content === "string" ? body.content.trim() : "";
    const { categoryId } = body;

    if (rawTitle.length < 8) {
      return NextResponse.json(
        { success: false, error: "Discussion title must be at least 8 characters long." },
        { status: 400 }
      );
    }
    if (rawTitle.length > 200) {
      return NextResponse.json(
        { success: false, error: "Discussion title cannot exceed 200 characters." },
        { status: 400 }
      );
    }

    if (rawContent.length < 20) {
      return NextResponse.json(
        { success: false, error: "Discussion content must be at least 20 characters long." },
        { status: 400 }
      );
    }
    if (rawContent.length > 10000) {
      return NextResponse.json(
        { success: false, error: "Discussion content cannot exceed 10,000 characters." },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "Please select a discussion category." },
        { status: 400 }
      );
    }

    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId }
    });
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Selected category does not exist." },
        { status: 404 }
      );
    }

    // Sanitize title & content
    const sanitizedTitle = sanitizePlain(rawTitle);
    const sanitizedContent = sanitizePlain(rawContent);

    // Generate unique slug with collision check
    const baseSlug = slugify(sanitizedTitle) || "discussion";
    let slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    let collision = await prisma.forumTopic.findUnique({ where: { slug } });
    let attempts = 0;
    while (collision && attempts < 5) {
      slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
      collision = await prisma.forumTopic.findUnique({ where: { slug } });
      attempts++;
    }

    const topic = await prisma.forumTopic.create({
      data: {
        title: sanitizedTitle,
        slug,
        content: sanitizedContent,
        categoryId,
        authorId: userId
      },
      include: {
        category: true,
        author: {
          select: { name: true, institution: true, role: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Discussion topic published successfully.",
      topic
    });
  } catch (error: any) {
    console.error("Create forum topic error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create discussion topic." },
      { status: 500 }
    );
  }
}
