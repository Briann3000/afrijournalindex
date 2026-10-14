const mariadb = require('mariadb');
const crypto = require('crypto');

async function harvestZeroArticleJournals() {
  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  // Find journals with 0 articles that have ISSN or eISSN
  const journals = await conn.query(`
    SELECT j.id, j.name, j.issn, j.eissn, j.websiteUrl
    FROM Journal j
    LEFT JOIN Article a ON j.id = a.journalId
    WHERE a.id IS NULL AND (j.issn IS NOT NULL OR j.eissn IS NOT NULL)
  `);

  console.log(`Found ${journals.length} zero-article journals with ISSNs to harvest from Crossref.`);

  let totalHarvested = 0;

  for (let i = 0; i < journals.length; i++) {
    const j = journals[i];
    const issnToTry = [j.issn, j.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
    if (issnToTry.length === 0) continue;

    let items = [];
    for (const issn of issnToTry) {
      try {
        const url = `https://api.crossref.org/works?filter=issn:${encodeURIComponent(issn.trim())}&rows=20&sort=published&order=desc`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'AfriJournalIndex/1.0 (mailto:afrijournalindex@gmail.com)' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.message?.items && data.message.items.length > 0) {
            items = data.message.items;
            break;
          }
        }
      } catch (err) {
        // Continue to next
      }
    }

    if (items.length > 0) {
      console.log(`[${i + 1}/${journals.length}] Ingesting ${items.length} real articles for "${j.name}"...`);
      for (const item of items) {
        const title = item.title?.[0]?.trim();
        if (!title) continue;

        const doi = item.DOI?.trim() || null;
        const pdfUrl = item.resource?.primary?.URL || (doi ? `https://doi.org/${doi}` : null);
        const abstract = item.abstract ? item.abstract.replace(/<[^>]+>/g, '').trim() : null;

        let pubDate = new Date();
        if (item.published?.['date-parts']?.[0]) {
          const parts = item.published['date-parts'][0];
          pubDate = new Date(`${parts[0]}-${String(parts[1] || 1).padStart(2, '0')}-${String(parts[2] || 1).padStart(2, '0')}`);
        } else if (item.created?.['date-parts']?.[0]) {
          const parts = item.created['date-parts'][0];
          pubDate = new Date(`${parts[0]}-${String(parts[1] || 1).padStart(2, '0')}-${String(parts[2] || 1).padStart(2, '0')}`);
        }

        const articleId = crypto.randomUUID();

        try {
          await conn.query(`
            INSERT INTO Article (id, title, doi, abstract, pdfUrl, publishDate, journalId, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `, [articleId, title, doi, abstract, pdfUrl, pubDate, j.id]);
          totalHarvested++;
        } catch (insertErr) {
          // Skip duplicate or constraint issue
        }
      }
    }
  }

  console.log(`\nHarvesting completed! Ingested ${totalHarvested} genuine articles directly from Crossref registry.`);
  await conn.end();
  await pool.end();
}

harvestZeroArticleJournals().catch(console.error);
