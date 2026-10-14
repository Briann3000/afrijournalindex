const mariadb = require('mariadb');
const crypto = require('crypto');

function getDiscipline(name = '', description = '') {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes('medic') || text.includes('health') || text.includes('pharm') || text.includes('nursing') || text.includes('clinic') || text.includes('disease') || text.includes('food') || text.includes('nutrition')) {
    return 'Health Sciences';
  }
  if (text.includes('educat') || text.includes('pedagog') || text.includes('curriculum') || text.includes('teach') || text.includes('school')) {
    if (text.includes('social') || text.includes('humanit') || text.includes('histor') || text.includes('cultur')) {
      return 'Education & Social Sciences';
    }
    return 'Education';
  }
  if (text.includes('social') || text.includes('humanit') || text.includes('histor') || text.includes('cultur') || text.includes('linguist') || text.includes('law') || text.includes('droit') || text.includes('philosoph')) {
    return 'Social Sciences & Humanities';
  }
  if (text.includes('econom') || text.includes('financ') || text.includes('manag') || text.includes('business') || text.includes('account') || text.includes('commerc')) {
    return 'Business & Economics';
  }
  if (text.includes('agri') || text.includes('environ') || text.includes('forest') || text.includes('botan') || text.includes('zoolog') || text.includes('ecolog') || text.includes('veterin')) {
    return 'Agricultural & Environmental Sciences';
  }
  if (text.includes('engin') || text.includes('technol') || text.includes('comput') || text.includes('physic') || text.includes('chem') || text.includes('math') || text.includes('geolog')) {
    return 'Engineering & Physical Sciences';
  }
  return 'Multidisciplinary';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function harvestStandardizedMetrics() {
  console.log('=== Starting Standardized 2-Year Window Metric Harvester ===');
  console.log('Ingesting international 2-year citedness from OpenAlex & verified target-year records\n');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  const journals = await conn.query(`
    SELECT j.id, j.name, j.issn, j.eissn, j.description,
           count(a.id) as localArticleCount,
           count(CASE WHEN a.publishDate >= '2023-01-01' AND a.publishDate <= '2024-12-31' THEN 1 END) as localWindowArticleCount
    FROM Journal j
    LEFT JOIN Article a ON j.id = a.journalId
    GROUP BY j.id
    ORDER BY localArticleCount DESC
  `);

  console.log(`Analyzing ${journals.length} journals in database...`);

  // Clear 2025 reports
  await conn.query('DELETE FROM ImpactFactorReport WHERE year = 2025');

  const journalResults = [];

  for (let i = 0; i < journals.length; i++) {
    const j = journals[i];
    const issns = [j.issn, j.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
    const primaryDisc = getDiscipline(j.name, j.description || '');

    let articleCount = Number(j.localWindowArticleCount) || 0;
    let standardScore = 0.000;
    let citationCount = 0;
    let source = 'local';

    if (issns.length > 0) {
      for (const issn of issns) {
        try {
          const url = `https://api.openalex.org/sources?filter=issn:${encodeURIComponent(issn.trim())}&mailto=admin@afrijournalindex.org`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
          });

          if (res.ok) {
            const data = await res.json();
            const sourceObj = data.results?.[0];
            if (sourceObj) {
              const openAlexMean = sourceObj.summary_stats?.['2yr_mean_citedness'];
              if (openAlexMean !== undefined && openAlexMean !== null) {
                standardScore = parseFloat(Number(openAlexMean).toFixed(3));
                
                // Get 2-year works count from counts_by_year
                const counts = sourceObj.counts_by_year || [];
                const c2024 = counts.find(c => c.year === 2024)?.works_count || 0;
                const c2023 = counts.find(c => c.year === 2023)?.works_count || 0;
                const sumWorks = c2024 + c2023;
                if (sumWorks > 0) {
                  articleCount = sumWorks;
                }
                citationCount = Math.round(standardScore * articleCount);
                source = 'openalex';
                break;
              }
            }
          }
        } catch (err) {
          // Continue to next ISSN or fallback
        }
      }

      // If OpenAlex had no source record, check Crossref with single target year citations
      if (source === 'local') {
        const issnQuery = issns.map(x => x.trim()).join('|');
        try {
          const url = `https://api.crossref.org/works?filter=issn:${issnQuery},from-pub-date:2023-01-01,until-pub-date:2024-12-31&rows=50&select=DOI,is-referenced-by-count`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
          });

          if (res.ok) {
            const data = await res.json();
            const totalWorks = data.message?.['total-results'] || 0;
            const items = data.message?.items || [];

            if (totalWorks > 0) {
              articleCount = totalWorks;
              let sampleCites = 0;
              for (const item of items) {
                sampleCites += (item['is-referenced-by-count'] || 0);
              }

              // Standardized annual citation factor (annual rate is approx 1/3.0 of 3-year cumulative crossref rate)
              const rawAvg = items.length > 0 ? (sampleCites / items.length) : 0;
              const standardizedAnnualRate = rawAvg / 3.0;
              standardScore = parseFloat(standardizedAnnualRate.toFixed(3));
              citationCount = Math.round(standardScore * articleCount);
              source = 'crossref-normalized';
            }
          }
        } catch (err) {
          // Fall back to local
        }
      }
    }

    const regionalScore = parseFloat((standardScore * 1.15).toFixed(3));

    journalResults.push({
      id: j.id,
      name: j.name,
      articleCount,
      citationCount,
      standardScore,
      regionalScore,
      primaryDiscipline: primaryDisc
    });

    if ((i + 1) % 50 === 0 || standardScore > 0 || j.name.includes('ARJESS')) {
      console.log(`[${i + 1}/${journals.length}] ${j.name.substring(0, 50)}: Articles=${articleCount}, Citations=${citationCount}, Score=${standardScore} (${source})`);
    }

    if (issns.length > 0 && (i + 1) % 15 === 0) {
      await sleep(100);
    }
  }

  // Group by discipline and assign relative quartiles & ranks
  console.log('\nAssigning relative quartiles and discipline ranks...');
  const disciplineGroups = {};
  for (const item of journalResults) {
    const disc = item.primaryDiscipline;
    if (!disciplineGroups[disc]) disciplineGroups[disc] = [];
    disciplineGroups[disc].push(item);
  }

  const reportsToInsert = [];

  for (const [disc, items] of Object.entries(disciplineGroups)) {
    items.sort((a, b) => b.standardScore - a.standardScore);
    const totalInDisc = items.length;
    const activeItems = items.filter(x => x.standardScore > 0);
    const activeCount = activeItems.length;

    const q1Cut = Math.max(1, Math.ceil(activeCount * 0.25));
    const q2Cut = Math.max(q1Cut + 1, Math.ceil(activeCount * 0.50));
    const q3Cut = Math.max(q2Cut + 1, Math.ceil(activeCount * 0.75));

    items.forEach((item, idx) => {
      const rank = idx + 1;
      let quartile = 'Unrated';

      if (item.standardScore > 0 && activeCount > 0) {
        if (rank <= q1Cut) quartile = 'Q1';
        else if (rank <= q2Cut) quartile = 'Q2';
        else if (rank <= q3Cut) quartile = 'Q3';
        else quartile = 'Q4';
      }

      const reportId = crypto.randomUUID();
      reportsToInsert.push([
        reportId,
        2025,
        item.standardScore,
        item.regionalScore,
        item.citationCount,
        item.articleCount,
        item.id,
        item.standardScore > 0 ? rank : null,
        disc,
        quartile,
        totalInDisc,
        new Date()
      ]);
    });
  }

  console.log(`\nPersisting ${reportsToInsert.length} standardized reports into database...`);
  const chunkSize = 200;
  for (let i = 0; i < reportsToInsert.length; i += chunkSize) {
    const chunk = reportsToInsert.slice(i, i + chunkSize);
    await conn.batch(`
      INSERT INTO ImpactFactorReport (
        id, year, standardScore, regionalScore, citationCount, articleCount,
        journalId, disciplineRank, primaryDiscipline, quartile, totalInDiscipline, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, chunk);
  }

  console.log('\n=== Standardized Metrics Calculation Complete! ===');

  const sampleReports = await conn.query(`
    SELECT j.name, r.standardScore, r.citationCount, r.articleCount, r.quartile, r.disciplineRank, r.primaryDiscipline
    FROM ImpactFactorReport r
    JOIN Journal j ON r.journalId = j.id
    WHERE r.year = 2025
    ORDER BY r.standardScore DESC
    LIMIT 10
  `);
  console.log('\nTop 10 Ranked Journals for 2025 (Standardized):');
  console.table(sampleReports);

  const keyJournals = await conn.query(`
    SELECT j.name, r.standardScore, r.citationCount, r.articleCount, r.quartile
    FROM ImpactFactorReport r
    JOIN Journal j ON r.journalId = j.id
    WHERE (j.name LIKE '%Alexandria Engineering%' OR j.name LIKE '%Electrical Systems and Information%' OR j.name LIKE '%ARJESS%') AND r.year = 2025
  `);
  console.log('\nKey Verified Journals (Alexandria, JESIT, ARJESS):');
  console.table(keyJournals);

  await conn.end();
  await pool.end();
}

harvestStandardizedMetrics().catch(err => {
  console.error('Fatal Standardized Harvester Error:', err);
  process.exit(1);
});
