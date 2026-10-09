const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const journal = await prisma.journal.findFirst({
    where: { name: { contains: 'Mediterranean Journal of Pharmacy', mode: 'insensitive' } }
  });

  const article = await prisma.article.findFirst({
    where: {
      OR: [
        { title: { contains: 'Pantoea agglomerans', mode: 'insensitive' } },
        { title: { contains: 'Myrtus communis', mode: 'insensitive' } },
        { doi: { contains: '23246760' } }
      ]
    }
  });

  console.log('Journal in DB:', journal);
  console.log('Article in DB:', article);
}

check()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
