const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function extractBareDOI(input) {
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  cleaned = cleaned.replace(/^doi:\s*/i, "");
  return cleaned.trim();
}

async function testSearch(q, country) {
  const bareDoi = extractBareDOI(q);
  const isDoiPattern = bareDoi.startsWith("10.") || q.includes("doi.org/");

  const orConditions = [
    { title: { contains: q, mode: "insensitive" } },
    { abstract: { contains: q, mode: "insensitive" } },
    { doi: { contains: bareDoi, mode: "insensitive" } },
    { journal: { name: { contains: q, mode: "insensitive" } } },
    { journal: { issn: { contains: q, mode: "insensitive" } } }
  ];

  if (isDoiPattern) {
    orConditions.unshift({ doi: { equals: bareDoi, mode: "insensitive" } });
  }

  const whereClause = { OR: orConditions };
  if (country) {
    whereClause.journal = { country: { equals: country, mode: "insensitive" } };
  }

  const results = await prisma.article.findMany({
    where: whereClause,
    take: 3,
    include: { journal: true }
  });

  console.log(`\n========================================`);
  console.log(`Search Query: "${q}" (Country: ${country || 'All'})`);
  console.log(`Found Matches: ${results.length}`);
  results.forEach((r, i) => {
    console.log(`  [${i+1}] Title:   ${r.title}`);
    console.log(`      DOI:     ${r.doi}`);
    console.log(`      Journal: ${r.journal?.name} (${r.journal?.country})`);
  });
  console.log(`========================================`);
}

async function runTests() {
  // Test 1: Keyword search
  await testSearch("Malaria", "");

  // Test 2: DOI search with bare prefix
  const sample = await prisma.article.findFirst({
    where: { doi: { not: null } }
  });

  if (sample && sample.doi) {
    console.log(`\nTesting DOI search formats using sample DOI: ${sample.doi}`);
    // Test bare DOI
    await testSearch(sample.doi, "");
    // Test URL format
    await testSearch(`https://doi.org/${sample.doi}`, "");
    // Test 'doi:' format
    await testSearch(`doi: ${sample.doi}`, "");
  }

  // Test 3: Country filtered search
  await testSearch("Health", "Kenya");
}

runTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
