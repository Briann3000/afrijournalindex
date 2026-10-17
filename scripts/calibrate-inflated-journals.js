require('dotenv').config();
const mariadb = require('mariadb');

const OPENALEX_KEY = process.env.OPENALEX_API_KEY || 'eP5PAl4g8tOWuRjhyo7hMY';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function calibrateInflatedJournals() {
  console.log('=== Calibrating 35 Inflated Journals to Strict 2-Year Window ===');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    const inflated = await conn.query(`
      SELECT r.id as reportId, r.journalId, j.name, j.issn, j.eissn, r.standardScore as oldScore, r.primaryDiscipline
      FROM ImpactFactorReport r
      JOIN Journal j ON r.journalId = j.id
      WHERE r.year = 2025 AND r.standardScore > 10
      ORDER BY r.standardScore DESC
    `);

    console.log(`Found ${inflated.length} journals to calibrate strictly.\n`);

    for (let i = 0; i < inflated.length; i++) {
      const item = inflated[i];
      const issns = [item.issn, item.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
      
      let newScore = null;
      let newCitations = 0;
      let newWorks = 0;

      if (issns.length > 0) {
        for (const issn of issns) {
          try {
            const sUrl = `https://api.openalex.org/sources?filter=issn:${encodeURIComponent(issn.trim())}&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;
            const sRes = await fetch(sUrl, {
              headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
            });

            if (sRes.ok) {
              const sData = await sRes.json();
              const sourceObj = sData.results?.[0];
              if (sourceObj) {
                const sourceId = sourceObj.id.split('/').pop();
                const wUrl = `https://api.openalex.org/works?filter=primary_location.source.id:${sourceId},publication_year:2023|2024&per_page=100&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;
                const wRes = await fetch(wUrl, {
                  headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
                });

                if (wRes.ok) {
                  const wData = await wRes.json();
                  const totalWorks = wData.meta?.count || 0;
                  const worksList = wData.results || [];
                  const totalCites = worksList.reduce((acc, w) => acc + (w.cited_by_count || 0), 0);

                  if (totalWorks > 0) {
                    newWorks = totalWorks;
                    newCitations = totalCites;
                    newScore = parseFloat((newCitations / newWorks).toFixed(3));
                    break;
                  }
                }
              }
            }
          } catch (e) {
            // continue
          }
          await sleep(150);
        }
      }

      // If strict works lookup succeeded, update the report directly
      if (newScore !== null) {
        const regionalScore = parseFloat((newScore * 1.15).toFixed(3));
        await conn.query(`
          UPDATE ImpactFactorReport 
          SET standardScore = ?, regionalScore = ?, citationCount = ?, articleCount = ?
          WHERE id = ?
        `, [newScore, regionalScore, newCitations, newWorks, item.reportId]);

        console.log(`[${i + 1}/${inflated.length}] ${item.name.substring(0, 45)}: Old=${item.oldScore} -> New=${newScore} (${newCitations} cites / ${newWorks} works)`);
      } else {
        console.log(`[${i + 1}/${inflated.length}] ${item.name.substring(0, 45)}: Skipped (no strict window data)`);
      }
    }

    // Now re-calculate discipline rankings and quartiles across all 2025 reports
    console.log('\nRe-evaluating discipline ranks and quartiles...');
    const allReports = await conn.query(`
      SELECT id, standardScore, primaryDiscipline 
      FROM ImpactFactorReport 
      WHERE year = 2025
    `);

    const discGroups = {};
    allReports.forEach(r => {
      const d = r.primaryDiscipline || 'Multidisciplinary';
      if (!discGroups[d]) discGroups[d] = [];
      discGroups[d].push(r);
    });

    for (const [disc, items] of Object.entries(discGroups)) {
      items.sort((a, b) => b.standardScore - a.standardScore);
      const activeCount = items.filter(x => x.standardScore > 0).length;
      const totalInDisc = items.length;

      const q1Cut = Math.max(1, Math.ceil(activeCount * 0.25));
      const q2Cut = Math.max(q1Cut + 1, Math.ceil(activeCount * 0.50));
      const q3Cut = Math.max(q2Cut + 1, Math.ceil(activeCount * 0.75));

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const rank = idx + 1;
        let quartile = 'Unrated';

        if (item.standardScore > 0 && activeCount > 0) {
          if (rank <= q1Cut) quartile = 'Q1';
          else if (rank <= q2Cut) quartile = 'Q2';
          else if (rank <= q3Cut) quartile = 'Q3';
          else quartile = 'Q4';
        }

        await conn.query(`
          UPDATE ImpactFactorReport 
          SET disciplineRank = ?, quartile = ?, totalInDiscipline = ?
          WHERE id = ?
        `, [item.standardScore > 0 ? rank : null, quartile, totalInDisc, item.id]);
      }
    }

    console.log('\n=== Calibration and Re-Ranking Complete! ===');

  } catch (err) {
    console.error('Error during calibration:', err);
  } finally {
    await conn.release();
    await pool.end();
  }
}

calibrateInflatedJournals();
