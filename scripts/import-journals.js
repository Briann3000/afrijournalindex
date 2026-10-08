const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

// Configure environment variable backup check
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const excelFilePath = path.join(__dirname, '..', 'journals.xlsx');

async function main() {
  console.log('Starting Excel journals import pipeline...');
  console.log(`Reading workbook from: ${excelFilePath}`);

  let workbook;
  try {
    workbook = XLSX.readFile(excelFilePath);
  } catch (error) {
    console.error('Failed to read Excel file:', error);
    process.exit(1);
  }

  const sheetNames = workbook.SheetNames;
  console.log(`Found sheets for ${sheetNames.length} countries in workbook.`);

  let totalImported = 0;
  let totalSkipped = 0;

  for (const sheetName of sheetNames) {
    const countryName = sheetName.trim();
    console.log(`\nProcessing journals for country: ${countryName}...`);

    const worksheet = workbook.Sheets[sheetName];
    // Read the rows as an array of arrays
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rows.length < 2) {
      console.log(`Sheet "${sheetName}" is empty or has no data rows.`);
      continue;
    }

    // Identify header row
    const headers = rows[0].map(h => (h ? h.toString().trim() : ''));
    console.log(`Headers found:`, headers);

    // Map header names to indices
    const nameIdx = headers.findIndex(h => h.includes('Journal Name'));
    const issnIdx = headers.findIndex(h => h.includes('ISSN (Print)'));
    const eissnIdx = headers.findIndex(h => h.includes('EISSN') || h.includes('eISSN') || h.includes('Electronic'));
    const publisherIdx = headers.findIndex(h => h.includes('Publisher Name'));
    const frequencyIdx = headers.findIndex(h => h.includes('Frequency'));
    const websiteIdx = headers.findIndex(h => h.includes('website') || h.includes('Website') || h.includes('URL'));
    const scopeIdx = headers.findIndex(h => h.includes('Scope') || h.includes('Description'));

    // Process data rows
    const dataRows = rows.slice(1);
    let countryImported = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.length === 0) continue;

      const name = row[nameIdx]?.toString().trim();
      if (!name) {
        // Skip empty rows
        continue;
      }

      // Read ISSNs and clean them (e.g. remove spaces, dashes, make sure they are unique)
      let issn = row[issnIdx]?.toString().trim() || null;
      let eissn = row[eissnIdx]?.toString().trim() || null;

      // Clean ISSN format (standard is XXXX-XXXX)
      const cleanISSN = (val) => {
        if (!val) return null;
        let clean = val.replace(/[^0-9X]/gi, '');
        if (clean.length === 8) {
          return `${clean.substring(0, 4)}-${clean.substring(4)}`;
        }
        return val; // Fallback
      };

      issn = cleanISSN(issn);
      eissn = cleanISSN(eissn);

      const publisherName = row[publisherIdx]?.toString().trim() || 'Unknown Publisher';
      const frequency = row[frequencyIdx]?.toString().trim() || 'Quarterly';
      const websiteUrl = row[websiteIdx]?.toString().trim() || '';
      const description = row[scopeIdx]?.toString().trim() || 'No description/scope available.';

      // Check if this journal already exists by name or ISSN
      let existingJournal = null;
      try {
        existingJournal = await prisma.journal.findFirst({
          where: {
            OR: [
              ...(issn ? [{ issn }] : []),
              ...(eissn ? [{ eissn }] : []),
              { name }
            ]
          }
        });
      } catch (err) {
        console.error('Error querying existing journal:', err);
      }

      if (existingJournal) {
        console.log(`  [Skipped] "${name}" already exists in database.`);
        totalSkipped++;
        continue;
      }

      try {
        await prisma.journal.create({
          data: {
            name,
            issn,
            eissn,
            publisherName,
            frequency,
            websiteUrl,
            description,
            country: countryName,
            isIndexed: true,
            qualityGrade: 'A',
            indexedAt: new Date()
          }
        });
        countryImported++;
        totalImported++;
      } catch (err) {
        console.error(`  [Error] Failed to insert journal "${name}":`, err.message);
        totalSkipped++;
      }
    }

    console.log(`  Successfully imported ${countryImported} journals for ${countryName}.`);
  }

  console.log(`\nImport completed!`);
  console.log(`Total Imported: ${totalImported}`);
  console.log(`Total Skipped/Existing: ${totalSkipped}`);
}

main()
  .catch(e => {
    console.error('Unexpected error in script execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
