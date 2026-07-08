import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Researcher ID is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        orcid: true,
        role: true,
        institution: true
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Researcher profile not found." }, { status: 404 });
    }

    // Fetch all articles authored by this user, including their citations
    const articles = await prisma.article.findMany({
      where: {
        authors: {
          some: { id }
        }
      },
      include: {
        journal: {
          select: { name: true }
        },
        citedBy: true // Citations pointing to this article
      },
      orderBy: {
        publishDate: "desc"
      }
    });

    // Compute citation counts
    const citationCounts = articles.map(art => art.citedBy.length).sort((a, b) => b - a);
    
    // Compute h-index
    let hIndex = 0;
    for (let i = 0; i < citationCounts.length; i++) {
      if (citationCounts[i] >= i + 1) {
        hIndex = i + 1;
      } else {
        break;
      }
    }

    // Compute i10-index
    const i10Index = citationCounts.filter(c => c >= 10).length;
    const totalCitations = citationCounts.reduce((sum, c) => sum + c, 0);

    return NextResponse.json({
      success: true,
      data: {
        profile: user,
        metrics: {
          publicationsCount: articles.length,
          totalCitations,
          hIndex,
          i10Index
        },
        articles: articles.map(art => ({
          id: art.id,
          title: art.title,
          doi: art.doi,
          publishDate: art.publishDate,
          journalName: art.journal.name,
          citationsCount: art.citedBy.length
        }))
      }
    });

  } catch (error: any) {
    console.error("Get researcher profile error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
