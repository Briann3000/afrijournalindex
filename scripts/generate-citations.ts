import { prisma } from "../src/lib/db";

async function seedCitations() {
  console.log("Starting citation graph generation for 31,580 articles...");

  // 1. Fetch journals and their articles
  const journalsWithArticles = await prisma.journal.findMany({
    where: {
      articles: { some: {} }
    },
    select: {
      id: true,
      name: true,
      reports: {
        orderBy: { year: "desc" },
        take: 1,
        select: { citationCount: true, standardScore: true }
      },
      articles: {
        select: { id: true, title: true, publishDate: true },
        orderBy: { publishDate: "desc" }
      }
    }
  });

  console.log(`Found ${journalsWithArticles.length} journals with articles.`);

  // Collect all articles split by vintage
  const allArticles = await prisma.article.findMany({
    select: { id: true, journalId: true, publishDate: true }
  });

  const recentArticles = allArticles.filter(a => new Date(a.publishDate).getFullYear() >= 2023);
  const olderArticles = allArticles.filter(a => new Date(a.publishDate).getFullYear() < 2023);

  console.log(`Total articles: ${allArticles.length} (Recent: ${recentArticles.length}, Older: ${olderArticles.length})`);

  if (allArticles.length < 10) {
    console.log("Not enough articles to generate citations.");
    return;
  }

  // Clear existing citations
  await prisma.citation.deleteMany();
  console.log("Cleared old citations.");

  const citationsToCreate: { citingArticleId: string; citedArticleId: string; citedAt: Date }[] = [];
  const existingPairSet = new Set<string>();

  function addCitation(citingId: string, citedId: string, year: number) {
    if (citingId === citedId) return;
    const key = `${citingId}_${citedId}`;
    if (existingPairSet.has(key)) return;
    existingPairSet.add(key);
    citationsToCreate.push({
      citingArticleId: citingId,
      citedArticleId: citedId,
      citedAt: new Date(`${year}-0${Math.floor(Math.random() * 8) + 1}-15T00:00:00.000Z`)
    });
  }

  // 2. Select top landmark articles across prominent African journals to receive significant citations (20-60 citations each)
  const landmarkArticleCandidates = allArticles.slice(0, 150);
  const landmarkArticles = landmarkArticleCandidates.slice(0, 40); // Top 40 landmark papers

  // Distribute citations to landmark articles
  for (let i = 0; i < landmarkArticles.length; i++) {
    const targetArticle = landmarkArticles[i];
    // Landmark articles get between 15 and 55 citations
    const targetCitationCount = Math.max(12, Math.floor(55 - i * 0.9));
    
    // Pick random recent citing articles
    for (let c = 0; c < targetCitationCount; c++) {
      const citing = recentArticles[Math.floor(Math.random() * recentArticles.length)];
      if (citing && citing.id !== targetArticle.id) {
        const citingYear = new Date(citing.publishDate).getFullYear();
        addCitation(citing.id, targetArticle.id, Math.max(2023, citingYear));
      }
    }
  }

  // 3. For each journal with an ImpactFactorReport, assign citations to its articles reflecting journal citationCount
  for (const journal of journalsWithArticles) {
    const reportCitationCount = journal.reports[0]?.citationCount || 0;
    const arts = journal.articles;
    if (arts.length === 0) continue;

    // Allocate some citations within or across journals
    const numToCite = Math.min(reportCitationCount > 0 ? reportCitationCount : 5, arts.length * 3);
    for (let k = 0; k < numToCite; k++) {
      const citedArt = arts[Math.floor(Math.random() * arts.length)];
      const citingArt = recentArticles[Math.floor(Math.random() * recentArticles.length)];
      if (citingArt && citedArt && citingArt.id !== citedArt.id) {
        addCitation(citingArt.id, citedArt.id, 2024);
      }
    }
  }

  console.log(`Prepared ${citationsToCreate.length} citations to insert.`);

  // 4. Batch insert citations in chunks of 500
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < citationsToCreate.length; i += chunkSize) {
    const chunk = citationsToCreate.slice(i, i + chunkSize);
    await prisma.citation.createMany({
      data: chunk,
      skipDuplicates: true
    });
    inserted += chunk.length;
    if (inserted % 2000 === 0 || inserted === citationsToCreate.length) {
      console.log(`Inserted ${inserted} / ${citationsToCreate.length} citations...`);
    }
  }

  const finalCount = await prisma.citation.count();
  console.log(`Citation generation complete! Total citations in database: ${finalCount}`);

  // Query top cited articles to verify
  const topCited = await prisma.article.findMany({
    take: 5,
    orderBy: {
      citedBy: { _count: "desc" }
    },
    select: {
      id: true,
      title: true,
      _count: {
        select: { citedBy: true }
      }
    }
  });

  console.log("Top 5 Cited Articles after seeding:");
  for (const a of topCited) {
    console.log(`- [${a._count.citedBy} citations] ${a.title.substring(0, 80)}...`);
  }
}

seedCitations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
