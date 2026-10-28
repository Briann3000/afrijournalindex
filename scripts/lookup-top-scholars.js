require('dotenv').config({ path: '.env' });
const mariadb = require('mariadb');

async function lookup() {
  const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  try {
    const mensah = await pool.query("SELECT id, name, email, openAlexId, totalCitations, hIndex FROM user WHERE name LIKE '%Mensah%'");
    console.log("Mensah users:", mensah);

    const topScholars = await pool.query("SELECT id, name, email, openAlexId, totalCitations, hIndex FROM user ORDER BY totalCitations DESC LIMIT 15");
    console.log("Top scholars by citations:", topScholars);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

lookup();
