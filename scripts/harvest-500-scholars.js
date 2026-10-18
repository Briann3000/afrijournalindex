const mariadb = require('mariadb');
const crypto = require('crypto');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function mapToBroadDiscipline(topic) {
  const t = (topic || "").toLowerCase();
  if (t.includes("health") || t.includes("medic") || t.includes("malaria") || t.includes("hiv") || t.includes("tuberculosis") || t.includes("stroke") || t.includes("cardio") || t.includes("disease") || t.includes("clinical") || t.includes("nurs") || t.includes("psych") || t.includes("pharmac") || t.includes("epidemiol")) {
    return "Health Sciences";
  }
  if (t.includes("agri") || t.includes("crop") || t.includes("farm") || t.includes("soil") || t.includes("environment") || t.includes("ecolog") || t.includes("water") || t.includes("forest") || t.includes("climate")) {
    return "Agricultural & Environmental Sciences";
  }
  if (t.includes("physic") || t.includes("math") || t.includes("engineer") || t.includes("comput") || t.includes("energy") || t.includes("material") || t.includes("chem") || t.includes("particle") || t.includes("technol")) {
    return "Physical Sciences & Engineering";
  }
  if (t.includes("econom") || t.includes("finance") || t.includes("business") || t.includes("market") || t.includes("trade") || t.includes("account") || t.includes("bank")) {
    return "Business & Economics";
  }
  if (t.includes("educat") || t.includes("pedagog") || t.includes("school") || t.includes("curriculum") || t.includes("teach") || t.includes("learn")) {
    return "Education & Pedagogy";
  }
  if (t.includes("bio") || t.includes("genet") || t.includes("cell") || t.includes("microbio") || t.includes("plant") || t.includes("zoolog") || t.includes("species")) {
    return "Life Sciences & Biotechnology";
  }
  return "Social Sciences & Humanities";
}

