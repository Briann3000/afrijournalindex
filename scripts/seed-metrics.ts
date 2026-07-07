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
  console.log("Seeding AfriJournal Index articles and citation mock database data...");

  // 1. Ensure publisher user exists
  let publisher = await prisma.user.findFirst({
    where: { email: "publisher@kenpro.org" }
  });

  if (!publisher) {
    publisher = await prisma.user.create({
      data: {
        email: "publisher@kenpro.org",
        name: "KENPRO Publisher",
        role: "PUBLISHER",
        passwordHash: "hashed_dummy_password"
      }
    });
  }

  // 2. Create or verify our seed journals (ARJESS, JMBA, IJEHS)
  const journalsData = [
    {
      name: "African Research Journal of Education and Social Sciences (ARJESS)",
      issn: "2312-0134",
      eissn: "2519-0016",
      description: "Focuses on education policy, social sciences, and regional development studies.",
      publisherName: "Kenya Projects Organization (KENPRO)",
      country: "Kenya",
      frequency: "Quarterly",
      websiteUrl: "https://arjess.org",
      isIndexed: true,
      qualityGrade: "A"
    },
    {
      name: "Journal of Management and Business Administration (JMBA)",
      issn: "2519-0024",
      eissn: "2519-0032",
      description: "Covers corporate strategy, human resource management, and regional commerce.",
      publisherName: "Kenya Projects Organization (KENPRO)",
      country: "Kenya",
      frequency: "Semi-Annually",
      websiteUrl: "https://kenpro.org/jmba",
      isIndexed: true,
      qualityGrade: "B"
    },
    {
      name: "International Journal of Environmental Health Studies (IJEHS)",
      issn: "2708-0463",
      eissn: "2708-0471",
      description: "Covers public health, environmental hygiene, sanitation, and safety policies.",
      publisherName: "Kenya Projects Organization (KENPRO)",
      country: "Kenya",
      frequency: "Annually",
      websiteUrl: "https://kenpro.org/ijehs",
      isIndexed: true,
      qualityGrade: "A"
    }
  ];

  // 3. Clear existing metrics, reports, submissions, and matching seed journals to avoid unique constraint issues
  await prisma.citation.deleteMany();
  await prisma.article.deleteMany();
  await prisma.impactFactorReport.deleteMany();
  await prisma.submission.deleteMany();
  
  const issnList = journalsData.map(jd => jd.issn).filter(Boolean);
  await prisma.journal.deleteMany({
    where: {
      issn: { in: issnList }
    }
  });

  const journals: any[] = [];
  for (const jData of journalsData) {
    const j = await prisma.journal.create({
      data: {
        ...jData,
        publisherId: publisher.id
      }
    });

    // Create a matching submission record so lookups for redirect resolve successfully
    await prisma.submission.create({
      data: {
        journalName: jData.name,
        issn: jData.issn,
        eissn: jData.eissn,
        description: jData.description,
        publisherName: jData.publisherName,
        country: jData.country,
        frequency: jData.frequency,
        websiteUrl: jData.websiteUrl,
        status: "ACCEPTED",
        evaluationLog: "Pre-indexed seed journal loaded successfully.",
        submitterId: publisher.id,
        journalId: j.id
      }
    });

    journals.push(j);
  }



  console.log("Creating seed articles across 2023, 2024, and 2025...");

  // Generate 10 articles for each journal: 4 in 2023, 4 in 2024, 2 in 2025
  const articles: any[] = [];
  for (const journal of journals) {
    // 2023 Articles
    for (let i = 1; i <= 4; i++) {
      const art = await prisma.article.create({
        data: {
          title: `Research Study on ${journal.name} - 2023 Vol ${i}`,
          doi: `10.5130/${journal.issn.replace("-", "")}.2023.${i}`,
          abstract: "Abstract detailing methodologies and regional study outcomes.",
          publishDate: new Date(`2023-04-12T00:00:00.000Z`),
          journalId: journal.id
        }
      });
      articles.push(art);
    }
    // 2024 Articles
    for (let i = 1; i <= 4; i++) {
      const art = await prisma.article.create({
        data: {
          title: `Analysis of Regional Trends in ${journal.name} - 2024 Vol ${i}`,
          doi: `10.5130/${journal.issn.replace("-", "")}.2024.${i}`,
          abstract: "Abstract detailing structural framework findings and research suggestions.",
          publishDate: new Date(`2024-07-20T00:00:00.000Z`),
          journalId: journal.id
        }
      });
      articles.push(art);
    }
    // 2025 Articles
    for (let i = 1; i <= 2; i++) {
      const art = await prisma.article.create({
        data: {
          title: `Advancements and Future Trajectories in ${journal.name} - 2025 Vol ${i}`,
          doi: `10.5130/${journal.issn.replace("-", "")}.2025.${i}`,
          abstract: "Abstract detailing future goals, models, and policy outlines.",
          publishDate: new Date(`2025-02-15T00:00:00.000Z`),
          journalId: journal.id
        }
      });
      articles.push(art);
    }
  }

  console.log(`Created ${articles.length} articles.`);

  // 4. Create citations
  // Standard impact calculation (e.g. for AJIF 2025) counts:
  // Citations made in 2025 -> to articles published in 2023-2024.
  // Let's create specific citations where 2025 articles cite 2023 & 2024 articles.
  console.log("Mapping mock citations...");

  const articles2025 = articles.filter(a => a.publishDate.getFullYear() === 2025);
  const articles2023_2024 = articles.filter(a => a.publishDate.getFullYear() === 2023 || a.publishDate.getFullYear() === 2024);

  let citationCount = 0;
  // Let's make 2025 articles cite 2023/2024 articles to build a positive citation index
  for (const citing of articles2025) {
    // Each 2025 article cites 2 random articles from 2023/2024
    const shuffled = [...articles2023_2024].sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, 2);

    for (const cited of targets) {
      // Ensure we don't self-cite with the exact same ID (which is already guaranteed since cited is 2023/2024 and citing is 2025)
      try {
        await prisma.citation.create({
          data: {
            citingArticleId: citing.id,
            citedArticleId: cited.id,
            citedAt: new Date(`2025-06-01T00:00:00.000Z`)
          }
        });
        citationCount++;
      } catch (err) {
        // Ignore duplicate citations
      }
    }
  }

  console.log(`Successfully generated ${citationCount} citations.`);
  console.log("Database seed completed successfully!");
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
