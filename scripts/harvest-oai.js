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

// Simple XML tag content extractor without heavy external dependencies
function extractXmlTags(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const matches = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1].trim());
  }
  return matches;
}

function cleanXmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

/**
 * Harvests articles from an OJS/OAI-PMH endpoint
 * @param {string} oaiEndpointUrl e.g. "https://journal.uonbi.ac.ke/index.php/index/oai" or "https://www.ajol.info/index.php/[journal_path]/oai"
 * @param {string} journalId UUID of the journal in our database
 */
async function harvestOAIEndpoint(oaiEndpointUrl, journalId) {
  let resumptionToken = null;
  let page = 1;
  let totalHarvested = 0;

  console.log(`\nConnecting to OAI-PMH repository: ${oaiEndpointUrl}`);

  do {
    let url = resumptionToken
      ? `${oaiEndpointUrl}?verb=ListRecords&resumptionToken=${encodeURIComponent(resumptionToken)}`
      : `${oaiEndpointUrl}?verb=ListRecords&metadataPrefix=oai_dc`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AfriJournalIndex-Harvester/1.0 (mailto:admin@afrijournalindex.org)' }
      });

      if (!res.ok) {
        console.warn(`  [OAI Error] Status ${res.status} from ${oaiEndpointUrl}`);
        break;
      }

      const xmlText = await res.text();

      // Extract individual <record> elements
      const records = extractXmlTags(xmlText, 'record');
      if (records.length === 0) {
        console.log(`  No records found on page ${page}.`);
        break;
      }

      console.log(`  [Page ${page}] Processing ${records.length} OAI records...`);

      for (const recordXml of records) {
        const titles = extractXmlTags(recordXml, 'dc:title');
        const descriptions = extractXmlTags(recordXml, 'dc:description');
        const dates = extractXmlTags(recordXml, 'dc:date');
        const identifiers = extractXmlTags(recordXml, 'dc:identifier');

        const title = titles.length > 0 ? cleanXmlEntities(titles[0]) : null;
        if (!title) continue;

        const abstract = descriptions.length > 0 ? cleanXmlEntities(descriptions[0]) : null;

        // Extract DOI and PDF links from dc:identifier
        let doi = null;
        let pdfUrl = null;

        for (const id of identifiers) {
          const cleanedId = cleanXmlEntities(id);
          if (cleanedId.includes('doi.org/') || cleanedId.startsWith('10.')) {
            doi = cleanedId.replace(/^https?:\/\/doi\.org\//i, '').trim();
          } else if (cleanedId.startsWith('http://') || cleanedId.startsWith('https://')) {
            if (!pdfUrl) pdfUrl = cleanedId;
          }
        }

        // Parse date
        let publishDate = new Date();
        if (dates.length > 0) {
          const parsed = new Date(cleanXmlEntities(dates[0]));
          if (!isNaN(parsed.getTime())) {
            publishDate = parsed;
          }
        }

        try {
          let existingArticle = null;
          if (doi) {
            existingArticle = await prisma.article.findUnique({ where: { doi } });
          }

          if (!existingArticle) {
            existingArticle = await prisma.article.findFirst({
              where: {
                title,
                journalId
              }
            });
          }

          if (existingArticle) {
            await prisma.article.update({
              where: { id: existingArticle.id },
              data: {
                abstract: existingArticle.abstract || abstract,
                pdfUrl: existingArticle.pdfUrl || pdfUrl
              }
            });
          } else {
            await prisma.article.create({
              data: {
                title,
                doi: doi || null,
                abstract: abstract || null,
                pdfUrl: pdfUrl || null,
                publishDate,
                journalId
              }
            });
            totalHarvested++;
          }
        } catch (err) {
          // Ignore duplicate / constraint errors
        }
      }

      // Check for resumptionToken
      const tokenMatches = extractXmlTags(xmlText, 'resumptionToken');
      resumptionToken = tokenMatches.length > 0 && tokenMatches[0] ? tokenMatches[0] : null;

      page++;
      await sleep(500); // Polite rate limit for OJS servers
    } catch (err) {
      console.error(`  [OAI Fetch Exception]:`, err.message);
      break;
    }
  } while (resumptionToken);

  console.log(`Finished harvesting ${totalHarvested} new articles from ${oaiEndpointUrl}`);
  return totalHarvested;
}

// Example execution for testing an OJS endpoint
async function main() {
  const ojsEndpoint = process.argv[2];
  const journalIssnOrName = process.argv[3];

  if (!ojsEndpoint) {
    console.log(`
=== AfriJournal OAI-PMH Harvester ===
Usage:
  node scripts/harvest-oai.js <OAI_ENDPOINT_URL> [JOURNAL_ISSN_OR_NAME]

Example:
  node scripts/harvest-oai.js https://erepository.uonbi.ac.ke/oai/request "0012-3456"
`);
    return;
  }

  let journal = null;
  if (journalIssnOrName) {
    journal = await prisma.journal.findFirst({
      where: {
        OR: [
          { issn: journalIssnOrName },
          { eissn: journalIssnOrName },
          { name: { contains: journalIssnOrName, mode: 'insensitive' } }
        ]
      }
    });
  }

  if (!journal) {
    console.log(`No specific journal found for "${journalIssnOrName}", querying or creating repository container...`);
    journal = await prisma.journal.findFirst({
      where: { isIndexed: true }
    });
  }

  if (journal) {
    await harvestOAIEndpoint(ojsEndpoint, journal.id);
  } else {
    console.error('No valid journal record found in database to associate articles with.');
  }
}

main()
  .catch(e => {
    console.error('Harvester error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
