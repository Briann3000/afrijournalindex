const mariadb = require('mariadb');

async function main() {
  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(`
      SELECT u.id, u.name, u.email, u.institution, u.orcid,
             COUNT(cp.id) as claimsCount,
             COALESCE(SUM(a.citationCount), 0) as totalCites
      FROM User u
      LEFT JOIN ClaimedPublication cp ON cp.userId = u.id AND cp.status = 'VERIFIED'
      LEFT JOIN Article a ON a.id = cp.articleId
      GROUP BY u.id
      ORDER BY totalCites DESC
      LIMIT 30
    `);
    console.log("Top 30 scholars in DB:");
    rows.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.name} | ${r.institution} | Citations: ${r.totalCites} | ORCID: ${r.orcid || 'None'}`);
    });
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch(console.error);
