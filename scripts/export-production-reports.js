const mariadb = require('mariadb');
const fs = require('fs');

async function exportSql() {
  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    const reports = await conn.query(`
      SELECT id, year, standardScore, regionalScore, citationCount, articleCount, 
             journalId, disciplineRank, primaryDiscipline, quartile, totalInDiscipline 
      FROM ImpactFactorReport 
      WHERE year = 2025
    `);

    let sql = '-- Production SQL update patch for AfriJournal Index (2025 Standardized Reports)\n';
    sql += 'DELETE FROM ImpactFactorReport WHERE year = 2025;\n\n';

    for (const r of reports) {
      const rankVal = r.disciplineRank !== null ? r.disciplineRank : 'NULL';
      const primaryDisc = r.primaryDiscipline ? `'${r.primaryDiscipline.replace(/'/g, "''")}'` : 'NULL';
      const quart = r.quartile ? `'${r.quartile}'` : 'NULL';
      const regScore = r.regionalScore !== null ? r.regionalScore : 'NULL';
      const totDisc = r.totalInDiscipline !== null ? r.totalInDiscipline : 'NULL';

      sql += `INSERT INTO ImpactFactorReport (id, year, standardScore, regionalScore, citationCount, articleCount, journalId, disciplineRank, primaryDiscipline, quartile, totalInDiscipline, createdAt) VALUES ('${r.id}', 2025, ${r.standardScore}, ${regScore}, ${r.citationCount}, ${r.articleCount}, '${r.journalId}', ${rankVal}, ${primaryDisc}, ${quart}, ${totDisc}, NOW());\n`;
    }

    fs.writeFileSync('production_citation_update.sql', sql, 'utf8');
    console.log(`Successfully exported ${reports.length} standardized reports to production_citation_update.sql`);
  } catch (err) {
    console.error('Error exporting SQL:', err);
  } finally {
    await conn.release();
    await pool.end();
  }
}

exportSql();
