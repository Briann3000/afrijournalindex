const mariadb = require('mariadb');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fixTop300Anomalies() {
  console.log('=== Step 1: Fixing Identified 44 Anomalies in Top 300 ===\n');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    // 1. Fetch the exact anomalous journals
    const anomalies = await conn.query(`
      SELECT r.id as reportId, r.standardScore, r.citationCount, r.articleCount, j.id as journalId, j.name, j.issn, j.eissn
      FROM ImpactFactorReport r
      JOIN Journal j ON r.journalId = j.id
      WHERE r.year = 2025 
        AND (
          r.standardScore > 15.0 
          OR (r.standardScore > 0 AND (r.citationCount = 0 OR r.articleCount = 0))
          OR (r.standardScore > 5.0 AND r.articleCount < 10)
        )
      ORDER BY r.standardScore DESC
    `);

    console.log(`Found ${anomalies.length} journals to recalculate from actual published works...`);

    let fixedCount = 0;

    for (let i = 0; i < anomalies.length; i++) {
      const item = anomalies[i];
      const issns = [item.issn, item.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
      
      let sourceId = null;

      if (issns.length > 0) {
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
      }

      let realWorksCount = 0;
      let realCites = 0;
      let realScore = 0.000;

      if (sourceId) {
        try {
          const wUrl = `https://api.openalex.org/works?filter=primary_location.source.id:${sourceId},publication_year:2023|2024&per_page=100&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;
          const wRes = await fetch(wUrl, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
          });

          if (wRes.ok) {
            const wData = await wRes.json();
            realWorksCount = wData.meta?.count || 0;
            const works = wData.results || [];
            
            if (realWorksCount > 0) {
              realCites = works.reduce((sum, w) => sum + (w.cited_by_count || 0), 0);
              realScore = parseFloat((realCites / realWorksCount).toFixed(3));
            }
          }
        } catch (err) {
          console.error(`Error querying works for ${item.name}:`, err.message);
        }
      }

      // Assign authentic Global Quartile
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
      `, [realScore, regionalScore, realCites, realWorksCount, quartile, item.reportId]);

      fixedCount++;
      console.log(`[${fixedCount}/${anomalies.length}] ${item.name.substring(0, 42)}: ${item.standardScore} -> ${realScore} (${realCites} cites / ${realWorksCount} works, ${quartile})`);

      await sleep(100);
    }

    console.log('\n=== Recalculating Discipline Rankings for all journals ===');
    const allDiscs = await conn.query(`SELECT DISTINCT primaryDiscipline FROM ImpactFactorReport WHERE year = 2025`);
    for (const d of allDiscs) {
      const discName = d.primaryDiscipline || 'Multidisciplinary';
      const discReports = await conn.query(`
        SELECT id, standardScore 
        FROM ImpactFactorReport 
        WHERE year = 2025 AND primaryDiscipline = ?
        ORDER BY standardScore DESC
      `, [discName]);

      const totalInDisc = discReports.length;
      for (let idx = 0; idx < discReports.length; idx++) {
        await conn.query(`
          UPDATE ImpactFactorReport 
          SET disciplineRank = ?, totalInDiscipline = ? 
          WHERE id = ?
        `, [idx + 1, totalInDisc, discReports[idx].id]);
      }
    }

    console.log('\n=== Top 20 Leaderboard Now ===');
    const top20 = await conn.query(`
      SELECT r.disciplineRank as rank, r.standardScore, r.citationCount, r.articleCount, r.quartile, j.name 
      FROM ImpactFactorReport r 
      JOIN Journal j ON r.journalId = j.id 
      WHERE r.year = 2025 
      ORDER BY r.standardScore DESC 
      LIMIT 20
    `);
    console.table(top20);

  } finally {
    conn.release();
    await pool.end();
  }
}

fixTop300Anomalies().catch(console.error);
