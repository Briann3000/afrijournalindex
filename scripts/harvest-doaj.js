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

// List of African countries with ISO alpha-2 codes and names
const AFRICAN_COUNTRIES = [
  { code: 'DZ', name: 'Algeria' },
  { code: 'AO', name: 'Angola' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Democratic Republic of the Congo' },
  { code: 'CI', name: "Cote d'Ivoire" },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'EG', name: 'Egypt' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'KE', name: 'Kenya' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'ML', name: 'Mali' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'ST', name: 'Sao Tome and Principe' },
  { code: 'SN', name: 'Senegal' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'SD', name: 'Sudan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TG', name: 'Togo' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'UG', name: 'Uganda' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' }
];

function cleanISSN(val) {
  if (!val) return null;
  let clean = val.replace(/[^0-9X]/gi, '');
  if (clean.length === 8) {
    return `${clean.substring(0, 4)}-${clean.substring(4)}`.toUpperCase();
  }
  return val.trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchDOAJJournalsByCountry(countryCode, countryName) {
  let page = 1;
  const pageSize = 100;
  let allJournals = [];

  while (true) {
    const url = `https://doaj.org/api/v3/search/journals/bibjson.publisher.country:${countryCode}?page=${page}&pageSize=${pageSize}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AfriJournalIndex/1.0 (https://afrijournal.org; mailto:info@afrijournal.org)'
        }
      });

      if (!response.ok) {
        if (response.status === 404) break;
        console.warn(`[DOAJ API] Warning: status ${response.status} for country ${countryName} (${countryCode}) on page ${page}`);
        break;
      }

      const data = await response.json();
      const results = data.results || [];
      if (results.length === 0) break;

      allJournals.push(...results);

      if (results.length < pageSize || allJournals.length >= (data.total || 0)) {
        break;
      }

      page++;
      await sleep(300); // Polite rate limit
    } catch (err) {
      console.error(`[DOAJ API] Fetch error for ${countryName}:`, err.message);
      break;
    }
  }

  return allJournals;
}

async function harvestDOAJ() {
  console.log('=== Starting DOAJ African Journals Ingestion Pipeline ===\n');
  
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const country of AFRICAN_COUNTRIES) {
    process.stdout.write(`Fetching ${country.name} (${country.code})... `);
    const records = await fetchDOAJJournalsByCountry(country.code, country.name);
    console.log(`Found ${records.length} journals.`);

    if (records.length === 0) continue;

    for (const record of records) {
      totalProcessed++;
      const bibjson = record.bibjson || {};
      const name = bibjson.title ? bibjson.title.trim() : null;
      if (!name) continue;

      let issn = null;
      let eissn = null;

      // Extract print and electronic ISSNs
      if (bibjson.pissn) issn = cleanISSN(bibjson.pissn);
      if (bibjson.eissn) eissn = cleanISSN(bibjson.eissn);
      
      // Some records have identifiers array
      if (Array.isArray(bibjson.identifiers)) {
        for (const id of bibjson.identifiers) {
          if (id.type === 'pissn' && !issn) issn = cleanISSN(id.id);
          if (id.type === 'eissn' && !eissn) eissn = cleanISSN(id.id);
        }
      }

      const publisherName = bibjson.publisher?.name || country.name + ' Publisher';
      const websiteUrl = bibjson.ref?.journal || bibjson.links?.[0]?.url || '';
      
      // Keywords/Subjects as description fallback
      let description = '';
      if (bibjson.subject && bibjson.subject.length > 0) {
        description = 'Subjects: ' + bibjson.subject.map(s => s.term).join(', ');
      }
      if (bibjson.keywords && bibjson.keywords.length > 0) {
        description += (description ? ' | ' : '') + 'Keywords: ' + bibjson.keywords.join(', ');
      }
      if (!description) {
        description = `Open Access peer-reviewed journal published in ${country.name}.`;
      }

      // Check existing journal by ISSN, eISSN, or exact title
      const orConditions = [];
      if (issn) orConditions.push({ issn });
      if (eissn) orConditions.push({ eissn });
      orConditions.push({ name });

      let existing = null;
      try {
        existing = await prisma.journal.findFirst({
          where: { OR: orConditions }
        });
      } catch (err) {
        console.error(`  Error querying database for "${name}":`, err.message);
      }

      if (existing) {
        // Optionally update missing website or eissn
        try {
          await prisma.journal.update({
            where: { id: existing.id },
            data: {
              websiteUrl: existing.websiteUrl || websiteUrl,
              issn: existing.issn || issn,
              eissn: existing.eissn || eissn,
              isIndexed: true,
              qualityGrade: existing.qualityGrade || 'A'
            }
          });
          totalUpdated++;
        } catch (err) {
          totalSkipped++;
        }
      } else {
        try {
          await prisma.journal.create({
            data: {
              name,
              issn,
              eissn,
              publisherName,
              country: country.name,
              frequency: 'Quarterly',
              websiteUrl,
              description,
              isIndexed: true,
              qualityGrade: 'A',
              indexedAt: new Date()
            }
          });
          totalInserted++;
          console.log(`  + [Inserted] ${name} (${country.name})`);
        } catch (err) {
          console.error(`  - [Failed to Insert] "${name}": ${err.message}`);
          totalSkipped++;
        }
      }
    }
  }

  console.log('\n========================================');
  console.log('DOAJ Harvesting Summary:');
  console.log(`Total DOAJ Records Processed: ${totalProcessed}`);
  console.log(`New Journals Inserted:        ${totalInserted}`);
  console.log(`Existing Journals Updated:    ${totalUpdated}`);
  console.log(`Skipped / Failed:             ${totalSkipped}`);
  console.log('========================================\n');
}

harvestDOAJ()
  .catch(e => {
    console.error('Pipeline error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
