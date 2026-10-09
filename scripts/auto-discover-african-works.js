const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TOP_AFRICAN_COUNTRIES = [
  'ZA', 'EG', 'NG', 'KE', 'ET', 'GH', 'UG', 'TZ', 'MA', 'TN', 'DZ', 'CM', 'ZW', 'RW', 'SN'
];

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== 'object') return null;
  const wordPositions = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      wordPositions.push({ pos, word });
    }
  }
  wordPositions.sort((a, b) => a.pos - b.pos);
  return wordPositions.map(wp => wp.word).join(' ');
}

async function autoDiscoverAfricanWorks() {
  console.log('=== Automated Bulk Ingestion of African Research & Articles ===\n');

  let totalInserted = 0;
  let totalProcessed = 0;

  for (const countryCode of TOP_AFRICAN_COUNTRIES) {
    console.log(`\n>>> Discovering active peer-reviewed African research from country: [${countryCode}]...`);

    let cursor = '*';
    let pages = 0;
    const maxPagesPerCountry = 10; // 500 articles per country per run (tweakable)

    while (cursor && pages < maxPagesPerCountry) {
      pages++;
      const url = `https://api.openalex.org/works?filter=primary_location.source.country_code:${countryCode},type:article,has_doi:true&per_page=50&cursor=${encodeURIComponent(cursor)}&mailto=admin@afrijournalindex.org`;

      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'AfriJournalIndexAutoHarvester/1.0 (mailto:admin@afrijournalindex.org)' }
        });

        if (!res.ok) {
          console.warn(`  OpenAlex API returned status ${res.status}`);
          break;
        }

        const data = await res.json();
        const results = data.results || [];
        cursor = data.meta?.next_cursor;

        if (results.length === 0) break;

        for (const work of results) {
          totalProcessed++;
          const title = work.title || work.display_name;
          if (!title) continue;

          const doi = work.doi ? work.doi.replace(/^https?:\/\/doi\.org\//i, '') : null;
          const abstract = reconstructAbstract(work.abstract_inverted_index);
          const pdfUrl = work.open_access?.oa_url || work.primary_location?.pdf_url || work.primary_location?.landing_page_url || null;
          const source = work.primary_location?.source;
          const journalName = source?.display_name || 'African Academic Proceedings';
          const issn = source?.issn?.[0] || null;
          const pubDate = work.publication_date ? new Date(work.publication_date) : new Date();

          // 1. Find or auto-create Journal
          let journal = null;
          if (issn) {
            journal = await prisma.journal.findFirst({
              where: {
                OR: [{ issn }, { eissn: issn }]
              }
            });
          }

          if (!journal) {
            journal = await prisma.journal.findFirst({
              where: { name: journalName }
            });
          }

          if (!journal) {
            journal = await prisma.journal.create({
              data: {
                name: journalName,
                issn,
                publisherName: source?.host_organization_name || `${countryCode} Academic Press`,
                country: countryCode,
                frequency: 'Quarterly',
                websiteUrl: source?.homepage_url || '',
                description: `Peer-reviewed scientific source originating in ${countryCode}.`,
                isIndexed: true,
                qualityGrade: 'A',
                indexedAt: new Date()
              }
            });
          }

          // 2. Insert Article if not existing
          let existingArticle = null;
          if (doi) {
            existingArticle = await prisma.article.findUnique({ where: { doi } });
          }

          if (!existingArticle) {
            await prisma.article.create({
              data: {
                title,
                doi,
                abstract,
                pdfUrl,
                publishDate: pubDate,
                journalId: journal.id
              }
            });
            totalInserted++;
          }
        }

        console.log(`  Page ${pages}: processed batch (${totalInserted} total new articles inserted so far).`);
        await sleep(150);
      } catch (err) {
        console.error(`  Batch error:`, err.message);
        break;
      }
    }
  }

  console.log('\n========================================');
  console.log('Automated Discovery Complete!');
  console.log(`Total Works Inspected: ${totalProcessed}`);
  console.log(`Total New Articles Inserted: ${totalInserted}`);
  console.log('========================================\n');
}

autoDiscoverAfricanWorks()
  .catch(e => {
    console.error('Auto discovery failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
