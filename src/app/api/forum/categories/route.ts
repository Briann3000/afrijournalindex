import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { cookies } from "next/headers";
import { verifySessionToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET /api/forum/categories - Returns all categories with topic & post counts
export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { topics: true }
        },
        topics: {
          take: 1,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            updatedAt: true,
            author: {
              select: { name: true, institution: true }
            }
          }
        }
      }
    });

    // Also get total reply count per category
    const formatted = await Promise.all(
      categories.map(async (c) => {
        const replyCount = await prisma.forumReply.count({
          where: { topic: { categoryId: c.id } }
        });

        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          icon: c.icon,
          topicsCount: c._count.topics,
          postsCount: c._count.topics + replyCount,
          latestTopic: c.topics[0] || null
        };
      })
    );

    return NextResponse.json({
      success: true,
      categories: formatted
    });
  } catch (error: any) {
    console.error("Fetch forum categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch discussion categories." },
      { status: 500 }
    );
  }
}
