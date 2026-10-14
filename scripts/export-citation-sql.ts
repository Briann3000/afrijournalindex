import { prisma } from '../src/lib/db';
import * as fs from 'fs';

async function generateSql() {
  const articles = await prisma.article.findMany({
    where: { citationCount: { gt: 0 } },
    select: { id: true, citationCount: true }
  });

  let sql = '-- Production SQL update patch for AfriJournal Index\n';
  sql += '-- 1. Ensure citationCount column exists\n';
  sql += 'ALTER TABLE Article ADD COLUMN IF NOT EXISTS citationCount INT DEFAULT 0;\n\n';
  
  sql += '-- 2. Recalibrate JBSHA score (from 11.75 to 4.573 based on 2-year international citable window)\n';
  sql += "UPDATE ImpactFactorReport SET standardScore = 4.573, regionalScore = 5.259, citationCount = 146, articleCount = 32 WHERE id = '10fe53b9-e1af-4736-9816-a89c729953d2';\n\n";

  sql += `-- 3. Populate verified citation counts across ${articles.length} articles\n`;
  for (const a of articles) {
    sql += `UPDATE Article SET citationCount = ${a.citationCount} WHERE id = '${a.id}';\n`;
  }

  fs.writeFileSync('production_citation_update.sql', sql, 'utf8');
  console.log(`Generated production_citation_update.sql with ${articles.length} article updates successfully.`);
}

generateSql()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
