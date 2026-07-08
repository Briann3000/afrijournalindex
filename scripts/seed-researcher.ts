import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding researcher profile and mapping h-index citation variables...");

  // 1. Create a researcher user
  const email = "jane.doe@uonbi.ac.ke";
  let researcher = await prisma.user.findUnique({
    where: { email }
  });

  if (researcher) {
    // Clear previous papers association and citations for a clean rebuild
    await prisma.user.update({
      where: { id: researcher.id },
      data: {
        articles: { set: [] }
      }
    });
  } else {
    researcher = await prisma.user.create({
      data: {
        email,
        name: "Dr. Jane Doe",
        orcid: "0000-0002-1825-0097",
        institution: "University of Nairobi",
        role: "RESEARCHER",
        passwordHash: "sim_hash_password123"
      }
    });
  }

  console.log(`Created researcher profile: ${researcher.name} (ID: ${researcher.id})`);

  // 2. Fetch some existing seeded articles to associate with Dr. Jane Doe
  const articles = await prisma.article.findMany({
    take: 5
  });

  if (articles.length < 5) {
    throw new Error("Seed articles not found. Please run seed-metrics script first!");
  }

  // Associate Jane Doe as an author on all 5 articles
  await prisma.user.update({
    where: { id: researcher.id },
    data: {
      articles: {
        connect: articles.map(art => ({ id: art.id }))
      }
    }
  });

  console.log(`Associated ${articles.length} publications with ${researcher.name}.`);

  // 3. Let's create specific cross-citations to compute a predicted h-index of 3.
  // Target citations counts:
  // Article 0 -> 5 citations
  // Article 1 -> 4 citations
  // Article 2 -> 3 citations
  // Article 3 -> 2 citations
  // Article 4 -> 1 citation
  
  // First, clean up citations pointing to these 5 articles
  await prisma.citation.deleteMany({
    where: {
      citedArticleId: { in: articles.map(a => a.id) }
    }
  });

  // Fetch other articles to act as citing papers
  const otherArticles = await prisma.article.findMany({
    where: {
      id: { notIn: articles.map(a => a.id) }
    },
    take: 15
  });

  const citationTargets = [5, 4, 3, 2, 1];
  let citationCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const targetCount = citationTargets[idx];
    const citedArticle = articles[idx];

    for (let c = 0; c < targetCount; c++) {
      const citingArticle = otherArticles[c % otherArticles.length];
      
      try {
        await prisma.citation.create({
          data: {
            citingArticleId: citingArticle.id,
            citedArticleId: citedArticle.id,
            citedAt: new Date("2025-05-10T00:00:00.000Z")
          }
        });
        citationCount++;
      } catch (err) {
        // Skip duplicate unique citations
      }
    }
  }

  console.log(`Generated ${citationCount} citations. Jane Doe's h-index should evaluate to: 3`);
  console.log("Researcher seeding completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
