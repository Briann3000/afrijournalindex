const mariadb = require('mariadb');
require('dotenv').config({ path: '.env' });

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "afrijournalindex",
  connectionLimit: 2
});

async function main() {
  const conn = await pool.getConnection();
  console.log("Checking columns on table 'user'...");
  const rows = await conn.query('DESCRIBE user');
  const cols = new Set(rows.map(r => r.Field));

  if (!cols.has('afriScholarId')) {
    console.log("Adding column afriScholarId to table 'user'...");
    await conn.query('ALTER TABLE user ADD COLUMN afriScholarId VARCHAR(30) NULL UNIQUE');
    console.log("Column afriScholarId successfully added!");
  } else {
    console.log("Column afriScholarId already exists.");
  }

  conn.release();
}

main().catch(console.error).finally(() => pool.end());
