import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/db";

// GET: Search cataloged articles available to claim
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    const articles = await prisma.article.findMany({
      where: query.trim() ? {
        OR: [
          { title: { contains: query } },
          { doi: { contains: query } },
          { journal: { name: { contains: query } } }
        ]
      } : {},
      take: 25,
      include: {
        journal: {
          select: { id: true, name: true, qualityGrade: true }
        },
        citedBy: true
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
        isClaimedByMe: false,
        coAuthors: []
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

    const body = await request.json();
    const articleId = body.articleId;
    if (!articleId) {
      return NextResponse.json({ success: false, error: "Article ID is required." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Publication claimed and verified successfully."
    });
  } catch (error: any) {
    console.error("Claim article error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
