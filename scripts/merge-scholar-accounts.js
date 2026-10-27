require('dotenv').config({ path: '.env' });
const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('@prisma/client');

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "afrijournalindex",
  connectionLimit: 5,
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

async function mergeScholarAccounts(primaryTarget, secondarySource) {
  console.log(`Starting account merge: Target [${primaryTarget}] <- Source [${secondarySource}]`);

  const primary = await prisma.user.findFirst({
    where: {
      OR: [
        { id: primaryTarget },
        { email: primaryTarget }
      ]
    },
    include: {
      claims: true
    }
  });

  const secondary = await prisma.user.findFirst({
    where: {
      OR: [
        { id: secondarySource },
        { email: secondarySource }
      ]
    },
    include: {
      claims: true
    }
  });

  if (!primary) {
    console.error(`Primary target account not found: ${primaryTarget}`);
    return;
  }
  if (!secondary) {
    console.error(`Secondary source account not found: ${secondarySource}`);
    return;
  }
  if (primary.id === secondary.id) {
    console.log("Primary and secondary accounts are the same record. No merge needed.");
    return;
  }

  console.log(`Target: ${primary.name} (${primary.email}) - Citations: ${primary.totalCitations}`);
  console.log(`Source: ${secondary.name} (${secondary.email}) - Citations: ${secondary.totalCitations}`);

  // 1. Move claimed publications
  const existingClaimedArticleIds = new Set(primary.claims.map(c => c.articleId));
  for (const claim of secondary.claims) {
    if (!existingClaimedArticleIds.has(claim.articleId)) {
      await prisma.claimedPublication.create({
        data: {
          userId: primary.id,
          articleId: claim.articleId,
          role: claim.role,
          status: claim.status
        }
      });
      console.log(`Moved claimed publication ${claim.articleId} to primary account.`);
    }
    // Delete old claim
    await prisma.claimedPublication.delete({ where: { id: claim.id } });
  }

  // 2. Transfer posts if any
  try {
    await prisma.post.updateMany({
      where: { authorId: secondary.id },
      data: { authorId: primary.id }
    });
  } catch (e) {
    // Post model might use user relation
  }

  // 3. Transfer comments if any
  try {
    await prisma.comment.updateMany({
      where: { authorId: secondary.id },
      data: { authorId: primary.id }
    });
  } catch (e) {}

  // 4. Update primary metrics & profile details
  const mergedCitations = Math.max(primary.totalCitations || 0, secondary.totalCitations || 0);
  const mergedHIndex = Math.max(primary.hIndex || 0, secondary.hIndex || 0);
  const mergedOrcid = primary.orcid || secondary.orcid || null;
  const mergedInstitution = primary.institution || secondary.institution || null;
  const mergedOpenAlexId = primary.openAlexId || secondary.openAlexId || null;
  const mergedPasswordHash = primary.passwordHash || secondary.passwordHash || null;
  const mergedBio = primary.bio || secondary.bio || null;
  const mergedDepartment = primary.department || secondary.department || null;

  await prisma.user.update({
    where: { id: primary.id },
    data: {
      passwordHash: mergedPasswordHash,
      totalCitations: mergedCitations,
      hIndex: mergedHIndex,
      orcid: mergedOrcid,
      institution: mergedInstitution,
      department: mergedDepartment,
      bio: mergedBio,
      openAlexId: mergedOpenAlexId,
      isClaimed: true
    }
  });

  // 5. Delete duplicate secondary user record
  await prisma.user.delete({
    where: { id: secondary.id }
  });

  console.log(`Merge complete! Secondary account ${secondary.id} deleted. Primary account ${primary.email} updated with ${mergedCitations} citations and ${mergedHIndex} h-index.`);
}

// Check CLI arguments
const args = process.argv.slice(2);
const target = args[0] || "wanjohi@kenpro.org";
const source = args[1];

if (!source) {
  console.log("Usage: node scripts/merge-scholar-accounts.js <primaryEmailOrId> <secondaryEmailOrId>");
  console.log("Checking for any duplicate Wanjohi accounts in DB...");
  prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "Wanjohi" } },
        { email: { contains: "wanjohi" } }
      ]
    },
    select: { id: true, name: true, email: true, totalCitations: true, isClaimed: true }
  }).then(results => {
    console.log("Accounts found:", results);
    prisma.$disconnect().then(() => pool.end());
  });
} else {
  mergeScholarAccounts(target, source)
    .catch(console.error)
    .finally(() => prisma.$disconnect().then(() => pool.end()));
}
