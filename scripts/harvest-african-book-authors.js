const mariadb = require('mariadb');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function harvestAfricanBookAuthors() {
  console.log("=== INGESTING PROMINENT AFRICAN BOOK AUTHORS & MONOGRAPHIC SCHOLARS ===");

  const seedPath = path.join(__dirname, 'data', 'african-book-scholars.json');
  if (!fs.existsSync(seedPath)) {
    console.error("Seed file not found at:", seedPath);
    return;
  }

  const seedScholars = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  console.log(`Loaded ${seedScholars.length} curated African book authors & intellectuals.`);

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    // 1. Ensure an official monograph & academic book series venue exists in Journal table
    let [bookVenue] = await conn.query("SELECT id FROM journal WHERE name LIKE '%Monograph%' OR name LIKE '%Book Series%' LIMIT 1");
    if (!bookVenue) {
      const venueId = crypto.randomUUID();
      await conn.query(`
        INSERT INTO journal (id, name, publisherName, country, frequency, isIndexed, activeTier, qualityGrade, createdAt, updatedAt)
        VALUES (?, 'African Monographs & Academic Book Series', 'CODESRIA & Pan-African University Presses', 'Pan-African', 'Annual', 1, 'PREMIUM', 'A+', NOW(), NOW())
      `, [venueId]);
      bookVenue = { id: venueId };
      console.log("Created official venue: 'African Monographs & Academic Book Series'");
    }

    let successCount = 0;
    let skippedCount = 0;
    let totalBooksLinked = 0;

    for (const scholar of seedScholars) {
      console.log(`\nProcessing: ${scholar.name} (${scholar.country})...`);

      // 2. Query OpenAlex Author Profile
      const authorUrl = `https://api.openalex.org/authors/${scholar.openAlexId.replace('https://openalex.org/', '')}?api_key=${OPENALEX_KEY}`;
      let authorData = null;

      try {
        const res = await fetch(authorUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/4.0 (mailto:admin@afrijournalindexing.org)' }
        });
        if (res.ok) {
          authorData = await res.json();
        }
      } catch (err) {
        console.error(`  Error fetching OpenAlex for ${scholar.name}:`, err.message);
      }

      await sleep(250); // Be respectful to OpenAlex rate limits

      const totalCitations = authorData?.cited_by_count || 0;
      const hIndex = authorData?.summary_stats?.h_index || 0;
      const i10Index = authorData?.summary_stats?.i10_index || 0;
      const orcid = authorData?.orcid ? authorData.orcid.replace("https://orcid.org/", "").trim() : null;

      const disciplineTag = `[Discipline: ${scholar.broadDiscipline}]`;
      const interestsTag = scholar.subDisciplines?.length ? `[Interests: ${scholar.subDisciplines.join(", ")}]` : "";
      const scholarTypeTag = `[Scholar Type: ${scholar.scholarType || "Monograph & Book Author"}]`;
      const bio = `${scholar.name} is a distinguished scholar from ${scholar.country}, affiliated with ${scholar.institution}. ${disciplineTag} ${interestsTag} ${scholarTypeTag}`.trim();

      // Clean, unique email for directory presence
      const emailSlug = scholar.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
      const email = `${emailSlug}@afrijournalindexing.org`;

      // 3. Upsert into User table
      let userId;
      const existingUser = await conn.query("SELECT id FROM user WHERE openAlexId = ? OR orcid = ? OR name = ?", [scholar.openAlexId, orcid, scholar.name]);

      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        await conn.query(`
          UPDATE user 
          SET institution = ?, bio = ?, totalCitations = ?, hIndex = ?, i10Index = ?, 
              googleScholarId = ?, metricsSource = ?, updatedAt = NOW()
          WHERE id = ?
        `, [
          scholar.institution,
          bio,
          totalCitations,
          hIndex,
          i10Index,
          scholar.googleScholarId || null,
          scholar.googleScholarId ? "GOOGLE_SCHOLAR" : "OPENALEX",
          userId
        ]);
        console.log(`  Updated existing profile: ${scholar.name} (Citations: ${totalCitations}, h-index: ${hIndex})`);
      } else {
        userId = crypto.randomUUID();
        const dummyHash = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr";
        await conn.query(`
          INSERT INTO user (
            id, email, passwordHash, name, role, orcid, institution, bio,
            totalCitations, hIndex, i10Index, googleScholarId, openAlexId,
            metricsSource, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, 'RESEARCHER', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          userId,
          email,
          dummyHash,
          scholar.name,
          orcid,
          scholar.institution,
          bio,
          totalCitations,
          hIndex,
          i10Index,
          scholar.googleScholarId || null,
          scholar.openAlexId,
          scholar.googleScholarId ? "GOOGLE_SCHOLAR" : "OPENALEX"
        ]);
        console.log(`  Created new profile: ${scholar.name} (Citations: ${totalCitations}, h-index: ${hIndex})`);
      }

      successCount++;

      // 4. Fetch Top Genuine Books & Works by this Author from OpenAlex
      const worksUrl = `https://api.openalex.org/works?filter=author.id:${scholar.openAlexId.replace('https://openalex.org/', '')}&sort=cited_by_count:desc&per-page=5&api_key=${OPENALEX_KEY}`;
      try {
        const worksRes = await fetch(worksUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/4.0 (mailto:admin@afrijournalindexing.org)' }
        });
        if (worksRes.ok) {
          const worksData = await worksRes.json();
          const works = worksData.results || [];

          for (const work of works) {
            const title = work.title || "Untitled Scholarly Work";
            const doi = work.doi ? work.doi.replace("https://doi.org/", "").trim() : `openalex-${work.id.replace('https://openalex.org/', '')}`;
            const publishDate = work.publication_date ? new Date(work.publication_date) : new Date(`${work.publication_year || 2020}-01-01`);
            const workCitations = work.cited_by_count || 0;
            const landingUrl = work.doi || work.id;

            // Upsert Article
            let articleId;
            const existingArt = await conn.query("SELECT id FROM article WHERE doi = ?", [doi]);
            if (existingArt.length > 0) {
              articleId = existingArt[0].id;
              await conn.query("UPDATE article SET citationCount = ? WHERE id = ?", [workCitations, articleId]);
            } else {
              articleId = crypto.randomUUID();
              await conn.query(`
                INSERT INTO article (id, title, doi, url, publishDate, citationCount, journalId, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
              `, [articleId, title, doi, landingUrl, publishDate, workCitations, bookVenue.id]);
            }

            // Link ClaimedPublication
            const existingClaim = await conn.query("SELECT id FROM claimedpublication WHERE userId = ? AND articleId = ?", [userId, articleId]);
            if (existingClaim.length === 0) {
              await conn.query(`
                INSERT INTO claimedpublication (id, userId, articleId, role, status, claimedAt)
                VALUES (?, ?, ?, 'Lead Author', 'VERIFIED', NOW())
              `, [crypto.randomUUID(), userId, articleId]);
              totalBooksLinked++;
            }
          }
          console.log(`    Linked top ${works.length} publications/books.`);
        }
      } catch (err) {
        console.error(`    Error fetching works for ${scholar.name}:`, err.message);
      }

      await sleep(200);
    }

    console.log("\n=== HARVEST COMPLETE ===");
    console.log(`Scholars Processed: ${successCount}`);
    console.log(`Total Genuine Works/Books Linked: ${totalBooksLinked}`);

  } finally {
    conn.release();
    pool.end();
  }
}

harvestAfricanBookAuthors().catch(console.error);
