import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";

// GET: Search cataloged articles available to claim
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");
    const currentUserId = sessionCookie?.value;

    const articles = await prisma.article.findMany({
      where: query.trim() ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { doi: { contains: query, mode: "insensitive" } },
          { journal: { name: { contains: query, mode: "insensitive" } } }
        ]
      } : {},
      take: 25,
      include: {
        journal: {
          select: { id: true, name: true, qualityGrade: true }
        },
        citedBy: true,
        authors: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        publishDate: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      articles: articles.map(art => ({
        id: art.id,
        title: art.title,
        doi: art.doi,
        publishDate: art.publishDate,
        journalName: art.journal?.name,
        citationCount: art.citedBy.length,
        isClaimedByMe: currentUserId ? art.authors.some(a => a.id === currentUserId) : false,
        coAuthors: art.authors.map(a => a.name)
      }))
    });
  } catch (error: any) {
    console.error("Search claimable articles error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Claim authorship of an article
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "You must be logged in to claim articles." }, { status: 401 });
    }

    const { articleId } = await request.json();
    if (!articleId) {
      return NextResponse.json({ success: false, error: "Article ID is required." }, { status: 400 });
    }

    // Connect article to user
    await prisma.user.update({
      where: { id: sessionCookie.value },
      data: {
        articles: {
          connect: { id: articleId }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Article successfully claimed into your researcher profile."
    });
  } catch (error: any) {
    console.error("Claim article error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Unclaim authorship
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("afriJournalSession");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "You must be logged in." }, { status: 401 });
    }

    const { articleId } = await request.json();
    if (!articleId) {
      return NextResponse.json({ success: false, error: "Article ID is required." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: sessionCookie.value },
      data: {
        articles: {
          disconnect: { id: articleId }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Article removed from profile."
    });
  } catch (error: any) {
    console.error("Unclaim article error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
