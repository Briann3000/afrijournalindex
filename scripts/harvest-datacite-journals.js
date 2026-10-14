const mariadb = require('mariadb');
const crypto = require('crypto');

async function harvestDataCiteForZeroJournals() {
  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  // Find journals with 0 articles OR 0 articles with DOIs that have an ISSN/eISSN
  const journals = await conn.query(`
    SELECT j.id, j.name, j.issn, j.eissn
    FROM Journal j
    LEFT JOIN Article a ON j.id = a.journalId AND a.doi IS NOT NULL AND a.doi != ''
    WHERE a.id IS NULL AND (j.issn IS NOT NULL OR j.eissn IS NOT NULL)
  `);

  console.log(`Checking ${journals.length} journals with ISSNs on DataCite registry...`);

  let totalHarvested = 0;

  for (let i = 0; i < journals.length; i++) {
    const j = journals[i];
    const issns = [j.issn, j.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
    if (issns.length === 0) continue;

    for (const issn of issns) {
      try {
        const url = `https://api.datacite.org/dois?query=${encodeURIComponent(issn.trim())}&page[size]=25&sort=-created`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'AfriJournalIndex/1.0 (mailto:afrijournalindex@gmail.com)' }
        });

        if (res.ok) {
          const data = await res.json();
          const items = data.data || [];
          if (items.length > 0) {
            console.log(`[${i + 1}/${journals.length}] Ingested ${items.length} DataCite records for "${j.name}" (${issn})...`);
            for (const item of items) {
              const attrs = item.attributes || {};
              const title = attrs.titles?.[0]?.title?.trim();
              if (!title) continue;

              const doi = attrs.doi?.trim() || null;
              const pdfUrl = attrs.url || (doi ? `https://doi.org/${doi}` : null);
              const abstract = attrs.descriptions?.[0]?.description ? attrs.descriptions[0].description.replace(/<[^>]+>/g, '').trim() : null;
              
              let pubDate = new Date();
              if (attrs.publicationYear) {
                pubDate = new Date(`${attrs.publicationYear}-06-15T00:00:00.000Z`);
              } else if (attrs.created) {
                pubDate = new Date(attrs.created);
              }

              const articleId = crypto.randomUUID();

              try {
                await conn.query(`
                  INSERT INTO Article (id, title, doi, abstract, pdfUrl, publishDate, journalId, createdAt)
                  VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `, [articleId, title, doi, abstract, pdfUrl, pubDate, j.id]);
                totalHarvested++;
              } catch (insertErr) {
                // Skip duplicate
              }
            }
            break; // Successfully harvested for this journal
          }
        }
      } catch (err) {
        // Continue
      }
    }
  }

  console.log(`\nDataCite harvesting completed! Ingested ${totalHarvested} genuine articles directly from DataCite.`);
  await conn.end();
  await pool.end();
}

harvestDataCiteForZeroJournals().catch(console.error);
