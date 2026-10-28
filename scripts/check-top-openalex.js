require('dotenv').config({ path: '.env' });
const mariadb = require('mariadb');

async function lookupTop() {
  const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  try {
    const res = await pool.query(
      "SELECT id, name, openAlexId, totalCitations, hIndex FROM user WHERE totalCitations > 50000 ORDER BY totalCitations DESC LIMIT 35"
    );
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

lookupTop();
