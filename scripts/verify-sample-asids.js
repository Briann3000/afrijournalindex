const mariadb = require('mariadb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function verify() {
  const pool = mariadb.createPool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "afrijournalindex"
  });
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query("SELECT id, name, email, afriScholarId FROM `user` WHERE name LIKE '%Wanjohi%' OR name LIKE '%Kengne%' OR id IS NOT NULL LIMIT 8");
    console.log("Sample Updated Scholars:");
    console.table(rows);
  } finally {
    conn.release();
    await pool.end();
  }
}

verify();
