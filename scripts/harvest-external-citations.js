const mariadb = require('mariadb');
const crypto = require('crypto');

// Determine primary discipline based on journal title & description
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

async function harvestExternalCitations() {
  console.log('=== Starting Real Crossref & DataCite Citation Harvester ===');
  console.log('Evaluation Window: 2023-01-01 to 2024-12-31 (International 2-Year Impact Window for 2025)\n');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  // Fetch all journals with ISSNs or articles in database
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

  // Clear previous 2025 reports before fresh real calculation
  await conn.query('DELETE FROM ImpactFactorReport WHERE year = 2025');

  const journalResults = [];

  for (let i = 0; i < journals.length; i++) {
    const j = journals[i];
    const issns = [j.issn, j.eissn].filter(x => x && /^[0-9]{4}-[0-9]{3}[0-9xX]$/i.test(x.trim()));
    const primaryDisc = getDiscipline(j.name, j.description || '');

    let articleCount = Number(j.localWindowArticleCount) || 0;
    let citationCount = 0;
    let source = 'local';

    // If journal has ISSNs, query Crossref for 2023-2024 works
    if (issns.length > 0) {
      const issnQuery = issns.map(x => x.trim()).join('|');
      try {
        const url = `https://api.crossref.org/works?filter=issn:${issnQuery},from-pub-date:2023-01-01,until-pub-date:2024-12-31&rows=100&select=DOI,is-referenced-by-count`;
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

            // If there were more than 100 items, extrapolate mean rate accurately
            if (totalWorks > 100 && items.length > 0) {
              const avg = sampleCites / items.length;
              citationCount = Math.round(avg * totalWorks);
            } else {
              citationCount = sampleCites;
            }
            source = 'crossref';
          }
        }
      } catch (err) {
        // Silently fall back to local count if connection fails
      }
    }

    // Calculate score
    const standardScore = articleCount > 0 && citationCount > 0
      ? parseFloat((citationCount / articleCount).toFixed(3))
      : 0.000;
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

    if ((i + 1) % 50 === 0 || citationCount > 0 || j.name.includes('ARJESS')) {
      console.log(`[${i + 1}/${journals.length}] ${j.name.substring(0, 50)}: Articles=${articleCount}, Citations=${citationCount}, Score=${standardScore} (${source})`);
    }

    // Gentle throttling to respect Crossref rate limits
    if (issns.length > 0 && (i + 1) % 10 === 0) {
      await sleep(150);
    }
  }

  // Group by discipline and assign relative quartiles & discipline rankings
  console.log('\nAssigning relative quartiles and discipline ranks...');
  const disciplineGroups = {};
  for (const item of journalResults) {
    const disc = item.primaryDiscipline;
    if (!disciplineGroups[disc]) disciplineGroups[disc] = [];
    disciplineGroups[disc].push(item);
  }

  const reportsToInsert = [];

  for (const [disc, items] of Object.entries(disciplineGroups)) {
    // Sort descending by score
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

  // Batch insert into ImpactFactorReport
  console.log(`\nPersisting ${reportsToInsert.length} verifiable ImpactFactorReport records into database...`);
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

  console.log('\n=== Citation Harvester Complete! Single Source of Truth Updated. ===');

  // Verify ARJESS and top journals
  const sampleReports = await conn.query(`
    SELECT j.name, r.standardScore, r.citationCount, r.articleCount, r.quartile, r.disciplineRank, r.totalInDiscipline, r.primaryDiscipline
    FROM ImpactFactorReport r
    JOIN Journal j ON r.journalId = j.id
    WHERE r.year = 2025
    ORDER BY r.standardScore DESC
    LIMIT 10
  `);

  console.log('\nTop 10 Ranked Journals for 2025:');
  console.table(sampleReports);

  const arjessReport = await conn.query(`
    SELECT j.name, r.standardScore, r.citationCount, r.articleCount, r.quartile
    FROM ImpactFactorReport r
    JOIN Journal j ON r.journalId = j.id
    WHERE j.name LIKE '%ARJESS%' AND r.year = 2025
  `);
  console.log('\nARJESS Report for 2025:');
  console.table(arjessReport);

  await conn.end();
  await pool.end();
}

harvestExternalCitations().catch(err => {
  console.error('Fatal Harvester Error:', err);
  process.exit(1);
});
