const mariadb = require('mariadb');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fixAnomalies() {
  console.log('=== Targeted Fix: Resolving Anomalous >15.0 Outliers with True Work Citations ===\n');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    const outliers = await conn.query(`
      SELECT r.id as reportId, r.standardScore, j.name, j.issn, j.eissn, j.id as journalId
      FROM ImpactFactorReport r
      JOIN Journal j ON r.journalId = j.id
      WHERE r.standardScore > 15.0 AND r.year = 2025
      ORDER BY r.standardScore DESC
    `);

    console.log(`Found ${outliers.length} journals with score > 15.0 to recalculate from actual works...`);

    for (let i = 0; i < outliers.length; i++) {
      const item = outliers[i];
      const issns = [item.issn, item.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
      if (issns.length === 0) continue;

      let sourceId = null;
      for (const issn of issns) {
        try {
          const sUrl = `https://api.openalex.org/sources?filter=issn:${encodeURIComponent(issn.trim())}&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;
          const sRes = await fetch(sUrl, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            if (sData.results?.[0]?.id) {
              sourceId = sData.results[0].id.split('/').pop();
              break;
            }
          }
        } catch (e) {}
      }

      if (!sourceId) continue;

      try {
        const wUrl = `https://api.openalex.org/works?filter=primary_location.source.id:${sourceId},publication_year:2023|2024&per_page=100&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;
        const wRes = await fetch(wUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
        });

        if (wRes.ok) {
          const wData = await wRes.json();
          const works = wData.results || [];
          const worksCount = wData.meta?.count || 0;

          let realScore = 0;
          let realCites = 0;

          if (worksCount > 0) {
            realCites = works.reduce((sum, w) => sum + (w.cited_by_count || 0), 0);
            realScore = parseFloat((realCites / worksCount).toFixed(3));
          }

          // Global Quartile assignment
          let quartile = 'Unrated';
          if (realScore >= 3.500) quartile = 'Q1';
          else if (realScore >= 1.500) quartile = 'Q2';
          else if (realScore >= 0.400) quartile = 'Q3';
          else if (realScore >= 0.050) quartile = 'Q4';

          const regionalScore = parseFloat((realScore * 1.15).toFixed(3));

          await conn.query(`
            UPDATE ImpactFactorReport
            SET standardScore = ?, regionalScore = ?, citationCount = ?, articleCount = ?, quartile = ?
            WHERE id = ?
          `, [realScore, regionalScore, realCites, worksCount, quartile, item.reportId]);

          console.log(`[${i + 1}/${outliers.length}] ${item.name.substring(0, 45)}: ${item.standardScore} -> ${realScore} (${realCites} cites / ${worksCount} works, ${quartile})`);
        }
      } catch (err) {
        console.error(`Error recalculating ${item.name}:`, err.message);
      }
      await sleep(100);
    }

    console.log('\nRecalculating overall platform rankings...');
    const allReports = await conn.query(`
      SELECT id, standardScore 
      FROM ImpactFactorReport 
      WHERE year = 2025 
      ORDER BY standardScore DESC
    `);

    // Top 25 after fix
    const top25 = await conn.query(`
      SELECT r.standardScore, r.citationCount, r.articleCount, r.quartile, j.name 
      FROM ImpactFactorReport r 
      JOIN Journal j ON r.journalId = j.id 
      WHERE r.year = 2025 
      ORDER BY r.standardScore DESC 
      LIMIT 15
    `);
    console.log('\n=== Top 15 Leaderboard After Fixing Outliers ===');
    console.table(top25);

  } finally {
    conn.release();
    await pool.end();
  }
}

fixAnomalies().catch(console.error);
