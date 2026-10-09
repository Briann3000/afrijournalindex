const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const AFRICAN_COUNTRIES_SET = new Set([
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde',
  'Cameroon', 'Central African Republic', 'Chad', 'Comoros', 'Congo',
  'Democratic Republic of the Congo', 'Cote d\'Ivoire', 'Ivory Coast', 'Djibouti',
  'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia',
  'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho', 'Liberia', 'Libya',
  'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique',
  'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal',
  'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan',
  'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
]);

function cleanISSN(val) {
  if (!val) return null;
  let clean = val.replace(/[^0-9X]/gi, '');
  if (clean.length === 8) {
    return `${clean.substring(0, 4)}-${clean.substring(4)}`.toUpperCase();
  }
  return val.trim();
}

function parseCSVLine(line, delimiter = ';') {
  const result = [];
  let current = '';
  let insideQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === delimiter && !insideQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

async function importScimago(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.log(`\nTo get the latest SCImago dataset:`);
    console.log(`1. Download the global or regional CSV from: https://www.scimagojr.com/journalrank.php`);
    console.log(`2. Save it to your project root (e.g. 'scimagojr.csv')`);
    console.log(`3. Run: node scripts/import-scimago.js scimagojr.csv\n`);
    process.exit(1);
  }

  console.log(`=== Starting SCImago Journal Rank (SJR) Ingestion ===`);
  console.log(`Reading: ${filePath}\n`);

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let delimiter = ';';
  let headers = null;
  let lineCount = 0;
  let totalAfrican = 0;
  let totalImported = 0;
  let totalUpdated = 0;

  // Header field indices
  let titleIdx, issnIdx, sjrIdx, sjrBestQuartileIdx, hIndexIdx, countryIdx, publisherIdx, categoriesIdx;

  for await (const line of rl) {
    lineCount++;
    if (!line || line.trim() === '') continue;

    if (lineCount === 1) {
      // Determine delimiter (SCImago usually uses ';' or ',')
      delimiter = line.includes(';') ? ';' : ',';
      headers = parseCSVLine(line, delimiter);
      
      titleIdx = headers.findIndex(h => /Title/i.test(h));
      issnIdx = headers.findIndex(h => /Issn/i.test(h));
      sjrIdx = headers.findIndex(h => /^SJR/i.test(h));
      sjrBestQuartileIdx = headers.findIndex(h => /SJR Best Quartile/i.test(h));
      hIndexIdx = headers.findIndex(h => /H index/i.test(h));
      countryIdx = headers.findIndex(h => /Country/i.test(h));
      publisherIdx = headers.findIndex(h => /Publisher/i.test(h));
      categoriesIdx = headers.findIndex(h => /Categories/i.test(h));

      console.log(`Detected SCImago columns (${delimiter}): Title, ISSN, SJR, Quartile, Country, Publisher...`);
      continue;
    }

    const row = parseCSVLine(line, delimiter);
    const country = row[countryIdx]?.trim();

    // Check if journal belongs to an African country
    if (!country || !AFRICAN_COUNTRIES_SET.has(country)) {
      continue;
    }

    totalAfrican++;

    const name = row[titleIdx]?.trim();
    if (!name) continue;

    const rawIssns = row[issnIdx]?.split(',').map(s => cleanISSN(s)).filter(Boolean) || [];
    const pissn = rawIssns[0] || null;
    const eissn = rawIssns[1] || null;
    const publisherName = row[publisherIdx]?.trim() || 'SCImago Registered Publisher';
    const quartile = row[sjrBestQuartileIdx]?.trim() || 'Q3'; // e.g. Q1, Q2, Q3, Q4
    const categories = row[categoriesIdx]?.trim() || '';
    const sjrRaw = parseFloat(row[sjrIdx]?.replace(',', '.') || '0');
    const hIndex = parseInt(row[hIndexIdx] || '0', 10);

    // Map Quartile to Quality Grade (Q1 -> A+, Q2 -> A, Q3 -> B, Q4 -> C)
    const qualityGradeMap = { 'Q1': 'A+', 'Q2': 'A', 'Q3': 'B', 'Q4': 'C', '-': 'B' };
    const qualityGrade = qualityGradeMap[quartile] || 'B';

    const description = `Categories: ${categories} | SJR Score: ${sjrRaw} | H-Index: ${hIndex}`;

    // Find existing journal
    const orConditions = [];
    if (pissn) orConditions.push({ issn: pissn });
    if (eissn) orConditions.push({ eissn: eissn });
    orConditions.push({ name });

    let existing = null;
    try {
      existing = await prisma.journal.findFirst({
        where: { OR: orConditions }
      });
    } catch (err) {
      // Query error
    }

    if (existing) {
      try {
        await prisma.journal.update({
          where: { id: existing.id },
          data: {
            qualityGrade,
            description: existing.description.includes('Categories') ? existing.description : `${existing.description} | ${description}`,
            isIndexed: true
          }
        });

        // Upsert 2024 ImpactFactorReport score from SJR metric
        await prisma.impactFactorReport.upsert({
          where: {
            journalId_year: {
              journalId: existing.id,
              year: 2024
            }
          },
          update: {
            standardScore: sjrRaw,
            regionalScore: parseFloat((sjrRaw * 1.2).toFixed(3))
          },
          create: {
            journalId: existing.id,
            year: 2024,
            standardScore: sjrRaw,
            regionalScore: parseFloat((sjrRaw * 1.2).toFixed(3)),
            citationCount: hIndex,
            articleCount: 15
          }
        });

        totalUpdated++;
      } catch (err) {
        // Update error
      }
    } else {
      try {
        const created = await prisma.journal.create({
          data: {
            name,
            issn: pissn,
            eissn,
            publisherName,
            country,
            frequency: 'Quarterly',
            websiteUrl: `https://www.scimagojr.com/journalsearch.php?q=${encodeURIComponent(name)}`,
            description,
            isIndexed: true,
            qualityGrade,
            indexedAt: new Date()
          }
        });

        await prisma.impactFactorReport.create({
          data: {
            journalId: created.id,
            year: 2024,
            standardScore: sjrRaw,
            regionalScore: parseFloat((sjrRaw * 1.2).toFixed(3)),
            citationCount: hIndex,
            articleCount: 15
          }
        });

        totalImported++;
        console.log(`  + [Inserted SJR] ${name} (${country}) [${quartile}]`);
      } catch (err) {
        // Create error
      }
    }
  }

  console.log('\n========================================');
  console.log('SCImago Import Summary:');
  console.log(`African Journals Identified: ${totalAfrican}`);
  console.log(`New Journals Ingested:        ${totalImported}`);
  console.log(`Existing Journals Enriched:   ${totalUpdated}`);
  console.log('========================================\n');
}

const targetFile = process.argv[2] || path.join(__dirname, '..', 'scimagojr.csv');

importScimago(targetFile)
  .catch(e => {
    console.error('SCImago import error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
