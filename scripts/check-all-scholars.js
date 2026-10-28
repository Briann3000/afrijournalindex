require('dotenv').config({ path: '.env' });
const mariadb = require('mariadb');

async function stats() {
  const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  try {
    const res = await pool.query(
      "SELECT COUNT(*) as totalUsers, COUNT(openAlexId) as withOa, SUM(CASE WHEN totalCitations > 0 THEN 1 ELSE 0 END) as withCites FROM user"
    );
    console.log("Stats:", res);

    const sample = await pool.query(
      "SELECT name, totalCitations, hIndex, openAlexId FROM user ORDER BY RAND() LIMIT 10"
    );
    console.log("Random sample:", sample);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

stats();
