const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function exportDatabase() {
  console.log('=== Step 1: Exporting PostgreSQL Database to JSON Snapshot ===\n');

  console.log('Fetching Users...');
  const users = await prisma.user.findMany();
  console.log(`-> ${users.length} Users exported.`);

  console.log('Fetching Journals...');
  const journals = await prisma.journal.findMany();
  console.log(`-> ${journals.length} Journals exported.`);

  console.log('Fetching Submissions...');
  const submissions = await prisma.submission.findMany();
  console.log(`-> ${submissions.length} Submissions exported.`);

  console.log('Fetching Articles...');
  const articles = await prisma.article.findMany();
  console.log(`-> ${articles.length} Articles exported.`);

  console.log('Fetching Citations...');
  const citations = await prisma.citation.findMany();
  console.log(`-> ${citations.length} Citations exported.`);

  console.log('Fetching Impact Factor Reports...');
  const reports = await prisma.impactFactorReport.findMany();
  console.log(`-> ${reports.length} Reports exported.`);

  console.log('Fetching Comments...');
  const comments = await prisma.comment.findMany();
  console.log(`-> ${comments.length} Comments exported.`);

  const dump = {
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length,
      journals: journals.length,
      submissions: submissions.length,
      articles: articles.length,
      citations: citations.length,
      reports: reports.length,
      comments: comments.length
    },
    users,
    journals,
    submissions,
    articles,
    citations,
    reports,
    comments
  };

  const dumpPath = path.join(__dirname, '..', 'db-dump.json');
  console.log(`\nWriting dump to: ${dumpPath}`);
  fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2), 'utf-8');

  console.log('\n✅ Database snapshot completed successfully!');
}

exportDatabase()
  .catch(err => {
    console.error('Export error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
