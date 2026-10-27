import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { tokenizeQuery, matchesQueryFuzzy } from "../../../../lib/fuzzy-search";

// Helper to query Crossref metadata with timeout
async function fetchCrossrefWork(doi: string) {
  if (!doi) return null;
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//i, "").trim();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, {
      signal: controller.signal,
      headers: { "User-Agent": "AfriJournalIndex/1.0 (mailto:afrijournalindex@gmail.com)" }
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return data.message || null;
  } catch {
    return null;
  }
}

// Helper to search Crossref works by text or DOI
async function searchCrossrefWorks(query: string, rows: number = 8) {
  const clean = (query || "").trim();
  if (clean.length < 3) return [];
  try {
    const isDoi = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/i.test(clean) || clean.includes("doi.org/");
    if (isDoi) {
      const single = await fetchCrossrefWork(clean);
      if (single) return [single];
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(clean)}&rows=${rows}`, {
      signal: controller.signal,
      headers: { "User-Agent": "AfriJournalIndex/1.0 (mailto:afrijournalindex@gmail.com)" }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return data.message?.items || [];
  } catch {
    return [];
  }
}

// Helper to fetch OpenAlex suggested works for an author
async function fetchOpenAlexSuggestedWorks(openAlexId: string, limit: number = 15) {
  if (!openAlexId) return [];
  const cleanId = openAlexId.replace(/^https?:\/\/openalex\.org\//i, "").trim();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://api.openalex.org/works?filter=author.id:${encodeURIComponent(cleanId)}&per-page=${limit}`, {
      signal: controller.signal,
      headers: { "User-Agent": "AfriJournalIndex/1.0 (mailto:afrijournalindex@gmail.com)" }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

// Helper to match author names and ORCID
function checkAuthorMatch(
  userName: string,
  userOrcid: string | null | undefined,
  authors: Array<{ given?: string; family?: string; name?: string; ORCID?: string }>
) {
  if (!authors || authors.length === 0) {
    return { isMatch: false, matchedAuthor: null, authorNames: [], orcidMatch: false };
  }

  const normalizedUser = (userName || "").toLowerCase().trim();
  const userTokens = tokenizeQuery(normalizedUser);
  const cleanOrcid = userOrcid ? userOrcid.replace(/https?:\/\/orcid\.org\//i, "").trim() : null;

  const authorNames: string[] = [];
  let isMatch = false;
  let matchedAuthor: string | null = null;
  let orcidMatch = false;

  for (const a of authors) {
    const fullName = a.name || `${a.given || ""} ${a.family || ""}`.trim();
    if (fullName) authorNames.push(fullName);

    // 1. ORCID Match Check
    if (cleanOrcid && a.ORCID) {
      const aOrcid = a.ORCID.replace(/https?:\/\/orcid\.org\//i, "").trim();
      if (aOrcid === cleanOrcid) {
        isMatch = true;
        orcidMatch = true;
        matchedAuthor = fullName;
        break;
      }
    }

    // 2. Token / Family name match
    const aLower = fullName.toLowerCase();
    const familyLower = (a.family || "").toLowerCase();

    // Check if user's last name / surname matches family name
    if (userTokens.length > 0) {
      const lastName = userTokens[userTokens.length - 1];
      const firstName = userTokens[0];
      if (familyLower && familyLower.includes(lastName)) {
        // Also check first name initial or full
        if (firstName && (aLower.includes(firstName) || aLower.startsWith(firstName.charAt(0)))) {
          isMatch = true;
          matchedAuthor = fullName;
          break;
        }
      }
      // Check full fuzzy match across tokens
      if (matchesQueryFuzzy(userName, [fullName, a.name, a.given, a.family])) {
        isMatch = true;
        matchedAuthor = fullName;
        break;
      }
    }
  }

  return { isMatch, matchedAuthor, authorNames, orcidMatch };
}

// GET: Search cataloged articles, external Crossref/OpenAlex publications, or verify authorship pre-check
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const articleId = searchParams.get("articleId");
    const doi = searchParams.get("doi");
    const researcherId = searchParams.get("researcherId");
    const query = searchParams.get("query") || "";

    // 1. SUGGESTED MODE (for researchers linked to OpenAlex)
    if (mode === "suggested" && researcherId) {
      const user = await prisma.user.findUnique({
        where: { id: researcherId },
        select: {
          id: true,
          name: true,
          orcid: true,
          openAlexId: true,
          claims: { select: { articleId: true, article: { select: { doi: true } } } }
        }
      });

      if (!user) {
        return NextResponse.json({ success: false, error: "Researcher not found" }, { status: 404 });
      }

      const claimedDois = new Set(
        user.claims
          .map(c => c.article?.doi?.toLowerCase())
          .filter(Boolean)
      );

      let suggestions: any[] = [];
      if (user.openAlexId) {
        const openAlexWorks = await fetchOpenAlexSuggestedWorks(user.openAlexId, 20);
        suggestions = openAlexWorks.map((w: any) => {
          const rawDoi = w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//i, "") : null;
          return {
            id: rawDoi ? `ext-${rawDoi}` : `oa-${w.id.replace(/^https?:\/\/openalex\.org\//i, "")}`,
            title: w.title || "Academic Publication",
            doi: rawDoi,
            publishDate: w.publication_year ? `${w.publication_year}-01-01` : null,
            journalName: w.primary_location?.source?.display_name || "International Academic Venue",
            citationCount: w.cited_by_count || 0,
            url: w.doi || w.primary_location?.landing_page_url || null,
            isExternal: true,
            isAlreadyClaimed: rawDoi ? claimedDois.has(rawDoi.toLowerCase()) : false,
            source: "OpenAlex"
          };
        });
      }

      return NextResponse.json({
        success: true,
        suggestions
      });
    }

    // 2. PRE-CHECK VERIFICATION MODE
    if (mode === "verify") {
      let user: { name: string; orcid: string | null } | null = null;
      if (researcherId) {
        user = await prisma.user.findUnique({
          where: { id: researcherId },
          select: { name: true, orcid: true }
        });
      }

      // Check if this is an existing local article
      if (articleId && !articleId.startsWith("ext-") && !articleId.startsWith("oa-")) {
        const article = await prisma.article.findUnique({
          where: { id: articleId },
          include: { journal: { select: { name: true } } }
        });

        if (article) {
          const crossrefWork = article.doi ? await fetchCrossrefWork(article.doi) : null;
          const authors = crossrefWork?.author || [];
          const matchResult = checkAuthorMatch(user?.name || "", user?.orcid, authors);

          return NextResponse.json({
            success: true,
            article: {
              id: article.id,
              title: article.title,
              doi: article.doi,
              journalName: article.journal?.name,
              registeredAuthors: matchResult.authorNames,
              isExternal: false
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
      }

      // External DOI verification
      const targetDoi = doi || (articleId?.startsWith("ext-") ? articleId.replace(/^ext-/, "") : null);
      if (targetDoi) {
        const crossrefWork = await fetchCrossrefWork(targetDoi);
        if (crossrefWork) {
          const authors = crossrefWork.author || [];
          const matchResult = checkAuthorMatch(user?.name || "", user?.orcid, authors);

          return NextResponse.json({
            success: true,
            article: {
              id: `ext-${targetDoi}`,
              title: crossrefWork.title?.[0] || "Academic Publication",
              doi: targetDoi,
              journalName: crossrefWork["container-title"]?.[0] || crossrefWork.publisher || "External Venue",
              registeredAuthors: matchResult.authorNames,
              isExternal: true
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
      }

      return NextResponse.json({ success: false, error: "Publication or DOI not found in registry." }, { status: 404 });
    }

    // 3. SEARCH MODE (Internal catalog + External Crossref)
    const trimmedQuery = query.trim();
    let localArticles: any[] = [];

    if (trimmedQuery) {
      const tokens = tokenizeQuery(trimmedQuery);
      localArticles = await prisma.article.findMany({
        where: {
          AND: [
            { title: { not: "Untitled Article" } },
            {
              OR: [
                { title: { contains: trimmedQuery } },
                { doi: { contains: trimmedQuery } },
                { journal: { name: { contains: trimmedQuery } } },
                ...(tokens.map(tok => ({ title: { contains: tok } })))
              ]
            }
          ]
        },
        take: 15,
        include: {
          journal: { select: { id: true, name: true, qualityGrade: true } },
          citedBy: true
        },
        orderBy: { publishDate: "desc" }
      });
    } else {
      localArticles = await prisma.article.findMany({
        where: { title: { not: "Untitled Article" } },
        take: 15,
        include: {
          journal: { select: { id: true, name: true, qualityGrade: true } },
          citedBy: true
        },
        orderBy: { publishDate: "desc" }
      });
    }

    const formattedLocal = localArticles.map(art => ({
      id: art.id,
      title: art.title,
      doi: art.doi,
      publishDate: art.publishDate,
      journalName: art.journal?.name,
      citationCount: art.citedBy.length || art.citationCount,
      isExternal: false
    }));

    const existingDois = new Set(
      formattedLocal
        .map(a => a.doi?.toLowerCase())
        .filter(Boolean)
    );

    // Also search external Crossref works if query is non-empty
    let externalArticles: any[] = [];
    if (trimmedQuery.length >= 3) {
      const crossrefItems = await searchCrossrefWorks(trimmedQuery, 8);
      for (const item of crossrefItems) {
        const itemDoi = item.DOI;
        if (itemDoi && existingDois.has(itemDoi.toLowerCase())) {
          continue; // Already present in local catalog
        }
        const pubYear = item.published?.["date-parts"]?.[0]?.[0];
        const pubMonth = item.published?.["date-parts"]?.[0]?.[1] || 1;
        const pubDay = item.published?.["date-parts"]?.[0]?.[2] || 1;
        const pubDate = pubYear ? new Date(pubYear, pubMonth - 1, pubDay).toISOString() : null;

        externalArticles.push({
          id: itemDoi ? `ext-${itemDoi}` : `ext-${Date.now()}`,
          title: item.title?.[0] || "Untitled External Work",
          doi: itemDoi || null,
          publishDate: pubDate,
          journalName: item["container-title"]?.[0] || item.publisher || "International Academic Venue",
          citationCount: item["is-referenced-by-count"] || 0,
          url: item.URL || (itemDoi ? `https://doi.org/${itemDoi}` : null),
          isExternal: true,
          registeredAuthors: (item.author || []).map((a: any) => a.name || `${a.given || ""} ${a.family || ""}`.trim())
        });
      }
    }

    return NextResponse.json({
      success: true,
      articles: [...formattedLocal, ...externalArticles]
    });
  } catch (error: any) {
    console.error("Search claimable articles error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Claim authorship with rigorous verification (supports both local and external publications)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articleId, doi, researcherId, role, institutionalEmail, manualJustification, externalMetadata } = body;

    if (!articleId && !doi) {
      return NextResponse.json({ success: false, error: "Article ID or DOI is required." }, { status: 400 });
    }

    const user = researcherId ? await prisma.user.findUnique({
      where: { id: researcherId }
    }) : null;

    if (!user) {
      return NextResponse.json({ success: false, error: "Authenticated researcher profile required." }, { status: 401 });
    }

    let article: any = null;
    let targetDoi: string | null = doi || null;

    // Check if articleId is a standard local article ID
    if (articleId && !articleId.startsWith("ext-") && !articleId.startsWith("oa-")) {
      article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { journal: { select: { name: true } } }
      });
      if (article?.doi) {
        targetDoi = article.doi;
      }
    } else if (articleId?.startsWith("ext-")) {
      targetDoi = articleId.replace(/^ext-/, "");
    }

    // If article is not in local DB, check if it already exists by DOI
    if (!article && targetDoi) {
      article = await prisma.article.findUnique({
        where: { doi: targetDoi },
        include: { journal: { select: { name: true } } }
      });
    }

    // Live Crossref metadata fetch for verification & external article creation
    let crossrefWork: any = null;
    if (targetDoi) {
      crossrefWork = await fetchCrossrefWork(targetDoi);
    }

    const authors = crossrefWork?.author || externalMetadata?.authors || [];
    const matchResult = checkAuthorMatch(user.name, user.orcid, authors);

    // Verify authorship authorization
    const isApproved = matchResult.isMatch;
    const isAuditAllowed = institutionalEmail && institutionalEmail.includes("@") && (
      institutionalEmail.endsWith(".ac.ke") || 
      institutionalEmail.endsWith(".edu") || 
      institutionalEmail.endsWith(".org") ||
      manualJustification
    );

    if (!isApproved && !isAuditAllowed) {
      const authorsNotice = matchResult.authorNames.length > 0
        ? `Registered Crossref authors: ${matchResult.authorNames.join(", ")}.`
        : "No matching author record found for this publication.";

      return NextResponse.json({
        success: false,
        status: "REJECTED",
        error: `Authorship Verification Failed: Your profile name ("${user.name}") does not match the registered authors on this publication. ${authorsNotice} If you are a co-author, please provide your institutional email address for manual editorial audit.`
      }, { status: 403 });
    }

    // If article does NOT exist in local database, create it from Crossref/metadata
    if (!article) {
      const journalName = crossrefWork?.["container-title"]?.[0] || externalMetadata?.journalName || "External Academic Venue";
      const publisherName = crossrefWork?.publisher || externalMetadata?.publisherName || "International Publisher";

      let journal = await prisma.journal.findFirst({
        where: { name: journalName }
      });

      if (!journal) {
        journal = await prisma.journal.create({
          data: {
            name: journalName.slice(0, 500),
            publisherName: publisherName.slice(0, 500),
            country: "International",
            isIndexed: false,
            qualityGrade: "External",
            description: `External academic venue recorded via Crossref / OpenAlex index (${journalName}).`
          }
        });
      }

      // Parse publish date safely
      let pubDate = new Date();
      if (crossrefWork?.published?.["date-parts"]?.[0]?.[0]) {
        const parts = crossrefWork.published["date-parts"][0];
        pubDate = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
      } else if (externalMetadata?.publishDate) {
        pubDate = new Date(externalMetadata.publishDate);
      }

      const citationsCount = crossrefWork?.["is-referenced-by-count"] || externalMetadata?.citationCount || 0;

      article = await prisma.article.create({
        data: {
          title: crossrefWork?.title?.[0] || externalMetadata?.title || "Academic Publication",
          doi: targetDoi,
          abstract: crossrefWork?.abstract || null,
          url: crossrefWork?.URL || (targetDoi ? `https://doi.org/${targetDoi}` : externalMetadata?.url || null),
          publishDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
          citationCount: citationsCount,
          journalId: journal.id
        },
        include: { journal: { select: { name: true } } }
      });
    }

    // Link claimed publication record
    const claimStatus = isApproved ? "VERIFIED" : "PENDING_AUDIT";
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
        role: role || "Author",
        status: claimStatus
      },
      update: {
        role: role || "Author",
        status: claimStatus
      }
    });

    // If verified and article brings citations, ensure researcher totalCitations reflects verified metrics
    if (isApproved && article.citationCount > 0) {
      // Refresh total verified citations from all claimed articles
      const allUserClaims = await prisma.claimedPublication.findMany({
        where: { userId: user.id, status: "VERIFIED" },
        include: { article: { select: { citationCount: true } } }
      });
      const claimedCitationsTotal = allUserClaims.reduce((sum, c) => sum + (c.article?.citationCount || 0), 0);
      
      // Update user citations only if higher than current
      if (claimedCitationsTotal > user.totalCitations) {
        await prisma.user.update({
          where: { id: user.id },
          data: { totalCitations: claimedCitationsTotal }
        });
      }
    }

    if (isApproved) {
      return NextResponse.json({
        success: true,
        status: "VERIFIED",
        message: `Authorship verified successfully via Crossref records. Matched: "${matchResult.matchedAuthor || user.name}". Publication linked to your profile.`,
        articleId: article.id,
        role: role || "Author",
        matchedAuthor: matchResult.matchedAuthor
      });
    } else {
      return NextResponse.json({
        success: true,
        status: "PENDING_EDITORIAL_AUDIT",
        message: `Authorship claim submitted for Editorial Verification. Because your registered name ("${user.name}") differs from indexed author records, an automated audit ticket has been queued with AfriJournal editorial review.`,
        articleId: article.id,
        role: role || "Co-Author"
      });
    }

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
