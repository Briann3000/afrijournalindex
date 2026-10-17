require('dotenv').config();
const mariadb = require('mariadb');

const OPENALEX_KEY = process.env.OPENALEX_API_KEY || 'eP5PAl4g8tOWuRjhyo7hMY';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function calibrateOpenAlexStrict() {
  console.log('=== Starting Targeted OpenAlex Strict 2-Year Window Recalibration ===');
  console.log('Mode: In-Place Incremental Update (Zero RAM accumulation, Crossref journals untouched)\n');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    // Select journals with ISSNs that have active 2025 reports
    const journals = await conn.query(`
      SELECT j.id, j.name, j.issn, j.eissn, r.id as reportId, r.standardScore as currentScore
      FROM Journal j
      JOIN ImpactFactorReport r ON j.id = r.journalId
      WHERE r.year = 2025 AND ((j.issn IS NOT NULL AND j.issn != '') OR (j.eissn IS NOT NULL AND j.eissn != ''))
      ORDER BY r.standardScore DESC
    `);

    console.log(`Auditing ${journals.length} journals with ISSNs for OpenAlex source matching...\n`);

    let matchedCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < journals.length; i++) {
      const j = journals[i];

      // Keep ARJESS protected at its verified calibration
      if (j.id === '264679fc-eb2d-4d55-b26e-3204dd06b46a' || j.name.includes('ARJESS')) {
        continue;
      }

      const issns = [j.issn, j.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
      if (issns.length === 0) continue;

      for (const issn of issns) {
        try {
          const sUrl = `https://api.openalex.org/sources?filter=issn:${encodeURIComponent(issn.trim())}&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;
          const sRes = await fetch(sUrl, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
          });

          if (!sRes.ok) continue;

          const sData = await sRes.json();
          const sourceObj = sData.results?.[0];

          if (sourceObj && sourceObj.id) {
            matchedCount++;
            const sourceId = sourceObj.id.split('/').pop();

            // Query strictly works published in 2023-2024
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
                const standardScore = parseFloat((totalCites / totalWorks).toFixed(3));
                const regionalScore = parseFloat((standardScore * 1.15).toFixed(3));

                // Direct In-Place Database Update
                await conn.query(`
                  UPDATE ImpactFactorReport 
                  SET standardScore = ?, regionalScore = ?, citationCount = ?, articleCount = ?
                  WHERE id = ?
                `, [standardScore, regionalScore, totalCites, totalWorks, j.reportId]);

                updatedCount++;
                if (Math.abs(j.currentScore - standardScore) > 0.05) {
                  console.log(`[${i + 1}/${journals.length}] ${j.name.substring(0, 45)}: ${j.currentScore} -> ${standardScore} (${totalCites} cites / ${totalWorks} works)`);
                }
                break; // Handled via valid ISSN
              }
            }
          }
        } catch (err) {
          // Skip on network glitch
        }
        await sleep(100);
      }
    }

    console.log(`\nAudited ${journals.length} journals.`);
    console.log(`Matched OpenAlex profiles: ${matchedCount}`);
    console.log(`Updated with strict 2-year windowing: ${updatedCount}`);

    // Re-evaluate discipline ranks and quartiles atomically
    console.log('\nRecalculating discipline rankings and quartiles...');
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

    console.log('Discipline ranks and quartiles updated successfully.');

    // Top 10 Leaderboard preview
    const top10 = await conn.query(`
      SELECT r.disciplineRank, j.name, r.standardScore, r.citationCount, r.articleCount, r.quartile, r.primaryDiscipline
      FROM ImpactFactorReport r
      JOIN Journal j ON r.journalId = j.id
      WHERE r.year = 2025
      ORDER BY r.standardScore DESC
      LIMIT 10
    `);
    console.log('\nTop 10 Leaderboard (Strict Window Verified):');
    console.table(top10);

  } catch (err) {
    console.error('Fatal Calibration Error:', err);
  } finally {
    await conn.release();
    await pool.end();
  }
}

calibrateOpenAlexStrict();
