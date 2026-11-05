const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "afrijournalindex"
});

async function main() {
  const conn = await pool.getConnection();
  try {
    const scholars = await conn.query("SELECT id, afriScholarId FROM user WHERE afriScholarId IS NOT NULL");
    console.log(`Found ${scholars.length} scholars with afriScholarId.`);

    let sql = `-- ========================================================\n`;
    sql += `-- AfriScholar ID (ASID) Production Sync Script for cPanel\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- ========================================================\n\n`;

    sql += `-- Step 1: Safely add afriScholarId column to user table if not present\n`;
    sql += `SET @col_exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'afriScholarId');\n`;
    sql += `SET @sql_add_col := IF(@col_exist = 0, 'ALTER TABLE \`user\` ADD COLUMN \`afriScholarId\` VARCHAR(30) NULL UNIQUE', 'SELECT 1');\n`;
    sql += `PREPARE stmt_add_col FROM @sql_add_col;\n`;
    sql += `EXECUTE stmt_add_col;\n`;
    sql += `DEALLOCATE PREPARE stmt_add_col;\n\n`;

    sql += `-- Step 2: Sync exact persistent AfriScholar IDs\n`;
    sql += `START TRANSACTION;\n`;

    for (const s of scholars) {
      const cleanAsid = s.afriScholarId.replace(/'/g, "\\'");
      const cleanId = s.id.replace(/'/g, "\\'");
      sql += `UPDATE \`user\` SET \`afriScholarId\` = '${cleanAsid}' WHERE \`id\` = '${cleanId}';\n`;
    }

    sql += `COMMIT;\n\n`;
    sql += `-- Done! All ${scholars.length} scholars now have their exact persistent ASIDs synced.\n`;

    const outPath = path.join(__dirname, '..', 'cpanel_update_afrischolar_ids.sql');
    fs.writeFileSync(outPath, sql, 'utf8');
    const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
    console.log(`Successfully generated cpanel_update_afrischolar_ids.sql (${sizeKb} KB) with ${scholars.length} updates!`);
  } finally {
    conn.release();
    pool.end();
  }
}

main().catch(console.error);
