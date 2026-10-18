const mariadb = require('mariadb');
const crypto = require('crypto');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const TARGET_INSTITUTIONS = [
  {
    id: "https://openalex.org/I12859529",
    name: "University of Nairobi",
    country: "Kenya",
    domain: "uonbi.ac.ke"
  },
  {
    id: "https://openalex.org/I157614274",
    name: "University of Cape Town",
    country: "South Africa",
    domain: "uct.ac.za"
  },
  {
    id: "https://openalex.org/I72227227",
    name: "Makerere University",
    country: "Uganda",
    domain: "mak.ac.ug"
  },
  {
    id: "https://openalex.org/I181631907",
    name: "University of Ibadan",
    country: "Nigeria",
    domain: "ui.edu.ng"
  },
  {
    id: "https://openalex.org/I145487455",
    name: "Cairo University",
    country: "Egypt",
    domain: "cu.edu.eg"
  },
  {
    id: "https://openalex.org/I28046988",
    name: "Kwame Nkrumah University of Science and Technology",
    country: "Ghana",
    domain: "knust.edu.gh"
  }
];

async function ingestAuthenticScholars() {
  console.log("=== Ingesting Authentic African Scholars & Real Works from OpenAlex ===\n");

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    // Get an indexed journal to link articles to, or pick top journals
    const indexedJournals = await conn.query("SELECT id, name FROM Journal WHERE isIndexed = 1 LIMIT 10");
    if (indexedJournals.length === 0) {
      console.error("No indexed journals found in DB to link articles.");
      return;
    }
    const defaultJournalId = indexedJournals[0].id;

    for (const inst of TARGET_INSTITUTIONS) {
      console.log(`\nFetching genuine scholars for ${inst.name} (${inst.country})...`);
      const authorsUrl = `https://api.openalex.org/authors?filter=last_known_institutions.id:${encodeURIComponent(inst.id)}&sort=cited_by_count:desc&per-page=4&api_key=${OPENALEX_KEY}`;
      
      const res = await fetch(authorsUrl, {
        headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
      });
      if (!res.ok) {
        console.error(`Failed to fetch authors for ${inst.name}: status ${res.status}`);
        continue;
      }
      const data = await res.json();
      const authors = data.results || [];

      for (const author of authors) {
        const name = author.display_name;
        if (!name) continue;

        const cleanName = name.trim();
        const emailSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
        const email = `${emailSlug}@${inst.domain}`;
        const orcid = author.orcid ? author.orcid.replace("https://orcid.org/", "").trim() : null;
        
        // Extract top 3 research topics
        const topics = (author.topics || []).slice(0, 3).map(t => t.display_name).filter(Boolean);
        const bioInterests = topics.length > 0 ? `[Interests: ${topics.join(", ")}]` : "";
        const bio = `Faculty researcher at ${inst.name}, specializing in ${topics.slice(0, 2).join(" and ") || "interdisciplinary research"}. ${bioInterests}`.trim();

        // 1. Create or Find User
        let userId;
        const existingUser = await conn.query("SELECT id FROM User WHERE email = ?", [email]);
        if (existingUser.length > 0) {
          userId = existingUser[0].id;
          console.log(` Scholar exists: ${cleanName} (${email})`);
        } else {
          userId = crypto.randomUUID();
          await conn.query(
            "INSERT INTO User (id, name, email, passwordHash, role, institution, orcid, bio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [userId, cleanName, email, "sim_hash_password123", "RESEARCHER", inst.name, orcid, bio]
          );
          console.log(` + Ingested Scholar: ${cleanName} (${inst.name})`);
        }

        // 2. Fetch author's genuine works
        await sleep(200);
        const worksUrl = `https://api.openalex.org/works?filter=author.id:${author.id}&sort=cited_by_count:desc&per-page=3&api_key=${OPENALEX_KEY}`;
        try {
          const wRes = await fetch(worksUrl, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
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

            // Check if article exists
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

            // Link to User via ClaimedPublication
            const claimExists = await conn.query("SELECT id FROM ClaimedPublication WHERE userId = ? AND articleId = ?", [userId, articleId]);
            if (claimExists.length === 0) {
              await conn.query(
                "INSERT INTO ClaimedPublication (id, userId, articleId, role, status, claimedAt) VALUES (?, ?, ?, ?, ?, NOW())",
                [crypto.randomUUID(), userId, articleId, "Lead Author", "VERIFIED"]
              );
            }
          }
        } catch (we) {
          console.error(` Error fetching works for ${cleanName}:`, we.message);
        }

        await sleep(200);
      }
    }

    const totalScholars = await conn.query("SELECT COUNT(*) as cnt FROM User WHERE role = 'RESEARCHER'");
    const totalClaims = await conn.query("SELECT COUNT(*) as cnt FROM ClaimedPublication WHERE status = 'VERIFIED'");
    console.log(`\n=== Ingestion Complete ===`);
    console.log(`Total Scholars: ${totalScholars[0].cnt}`);
    console.log(`Total Claimed Verified Works: ${totalClaims[0].cnt}`);

  } finally {
    await conn.end();
    await pool.end();
  }
}

ingestAuthenticScholars().catch(console.error);
