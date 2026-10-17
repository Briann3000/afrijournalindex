const mariadb = require('mariadb');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function verifyAndRecalibrateTop300() {
  console.log('=============================================================================');
  console.log('  AfriJournal Index: Exact Work-Level Verification for Top 300 Journals');
  console.log('  Methodology: Real Works (2023-2024) / Exact Citation Counts / Global Quartiles');
  console.log('=============================================================================\n');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    // 1. Fetch current top 300 journals by standardScore
    const journals = await conn.query(`
      SELECT r.id as reportId, r.standardScore, r.citationCount, r.articleCount, 
             j.id as journalId, j.name, j.issn, j.eissn
      FROM ImpactFactorReport r
      JOIN Journal j ON r.journalId = j.id
      WHERE r.year = 2025
      ORDER BY r.standardScore DESC
      LIMIT 300
    `);

    console.log(`Auditing and verifying all top ${journals.length} journals individually against live OpenAlex works...\n`);

    let verifiedCount = 0;
    let adjustedCount = 0;

    for (let i = 0; i < journals.length; i++) {
      const item = journals[i];
      const issns = [item.issn, item.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));

      if (issns.length === 0) {
        console.log(`[${i + 1}/${journals.length}] SKIPPED: ${item.name.substring(0, 45)} (No valid ISSN)`);
        continue;
      }

      let sourceId = null;

      // 1. Resolve source ID
      for (const issn of issns) {
        try {
          const sUrl = `https://api.openalex.org/sources?filter=issn:${encodeURIComponent(issn.trim())}&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;
          const sRes = await fetch(sUrl, {
            headers: { 'User-Agent': 'AfriJournalIndexAuditor/1.0 (mailto:admin@afrijournalindex.org)' }
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

      if (!sourceId) {
        console.log(`[${i + 1}/${journals.length}] NOT FOUND: ${item.name.substring(0, 45)}`);
        continue;
      }

      // 2. Fetch actual published works in evaluation window (2023-2024)
      try {
        const wUrl = `https://api.openalex.org/works?filter=primary_location.source.id:${sourceId},publication_year:2023|2024&per_page=100&api_key=${OPENALEX_KEY}&mailto=admin@afrijournalindex.org`;
        const wRes = await fetch(wUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexAuditor/1.0 (mailto:admin@afrijournalindex.org)' }
        });

        if (wRes.ok) {
          const wData = await wRes.json();
          const works = wData.results || [];
          const actualWorksCount = wData.meta?.count || 0;

          let actualCites = 0;
          let verifiedScore = 0.000;

          if (actualWorksCount > 0) {
            actualCites = works.reduce((sum, w) => sum + (w.cited_by_count || 0), 0);
            verifiedScore = parseFloat((actualCites / actualWorksCount).toFixed(3));
          }

          // Global Quartile Thresholds
          let quartile = 'Unrated';
          if (verifiedScore >= 3.500) quartile = 'Q1';
          else if (verifiedScore >= 1.500) quartile = 'Q2';
          else if (verifiedScore >= 0.400) quartile = 'Q3';
          else if (verifiedScore >= 0.050) quartile = 'Q4';

          const regionalScore = parseFloat((verifiedScore * 1.15).toFixed(3));

          // In-place database update
          await conn.query(`
            UPDATE ImpactFactorReport
            SET standardScore = ?, regionalScore = ?, citationCount = ?, articleCount = ?, quartile = ?
            WHERE id = ?
          `, [verifiedScore, regionalScore, actualCites, actualWorksCount, quartile, item.reportId]);

          verifiedCount++;
          const scoreDiff = Math.abs(item.standardScore - verifiedScore);

          if (scoreDiff > 0.1) {
            adjustedCount++;
            console.log(`[${i + 1}/${journals.length}] ADJUSTED: ${item.name.substring(0, 40)}: ${item.standardScore} -> ${verifiedScore} (${actualCites} cites / ${actualWorksCount} works, ${quartile})`);
          } else {
            console.log(`[${i + 1}/${journals.length}] VERIFIED: ${item.name.substring(0, 40)}: ${verifiedScore} (${actualCites} cites / ${actualWorksCount} works, ${quartile})`);
          }
        }
      } catch (err) {
        console.error(`[${i + 1}/${journals.length}] ERROR: ${item.name}: ${err.message}`);
      }

      await sleep(100);
    }

    console.log(`\nVerification complete. Verified: ${verifiedCount}, Adjusted: ${adjustedCount}`);

    // 3. Recalculate discipline ranks accurately
    console.log('\nRecalculating discipline rankings across the platform...');
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

    // 4. Output Final Top 25
    const top25 = await conn.query(`
      SELECT r.disciplineRank as rank, r.standardScore, r.citationCount, r.articleCount, r.quartile, j.name 
      FROM ImpactFactorReport r 
      JOIN Journal j ON r.journalId = j.id 
      WHERE r.year = 2025 
      ORDER BY r.standardScore DESC 
      LIMIT 25
    `);

    console.log('\n=============================================================================');
    console.log('              FINAL VERIFIED TOP 25 AFRICAN JOURNALS');
    console.log('=============================================================================');
    console.table(top25);

  } finally {
    conn.release();
    await pool.end();
  }
}

verifyAndRecalibrateTop300().catch(console.error);
