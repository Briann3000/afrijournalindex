const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const jCount = await prisma.journal.count();
  const aCount = await prisma.article.count();
  const rCount = await prisma.impactFactorReport.count();

  const sampleArticles = await prisma.article.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: { journal: true }
  });

  console.log('========================================');
  console.log(`Journals in DB:       ${jCount}`);
  console.log(`Articles in DB:       ${aCount}`);
  console.log(`Impact Reports in DB: ${rCount}`);
  console.log('========================================\n');

  console.log('--- 3 Sample Linked Articles ---');
  sampleArticles.forEach((art, i) => {
    console.log(`[${i + 1}] Article: "${art.title}"`);
    console.log(`    DOI:     ${art.doi || 'N/A'}`);
    console.log(`    Journal: "${art.journal?.name}" (${art.journal?.country})`);
    console.log(`    ISSN:    ${art.journal?.issn || art.journal?.eissn || 'N/A'}\n`);
  });
}

check()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
