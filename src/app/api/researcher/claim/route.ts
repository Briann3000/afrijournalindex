import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

// Helper to query Crossref metadata with timeout
async function fetchCrossrefAuthors(doi: string): Promise<Array<{ given?: string; family?: string; name?: string; ORCID?: string }>> {
  if (!doi) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      signal: controller.signal,
      headers: { "User-Agent": "AfriJournalIndex/1.0 (mailto:afrijournalindex@gmail.com)" }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return data.message?.author || [];
  } catch {
    return [];
  }
}

// Helper to match author names
function checkAuthorMatch(userName: string, userOrcid: string | null | undefined, authors: Array<{ given?: string; family?: string; name?: string; ORCID?: string }>) {
  if (!authors || authors.length === 0) {
    return { isMatch: false, matchedAuthor: null, authorNames: [], orcidMatch: false };
  }

  const normalizedUser = (userName || "").toLowerCase().trim();
  const userParts = normalizedUser.split(/\s+/).filter(p => p.length > 2); // Ignore short titles like Dr., Mr.
  const cleanOrcid = userOrcid ? userOrcid.replace(/https?:\/\/orcid\.org\//i, "").trim() : null;

  const authorNames: string[] = [];
  let isMatch = false;
  let matchedAuthor: string | null = null;
  let orcidMatch = false;

  for (const a of authors) {
    const fullName = a.name || `${a.given || ""} ${a.family || ""}`.trim();
    if (fullName) authorNames.push(fullName);

    // ORCID Match Check
    if (cleanOrcid && a.ORCID) {
      const aOrcid = a.ORCID.replace(/https?:\/\/orcid\.org\//i, "").trim();
      if (aOrcid === cleanOrcid) {
        isMatch = true;
        orcidMatch = true;
        matchedAuthor = fullName;
        break;
      }
    }

    // Name Token Match Check
    const aLower = fullName.toLowerCase();
    const familyLower = (a.family || "").toLowerCase();
    
    // Check if user's last name or key name tokens exist in author's record
    for (const part of userParts) {
      if (familyLower.includes(part) || aLower.includes(part)) {
        isMatch = true;
        matchedAuthor = fullName;
        break;
      }
    }
  }

  return { isMatch, matchedAuthor, authorNames, orcidMatch };
}

// GET: Search cataloged articles OR verify authorship pre-check
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const articleId = searchParams.get("articleId");
    const researcherId = searchParams.get("researcherId");
    const query = searchParams.get("query") || "";

    // Pre-check verification mode
    if (mode === "verify" && articleId) {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { journal: { select: { name: true } } }
      });
      if (!article) {
        return NextResponse.json({ success: false, error: "Article not found." }, { status: 404 });
      }

      let user: { name: string; orcid: string | null } | null = null;
      if (researcherId) {
        user = await prisma.user.findUnique({
          where: { id: researcherId },
          select: { name: true, orcid: true }
        });
      }

      const authors = article.doi ? await fetchCrossrefAuthors(article.doi) : [];
      const matchResult = checkAuthorMatch(user?.name || "", user?.orcid, authors);

      return NextResponse.json({
        success: true,
        article: {
          id: article.id,
          title: article.title,
          doi: article.doi,
          journalName: article.journal?.name,
          registeredAuthors: matchResult.authorNames
        },
        verification: {
          isMatch: matchResult.isMatch,
          matchedAuthor: matchResult.matchedAuthor,
          orcidMatched: matchResult.orcidMatch,
          registeredAuthors: matchResult.authorNames,
          userName: user?.name || "Researcher"
        }
      });
    }

    // Search mode
    const articles = await prisma.article.findMany({
      where: query.trim() ? {
        AND: [
          { title: { not: "Untitled Article" } },
          {
            OR: [
              { title: { contains: query } },
              { doi: { contains: query } },
              { journal: { name: { contains: query } } }
            ]
          }
        ]
      } : {
        title: { not: "Untitled Article" }
      },
      take: 20,
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
        citationCount: art.citedBy.length
      }))
    });
  } catch (error: any) {
    console.error("Search claimable articles error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Claim authorship with rigorous verification
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articleId, researcherId, role, institutionalEmail, manualJustification } = body;

    if (!articleId) {
      return NextResponse.json({ success: false, error: "Article ID is required." }, { status: 400 });
    }

    const user = researcherId ? await prisma.user.findUnique({
      where: { id: researcherId }
    }) : null;

    if (!user) {
      return NextResponse.json({ success: false, error: "Authenticated researcher profile required." }, { status: 401 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { journal: { select: { name: true } } }
    });

    if (!article) {
      return NextResponse.json({ success: false, error: "Article not found in repository." }, { status: 404 });
    }

    // Perform live Crossref Authorship Verification
    const authors = article.doi ? await fetchCrossrefAuthors(article.doi) : [];
    const matchResult = checkAuthorMatch(user.name, user.orcid, authors);

    // If Crossref author metadata matched the researcher's name or ORCID:
    if (matchResult.isMatch) {
      await prisma.claimedPublication.upsert({
        where: {
          userId_articleId: {
            userId: user.id,
            articleId: article.id
          }
        },
        create: {
          userId: user.id,
          articleId: article.id,
          role: role || "Lead Author",
          status: "VERIFIED"
        },
        update: {
          role: role || "Lead Author",
          status: "VERIFIED"
        }
      });

      return NextResponse.json({
        success: true,
        status: "VERIFIED",
        message: `Authorship verified successfully via Crossref records. Matched: "${matchResult.matchedAuthor}". Publication linked to your profile.`,
        articleId: article.id,
        role: role || "Author",
        matchedAuthor: matchResult.matchedAuthor
      });
    }

    // If name DID NOT match: check if institutional email verification or co-author manual audit is provided
    if (institutionalEmail && institutionalEmail.includes("@") && institutionalEmail.endsWith(".ac.ke") || institutionalEmail?.includes(".edu") || manualJustification) {
      await prisma.claimedPublication.upsert({
        where: {
          userId_articleId: {
            userId: user.id,
            articleId: article.id
          }
        },
        create: {
          userId: user.id,
          articleId: article.id,
          role: role || "Co-Author",
          status: "PENDING_AUDIT"
        },
        update: {
          role: role || "Co-Author",
          status: "PENDING_AUDIT"
        }
      });

      return NextResponse.json({
        success: true,
        status: "PENDING_EDITORIAL_AUDIT",
        message: `Authorship claim submitted for Editorial Verification. Because your registered name ("${user.name}") differs from primary Crossref author records (${matchResult.authorNames.slice(0, 2).join(", ") || "N/A"}), an automated audit ticket has been queued with KENPRO editorial review.`,
        articleId: article.id,
        role: role || "Co-Author"
      });
    }

    // Otherwise, block the claim to protect academic integrity
    const authorsNotice = matchResult.authorNames.length > 0
      ? `Registered Crossref authors: ${matchResult.authorNames.join(", ")}.`
      : "No matching author record found for this DOI.";

    return NextResponse.json({
      success: false,
      status: "REJECTED",
      error: `Authorship Verification Failed: Your name ("${user.name}") does not match the registered authors on this publication. ${authorsNotice} Illegitimate authorship claims violate academic publishing ethics. If you are a co-author, please provide your institutional email address for manual audit.`
    }, { status: 403 });

  } catch (error: any) {
    console.error("Claim article error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Unlink / remove a publication from researcher profile
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");
    const researcherId = searchParams.get("researcherId");

    if (!articleId || !researcherId) {
      return NextResponse.json({ success: false, error: "articleId and researcherId are required." }, { status: 400 });
    }

    const deleted = await prisma.claimedPublication.deleteMany({
      where: {
        userId: researcherId,
        articleId: articleId
      }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: "Publication was not linked to this researcher profile." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Publication unlinked from your scholar profile successfully."
    });
  } catch (error: any) {
    console.error("Delete claim error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
