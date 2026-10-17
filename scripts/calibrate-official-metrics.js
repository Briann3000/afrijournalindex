const mariadb = require('mariadb');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function calibrateAndIngest() {
  console.log('=== Step 1: Calibrating Metrics with Official OpenAlex 2-Year Window & Global Quartiles ===\n');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    // 1. Fetch all journals with ISSNs or existing reports
    const journals = await conn.query(`
      SELECT j.id, j.name, j.issn, j.eissn, r.id as reportId, r.standardScore, r.citationCount, r.articleCount
      FROM Journal j
      LEFT JOIN ImpactFactorReport r ON j.id = r.journalId AND r.year = 2025
      WHERE j.issn IS NOT NULL OR j.eissn IS NOT NULL
    `);

    console.log(`Found ${journals.length} journals to evaluate against OpenAlex registry...`);

    let updatedCount = 0;
    const startIndex = 1027; // Resuming from journal 1028

    for (let i = startIndex; i < journals.length; i++) {
      const j = journals[i];
      const issns = [j.issn, j.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
      if (issns.length === 0) continue;

      let sourceMatched = false;

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
            sourceMatched = true;
            const twoYrCitedness = sourceObj.summary_stats ? sourceObj.summary_stats['2yr_mean_citedness'] : null;
            const countsByYear = sourceObj.counts_by_year || [];

            // Window: 2023 and 2024
            const w2024 = countsByYear.find(c => c.year === 2024) || { works_count: 0, cited_by_count: 0 };
            const w2023 = countsByYear.find(c => c.year === 2023) || { works_count: 0, cited_by_count: 0 };
            const windowArticles = (w2024.works_count || 0) + (w2023.works_count || 0);

            // Citations received in evaluation period (2024 & 2025)
            const c2025 = countsByYear.find(c => c.year === 2025) || { cited_by_count: 0 };
            const windowCitations = (c2025.cited_by_count || 0) + (w2024.cited_by_count || 0);

            let score = 0;
            if (twoYrCitedness !== null && twoYrCitedness !== undefined) {
              score = parseFloat(twoYrCitedness.toFixed(3));
            } else if (windowArticles > 0) {
              score = parseFloat((windowCitations / windowArticles).toFixed(3));
            }

            // Only zero if no publications in window
            if (windowArticles === 0 && (!twoYrCitedness || twoYrCitedness === 0)) {
              score = 0;
            }

            const regionalScore = parseFloat((score * 1.15).toFixed(3));

            // Global Quartile Standard
            let quartile = 'Unrated';
            if (score >= 3.500) quartile = 'Q1';
            else if (score >= 1.500) quartile = 'Q2';
            else if (score >= 0.400) quartile = 'Q3';
            else if (score >= 0.050) quartile = 'Q4';

            if (j.reportId) {
              await conn.query(`
                UPDATE ImpactFactorReport
                SET standardScore = ?, regionalScore = ?, citationCount = ?, articleCount = ?, quartile = ?
                WHERE id = ?
              `, [score, regionalScore, windowCitations, windowArticles, quartile, j.reportId]);
            } else {
              const crypto = require('crypto');
              await conn.query(`
                INSERT INTO ImpactFactorReport (id, year, standardScore, regionalScore, citationCount, articleCount, journalId, quartile, createdAt)
                VALUES (?, 2025, ?, ?, ?, ?, ?, ?, NOW())
              `, [crypto.randomUUID(), score, regionalScore, windowCitations, windowArticles, j.id, quartile]);
            }

            updatedCount++;
            if ((i + 1) % 50 === 0 || score > 2.0 || j.name.includes('ARJESS') || j.name.includes('Technology')) {
              console.log(`[${i + 1}/${journals.length}] ${j.name.substring(0, 45)}: Score=${score} (${windowCitations} cites / ${windowArticles} works, ${quartile})`);
            }
            break;
          }
        } catch (err) {
          // Skip on network glitch
        }
        await sleep(80);
      }
    }

    console.log(`\nUpdated ${updatedCount} journals with authentic 2-year citedness and global quartiles.`);

    // Check ARJESS specifically
    const arjessCheck = await conn.query(`SELECT standardScore, citationCount, articleCount, quartile FROM ImpactFactorReport WHERE journalId = '264679fc-eb2d-4d55-b26e-3204dd06b46a'`);
    console.log('ARJESS Current Status:', arjessCheck[0]);

  } finally {
    conn.release();
    await pool.end();
  }
}

calibrateAndIngest().catch(console.error);
