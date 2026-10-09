const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const result = await prisma.article.findFirst({
    where: {
      OR: [
        { doi: { contains: '23246760' } },
        { title: { contains: 'Evaluation of the anti', mode: 'insensitive' } }
      ]
    },
    include: { journal: true }
  });

  console.log('Result for Zenodo article in DB:', result);
}

check()
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
