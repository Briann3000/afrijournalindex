const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'afrijournalindex',
  connectionLimit: 15
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });
const dumpPath = path.join(__dirname, '..', 'db-dump.json');

async function importToMySQL() {
  console.log('=== Ingesting Snapshot Data into MySQL ===\n');

  if (!fs.existsSync(dumpPath)) {
    console.error(`Dump file not found: ${dumpPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dumpPath, 'utf-8');
  const dump = JSON.parse(raw);

  console.log(`Snapshot records to migrate:`);
  console.log(`- Users:       ${dump.users?.length || 0}`);
  console.log(`- Journals:    ${dump.journals?.length || 0}`);
  console.log(`- Submissions: ${dump.submissions?.length || 0}`);
  console.log(`- Articles:    ${dump.articles?.length || 0}`);
  console.log(`- Reports:     ${dump.reports?.length || 0}\n`);

  // 1. Users
  console.log('Migrating Users...');
  for (const user of dump.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        orcid: user.orcid,
        institution: user.institution,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }
    });
  }
  console.log('-> Users complete.');

  // 2. Journals
  console.log('Migrating Journals...');
  const batchSize = 100;
  for (let i = 0; i < dump.journals.length; i += batchSize) {
    const chunk = dump.journals.slice(i, i + batchSize);
    for (const j of chunk) {
      await prisma.journal.upsert({
        where: { id: j.id },
        update: {},
        create: {
          id: j.id,
          name: j.name,
          issn: j.issn,
          eissn: j.eissn,
          description: j.description,
          publisherName: j.publisherName,
          country: j.country,
          frequency: j.frequency || 'Quarterly',
          websiteUrl: j.websiteUrl,
          indexedAt: j.indexedAt ? new Date(j.indexedAt) : null,
          qualityGrade: j.qualityGrade,
          isIndexed: j.isIndexed ?? true,
          createdAt: new Date(j.createdAt),
          updatedAt: new Date(j.updatedAt),
          publisherId: j.publisherId
        }
      });
    }
  }
  console.log(`-> ${dump.journals.length} Journals migrated.`);

  // 3. Submissions
  console.log('Migrating Submissions...');
  for (const s of dump.submissions) {
    await prisma.submission.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        journalName: s.journalName,
        issn: s.issn,
        eissn: s.eissn,
        description: s.description,
        publisherName: s.publisherName,
        country: s.country,
        frequency: s.frequency,
        websiteUrl: s.websiteUrl,
        pdfFileUrl: s.pdfFileUrl,
        status: s.status,
        evaluationLog: s.evaluationLog,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        submitterId: s.submitterId,
        journalId: s.journalId
      }
    });
  }

  // 4. Articles
  console.log('Migrating Articles in batches...');
  let articlesInserted = 0;
  const articleBatch = 250;
  for (let i = 0; i < dump.articles.length; i += articleBatch) {
    const chunk = dump.articles.slice(i, i + articleBatch);
    for (const a of chunk) {
      try {
        await prisma.article.upsert({
          where: { id: a.id },
          update: {},
          create: {
            id: a.id,
            title: a.title,
            doi: a.doi,
            abstract: a.abstract,
            pdfUrl: a.pdfUrl,
            publishDate: new Date(a.publishDate),
            createdAt: new Date(a.createdAt),
            journalId: a.journalId
          }
        });
        articlesInserted++;
      } catch (err) {
        // Skip duplicate or constraint errors
      }
    }
    if (i % 2500 === 0 && i > 0) {
      console.log(`  Processed ${i} / ${dump.articles.length} articles...`);
    }
  }
  console.log(`-> ${articlesInserted} Articles migrated into MySQL.`);

  // 5. Impact Factor Reports
  console.log('Migrating Impact Factor Reports...');
  for (const r of dump.reports) {
    try {
      await prisma.impactFactorReport.upsert({
        where: {
          journalId_year: {
            journalId: r.journalId,
            year: r.year
          }
        },
        update: {},
        create: {
          id: r.id,
          year: r.year,
          standardScore: r.standardScore,
          regionalScore: r.regionalScore,
          citationCount: r.citationCount,
          articleCount: r.articleCount,
          pdfReportUrl: r.pdfReportUrl,
          createdAt: new Date(r.createdAt),
          journalId: r.journalId
        }
      });
    } catch (err) {
      // Ignore
    }
  }
  console.log(`-> ${dump.reports.length} Reports migrated.`);

  console.log('\n========================================');
  console.log('🎉 Full Migration to MySQL Completed Successfully!');
  console.log('========================================\n');
}

importToMySQL()
  .catch(err => {
    console.error('Import error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