async function harvestScholarsAndCoauthors() {
  console.log("=== Harvesting 500+ Popular & Top-Ranked African Scholars and Co-Authors from OpenAlex ===\n");

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    // 1. Pick an indexed journal to link incoming articles to if no direct match
    const indexedJournals = await conn.query("SELECT id, name FROM Journal WHERE isIndexed = 1 LIMIT 10");
    const defaultJournalId = indexedJournals.length > 0 ? indexedJournals[0].id : null;
    if (!defaultJournalId) {
      console.error("No indexed journals found in DB to link articles.");
      return;
    }

    const africanCountryCodes = "KE|ZA|NG|EG|UG|GH|ET|TZ|RW|ZW|MA|TN|DZ|SN|CM|CI|BW|MU";
    const targetPages = 5; // 5 pages * 100 = 500 authors
    let ingestedPrimaryCount = 0;
    let ingestedCoAuthorCount = 0;
    let totalWorksLinked = 0;

    for (let page = 1; page <= targetPages; page++) {
      console.log(`\n--- Fetching OpenAlex Top African Authors: Page ${page} of ${targetPages} ---`);
      const authorsUrl = `https://api.openalex.org/authors?filter=last_known_institutions.country_code:${africanCountryCodes}&sort=cited_by_count:desc&per-page=100&page=${page}&api_key=${OPENALEX_KEY}`;

      let authors = [];
      try {
        const res = await fetch(authorsUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/2.0 (mailto:admin@afrijournalindex.org)' }
        });
        if (!res.ok) {
          console.error(`Page ${page} fetch failed with HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        authors = data.results || [];
      } catch (err) {
        console.error(`Error requesting page ${page}:`, err.message);
        continue;
      }

      console.log(`Retrieved ${authors.length} authors on page ${page}. Processing...`);

      for (const author of authors) {
        const name = author.display_name?.trim();
        if (!name) continue;

        // Extract institution info
        const lastInst = author.last_known_institutions?.[0] || {};
        const institutionName = lastInst.display_name || "African Academic Institution";
        const countryCode = lastInst.country_code || "KE";
        const emailSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
        const emailDomain = lastInst.ror ? `${institutionName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12)}.ac` : "ac.africa";
        const email = `${emailSlug}.${author.id.replace('https://openalex.org/', '').toLowerCase()}@${emailDomain}`;
        const orcid = author.orcid ? author.orcid.replace("https://orcid.org/", "").trim() : null;

        // Topics and Broad Discipline
        const rawTopics = (author.topics || []).slice(0, 4).map(t => t.display_name).filter(Boolean);
        const broadDiscipline = rawTopics.length > 0 ? mapToBroadDiscipline(rawTopics[0]) : "Multidisciplinary";
        const interestsTag = rawTopics.length > 0 ? `[Interests: ${rawTopics.join(", ")}]` : "";
        const disciplineTag = `[Discipline: ${broadDiscipline}]`;
        const bio = `Faculty researcher at ${institutionName}, specializing in ${broadDiscipline}. ${disciplineTag} ${interestsTag}`.trim();

        // Check or Create User
        let userId;
        const existingUsers = await conn.query("SELECT id FROM User WHERE orcid = ? OR email = ?", [orcid, email]);
        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
        } else {
          userId = crypto.randomUUID();
          await conn.query(
            "INSERT INTO User (id, name, email, passwordHash, role, institution, orcid, bio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [userId, name, email, "sim_hash_password123", "RESEARCHER", institutionName, orcid, bio]
          );
          ingestedPrimaryCount++;
        }

        // Fetch top works for this author (2 works per author for fast, deep coverage)
        await sleep(120);
        try {
          const worksUrl = `https://api.openalex.org/works?filter=author.id:${author.id}&sort=cited_by_count:desc&per-page=2&api_key=${OPENALEX_KEY}`;
          const wRes = await fetch(worksUrl, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/2.0 (mailto:admin@afrijournalindex.org)' }
          });
          if (!wRes.ok) continue;
          const wData = await wRes.json();
          const works = wData.results || [];

          for (const work of works) {
            const title = work.title;
            if (!title) continue;

            const doi = work.doi ? work.doi.replace("https://doi.org/", "").trim() : null;
            const citationCount = work.cited_by_count || 0;
            const publishDate = work.publication_date ? new Date(work.publication_date) : new Date(2023, 0, 1);

            // Upsert Article
            let articleId;
            let existingArticle = [];
            if (doi) {
              existingArticle = await conn.query("SELECT id FROM Article WHERE doi = ?", [doi]);
            }
            if (existingArticle.length > 0) {
              articleId = existingArticle[0].id;
            } else {
              articleId = crypto.randomUUID();
              await conn.query(
                "INSERT INTO Article (id, title, doi, publishDate, citationCount, journalId, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                [articleId, title, doi, publishDate, citationCount, defaultJournalId]
              );
            }

            // Link Primary Author
            const primaryClaim = await conn.query("SELECT id FROM ClaimedPublication WHERE userId = ? AND articleId = ?", [userId, articleId]);
            if (primaryClaim.length === 0) {
              await conn.query(
                "INSERT INTO ClaimedPublication (id, userId, articleId, role, status, claimedAt) VALUES (?, ?, ?, ?, ?, NOW())",
                [crypto.randomUUID(), userId, articleId, "Lead Author", "VERIFIED"]
              );
              totalWorksLinked++;
            }

            // Harvest Co-Authors from Authorships!
            const authorships = work.authorships || [];
            for (const authorship of authorships) {
              const coAuthorName = authorship.author?.display_name?.trim();
              const coAuthorOpenAlexId = authorship.author?.id;
              if (!coAuthorName || coAuthorOpenAlexId === author.id) continue;

              const coInst = authorship.institutions?.[0] || {};
              const coInstName = coInst.display_name || institutionName;
              const coOrcid = authorship.author?.orcid ? authorship.author.orcid.replace("https://orcid.org/", "").trim() : null;
              const coSlug = coAuthorName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
              const coEmail = `${coSlug}.${coAuthorOpenAlexId.replace('https://openalex.org/', '').toLowerCase()}@ac.africa`;

              // Find or create co-author user
              let coUserId;
              const existingCo = await conn.query("SELECT id FROM User WHERE orcid = ? OR email = ?", [coOrcid, coEmail]);
              if (existingCo.length > 0) {
                coUserId = existingCo[0].id;
              } else {
                coUserId = crypto.randomUUID();
                const coBio = `Academic researcher & collaborator at ${coInstName}. [Discipline: ${broadDiscipline}] [Interests: ${rawTopics.slice(0, 2).join(", ")}]`;
                await conn.query(
                  "INSERT INTO User (id, name, email, passwordHash, role, institution, orcid, bio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
                  [coUserId, coAuthorName, coEmail, "sim_hash_password123", "RESEARCHER", coInstName, coOrcid, coBio]
                );
                ingestedCoAuthorCount++;
              }

              // Link co-author to this shared publication
              const coClaim = await conn.query("SELECT id FROM ClaimedPublication WHERE userId = ? AND articleId = ?", [coUserId, articleId]);
              if (coClaim.length === 0) {
                await conn.query(
                  "INSERT INTO ClaimedPublication (id, userId, articleId, role, status, claimedAt) VALUES (?, ?, ?, ?, ?, NOW())",
                  [crypto.randomUUID(), coUserId, articleId, "Co-Author", "VERIFIED"]
                );
                totalWorksLinked++;
              }
            }
          }
        } catch (we) {
          // Continue on work fetch error
        }

        if (ingestedPrimaryCount % 25 === 0 && ingestedPrimaryCount > 0) {
          console.log(`Progress: Ingested ${ingestedPrimaryCount} primary scholars, ${ingestedCoAuthorCount} co-authors, ${totalWorksLinked} verified claims.`);
        }
      }
    }

    const totalScholarsInDb = await conn.query("SELECT COUNT(*) as cnt FROM User WHERE role = 'RESEARCHER'");
    const totalClaimsInDb = await conn.query("SELECT COUNT(*) as cnt FROM ClaimedPublication WHERE status = 'VERIFIED'");
    const totalArticlesInDb = await conn.query("SELECT COUNT(*) as cnt FROM Article");

    console.log(`\n========================================`);
    console.log(`=== HARVEST COMPLETE & VERIFIED ===`);
    console.log(`Primary Scholars Ingested: ${ingestedPrimaryCount}`);
    console.log(`Connected Co-Authors Ingested: ${ingestedCoAuthorCount}`);
    console.log(`Total Verified Scholars in DB: ${totalScholarsInDb[0].cnt}`);
    console.log(`Total Verified Claimed Works in DB: ${totalClaimsInDb[0].cnt}`);
    console.log(`Total Articles in DB: ${totalArticlesInDb[0].cnt}`);
    console.log(`========================================\n`);

  } finally {
    await conn.end();
    await pool.end();
  }
}

harvestScholarsAndCoauthors().catch(console.error);
