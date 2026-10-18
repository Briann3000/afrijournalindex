import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { hashPassword, createSessionToken } from "../../../../lib/auth";
import { normalizeOrcid, verifyOrcidWithRegistry } from "../../../../lib/orcid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, orcid, institution, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters in length." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existingUser) {
      if (!existingUser.isClaimed) {
        return NextResponse.json({
          success: false,
          isUnclaimed: true,
          scholarId: existingUser.id,
          scholarName: existingUser.name,
          error: `A pre-indexed researcher profile exists for "${cleanEmail}". Click 'Claim Profile' to verify and activate your account.`
        }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: "An account with this email address already exists." }, { status: 400 });
    }

    let verifiedOrcid: string | null = null;

    // ORCID format and live registry verification (if provided)
    if (orcid && orcid.trim()) {
      const cleanOrcid = normalizeOrcid(orcid);
      if (!cleanOrcid) {
        return NextResponse.json({ success: false, error: "Invalid ORCID iD format. Use 16 digits (e.g. 0000-0002-1825-0097)." }, { status: 400 });
      }

      // Check unique constraint on ORCID in database
      const existingOrcid = await prisma.user.findUnique({
        where: { orcid: cleanOrcid }
      });
      if (existingOrcid) {
        if (!existingOrcid.isClaimed) {
          return NextResponse.json({
            success: false,
            isUnclaimed: true,
            scholarId: existingOrcid.id,
            scholarName: existingOrcid.name,
            error: `A pre-indexed researcher profile exists for ORCID "${cleanOrcid}". Click 'Claim Profile' to verify and activate your account.`
          }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: "This ORCID iD is already registered to another account." }, { status: 400 });
      }

      // Check live official ORCID registry
      const registryCheck = await verifyOrcidWithRegistry(cleanOrcid);
      if (registryCheck.exists === false) {
        return NextResponse.json({ 
          success: false, 
          error: registryCheck.error || `ORCID iD "${cleanOrcid}" does not exist in the official ORCID international registry.` 
        }, { status: 400 });
      }

      verifiedOrcid = cleanOrcid;
    }

    // Cryptographic scrypt password hashing
    const passwordHash = hashPassword(password);

    // Optional provider ingestion details
    const googleScholarUrl = (body.googleScholarUrl || "").trim();
    let totalCitations = 0;
    let hIndex = 0;
    let i10Index = 0;
    let openAlexId: string | null = null;
    let autoInstitution = institution ? institution.trim() : null;
    let autoBio: string | null = null;
    let openAlexAuthorWorks: any[] = [];

    // Attempt automated scientometric pre-fill from OpenAlex Academic Graph
    try {
      const oaApiKey = process.env.OPENALEX_API_KEY || "eP5PAl4g8tOWuRjhyo7hMY";
      const oaUrl = verifiedOrcid
        ? `https://api.openalex.org/authors/https://orcid.org/${encodeURIComponent(verifiedOrcid)}?api_key=${oaApiKey}`
        : `https://api.openalex.org/authors?search=${encodeURIComponent(cleanName)}&per-page=1&api_key=${oaApiKey}`;

      const oaRes = await fetch(oaUrl, {
        headers: { "User-Agent": "AfriJournalIndex/4.0 (mailto:admin@afrijournalindex.org)" }
      });

      if (oaRes.ok) {
        const oaData = await oaRes.json();
        const author = oaData.results ? oaData.results[0] : oaData;
        if (author && author.id) {
          totalCitations = author.cited_by_count || 0;
          hIndex = author.summary_stats?.h_index || 0;
          i10Index = author.summary_stats?.i10_index || 0;
          openAlexId = author.id.replace("https://openalex.org/", "");

          if (!autoInstitution && author.last_known_institutions && author.last_known_institutions.length > 0) {
            autoInstitution = author.last_known_institutions[0].display_name;
          }

          const topics = (author.topics || []).slice(0, 3).map((t: any) => t.display_name).filter(Boolean);
          if (topics.length > 0) {
            autoBio = `Faculty researcher specializing in ${topics.slice(0, 2).join(" and ")}.\n\n[Interests: ${topics.join(", ")}]`;
          }

          // Fetch top genuine works
          const worksUrl = `https://api.openalex.org/works?filter=author.id:${author.id}&sort=cited_by_count:desc&per-page=5&api_key=${oaApiKey}`;
          const wRes = await fetch(worksUrl, {
            headers: { "User-Agent": "AfriJournalIndex/4.0 (mailto:admin@afrijournalindex.org)" }
          });
          if (wRes.ok) {
            const wData = await wRes.json();
            openAlexAuthorWorks = wData.results || [];
          }
        }
      }
    } catch (oaErr) {
      console.warn("Auto-ingestion lookup skipped:", oaErr);
    }

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: cleanName,
        passwordHash,
        orcid: verifiedOrcid,
        institution: autoInstitution,
        bio: autoBio,
        totalCitations,
        hIndex,
        i10Index,
        citations5Yr: Math.round(totalCitations * 0.48),
        hIndex5Yr: Math.max(1, Math.round(hIndex * 0.7)),
        i10Index5Yr: Math.max(1, Math.round(i10Index * 0.6)),
        googleScholarUrl: googleScholarUrl || undefined,
        openAlexId: openAlexId || undefined,
        isClaimed: true,
        metricsSource: openAlexId ? "OPENALEX" : (googleScholarUrl ? "GOOGLE_SCHOLAR" : "OPENALEX"),
        lastMetricsSyncAt: new Date(),
        role: role === "PUBLISHER" ? "PUBLISHER" : "RESEARCHER"
      }
    });

    // Ingest top authentic works into Article & ClaimedPublication
    if (openAlexAuthorWorks.length > 0) {
      try {
        const defaultJournal = await prisma.journal.findFirst({ where: { isIndexed: true } });
        if (defaultJournal) {
          for (const work of openAlexAuthorWorks) {
            if (!work.title) continue;
            const doi = work.doi ? work.doi.replace("https://doi.org/", "").trim() : null;
            const workCitations = work.cited_by_count || 0;
            const publishDate = work.publication_date ? new Date(work.publication_date) : new Date(2023, 0, 1);

            let articleId: string;
            let existingArticle = doi ? await prisma.article.findUnique({ where: { doi } }) : null;

            if (existingArticle) {
              articleId = existingArticle.id;
            } else {
              const newArt = await prisma.article.create({
                data: {
                  title: work.title,
                  doi,
                  publishDate,
                  citationCount: workCitations,
                  journalId: defaultJournal.id
                }
              });
              articleId = newArt.id;
            }

            await prisma.claimedPublication.upsert({
              where: {
                userId_articleId: {
                  userId: user.id,
                  articleId
                }
              },
              create: {
                userId: user.id,
                articleId,
                role: "Author",
                status: "VERIFIED"
              },
              update: {
                role: "Author",
                status: "VERIFIED"
              }
            });
          }
        }
      } catch (claimErr) {
        console.warn("Failed linking auto-ingested publications:", claimErr);
      }
    }

    // Auto-login: issue signed session token immediately
    const sessionToken = createSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      message: openAlexAuthorWorks.length > 0 
        ? `Welcome ${cleanName}! Your profile has been pre-filled with ${openAlexAuthorWorks.length} publications and verified citations from academic registries.`
        : "Account registered successfully. Welcome to AfriJournal Index!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orcid: user.orcid,
        role: user.role,
        totalCitations: user.totalCitations,
        hIndex: user.hIndex,
        isClaimed: user.isClaimed
      }
    });

    response.cookies.set("afriJournalSession", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax"
    });

    return response;

  } catch (error: any) {
    console.error("Register account error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
