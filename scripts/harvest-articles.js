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

async function harvestOpenAlexAndCrossref() {
  console.log('=== Starting Resumable Real Article & DOI Harvester ===\n');

  // Fetch all journals that have an ISSN or eISSN
  const allJournals = await prisma.journal.findMany({
    where: {
      OR: [
        { issn: { not: null } },
        { eissn: { not: null } }
      ]
    },
    include: {
      _count: {
        select: { articles: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Filter journals that already have articles harvested (>= 5 articles) so it resumes seamlessly!
  const pendingJournals = allJournals.filter(j => j._count.articles < 5);

  console.log(`Total indexed journals in DB: ${allJournals.length}`);
  console.log(`Already populated journals (skipped): ${allJournals.length - pendingJournals.length}`);
  console.log(`Remaining journals to harvest: ${pendingJournals.length}\n`);

  let totalArticlesFound = 0;
  let totalArticlesInserted = 0;
  let totalArticlesUpdated = 0;

  for (let idx = 0; idx < pendingJournals.length; idx++) {
    const journal = pendingJournals[idx];
    const issns = [journal.issn, journal.eissn].filter(Boolean);

    console.log(`[${idx + 1}/${pendingJournals.length}] Harvesting: "${journal.name}" (${journal.country}) | ISSN: ${issns.join(', ')}`);

    let works = [];

    // 1. OpenAlex API
    for (const issn of issns) {
      try {
        const openAlexUrl = `https://api.openalex.org/works?filter=primary_location.source.issn:${issn}&sort=publication_year:desc&per_page=30&mailto=harvester@afrijournalindex.org`;
        const res = await fetch(openAlexUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:harvester@afrijournalindex.org)' }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            works = data.results.map(w => {
              const doiRaw = w.doi ? w.doi.replace(/^https?:\/\/doi\.org\//i, '') : null;
              const title = w.title || w.display_name || 'Untitled Article';
              const abstract = reconstructAbstract(w.abstract_inverted_index);
              const pdfUrl = w.open_access?.oa_url || w.primary_location?.pdf_url || w.primary_location?.landing_page_url || null;
              const pubDate = w.publication_date ? new Date(w.publication_date) : new Date(`${w.publication_year || 2024}-01-01`);
              return { title, doi: doiRaw, abstract, pdfUrl, publishDate: pubDate };
            });
            break;
          }
        }
      } catch (err) {
        // Continue
      }
      await sleep(150);
    }

    // 2. Fallback to Crossref
    if (works.length === 0) {
      for (const issn of issns) {
        try {
          const crossrefUrl = `https://api.crossref.org/works?filter=issn:${issn}&rows=25&sort=published&order=desc`;
          const res = await fetch(crossrefUrl, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/1.0 (mailto:harvester@afrijournalindex.org)' }
          });

          if (res.ok) {
            const data = await res.json();
            const items = data.message?.items || [];
            if (items.length > 0) {
              works = items.map(w => {
                const title = w.title?.[0] || 'Untitled Article';
                const doi = w.DOI || null;
                const pdfUrl = w.link?.[0]?.URL || (doi ? `https://doi.org/${doi}` : null);
                let publishDate = new Date();
                const dp = w['published-print']?.['date-parts']?.[0] || w['published-online']?.['date-parts']?.[0] || w['created']?.['date-parts']?.[0];
                if (dp) {
                  publishDate = new Date(Date.UTC(dp[0] || 2024, (dp[1] || 1) - 1, dp[2] || 1));
                }
                return {
                  title,
                  doi,
                  abstract: w.abstract ? w.abstract.replace(/<[^>]*>?/gm, '') : null,
                  pdfUrl,
                  publishDate
                };
              });
              break;
            }
          }
        } catch (err) {
          // Continue
        }
        await sleep(200);
      }
    }

    if (works.length === 0) {
      console.log(`  -> No articles returned for ${journal.name}.`);
      continue;
    }

    totalArticlesFound += works.length;
    console.log(`  -> Found ${works.length} articles.`);

    for (const work of works) {
      if (!work.title) continue;

      try {
        let existingArticle = null;
        if (work.doi) {
          existingArticle = await prisma.article.findUnique({
            where: { doi: work.doi }
          });
        }

        if (existingArticle) {
          await prisma.article.update({
            where: { id: existingArticle.id },
            data: {
              abstract: existingArticle.abstract || work.abstract,
              pdfUrl: existingArticle.pdfUrl || work.pdfUrl
            }
          });
          totalArticlesUpdated++;
        } else {
          await prisma.article.create({
            data: {
              title: work.title,
              doi: work.doi || null,
              abstract: work.abstract || null,
              pdfUrl: work.pdfUrl || null,
              publishDate: work.publishDate,
              journalId: journal.id
            }
          });
          totalArticlesInserted++;
        }
      } catch (err) {
        // Duplicate or constraint error handled gracefully
      }
    }

    await sleep(200);
  }

  console.log('\n========================================');
  console.log('Article & DOI Harvesting Summary:');
  console.log(`Total Articles Discovered: ${totalArticlesFound}`);
  console.log(`New Articles Inserted:    ${totalArticlesInserted}`);
  console.log(`Articles Updated:         ${totalArticlesUpdated}`);
  console.log('========================================\n');
}

harvestOpenAlexAndCrossref()
  .catch(e => {
    console.error('Harvesting error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
