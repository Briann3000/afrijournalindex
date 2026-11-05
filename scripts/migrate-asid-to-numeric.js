const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function computeChecksum(payload11) {
  let sum = 0;
  for (let i = 0; i < payload11.length; i++) {
    const digit = parseInt(payload11[i], 10) || 0;
    const weight = (i % 2 === 0) ? 1 : 3;
    sum += digit * weight;
  }
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit.toString();
}

function generateAfriScholarId() {
  let payload = Math.floor(Math.random() * 9 + 1).toString();
  for (let i = 1; i < 11; i++) {
    payload += Math.floor(Math.random() * 10).toString();
  }
  const checkDigit = computeChecksum(payload);
  const full12 = payload + checkDigit;
  return `ASID-${full12.slice(0, 4)}-${full12.slice(4, 8)}-${full12.slice(8, 12)}`;
}

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "afrijournalindex",
  connectionLimit: 4
});

async function main() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("Connected to database.");
    
    // Select all users
    const users = await conn.query("SELECT id, name, email, afriScholarId FROM `user` ORDER BY id ASC");
    console.log(`Found ${users.length} total users/scholars in database.`);

    const generatedIds = new Set();
    const updates = [];

    for (const u of users) {
      let numericAsid;
      do {
        numericAsid = generateAfriScholarId();
      } while (generatedIds.has(numericAsid));
      generatedIds.add(numericAsid);

      updates.push({
        id: u.id,
        name: u.name,
        email: u.email,
        oldAsid: u.afriScholarId,
        newAsid: numericAsid
      });
    }

    // Apply updates to local database if connected
    console.log(`Applying numeric ASID updates to database...`);
    for (const up of updates) {
      await conn.query("UPDATE `user` SET `afriScholarId` = ? WHERE `id` = ?", [up.newAsid, up.id]);
    }
    console.log(`Updated ${updates.length} users with 12-digit numeric ASIDs.`);

    // Generate cPanel production SQL script
    let sql = `-- ==========================================================================\n`;
    sql += `-- Production SQL Migration: Complete Switch of AfriScholar ID (ASID) to 12 Numbers\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Format: ASID-XXXX-XXXX-XXXX (Pure numeric 12 digits, e.g. ASID-4821-9504-2946)\n`;
    sql += `-- ==========================================================================\n\n`;
    sql += `START TRANSACTION;\n\n`;

    for (const up of updates) {
      const cleanId = String(up.id).replace(/'/g, "\\'");
      const cleanNewAsid = String(up.newAsid).replace(/'/g, "\\'");
      const scholarName = (up.name || up.email || "Scholar").replace(/'/g, "\\'");
      sql += `-- ${scholarName} (Was: ${up.oldAsid || 'NONE'})\n`;
      sql += `UPDATE \`user\` SET \`afriScholarId\` = '${cleanNewAsid}' WHERE \`id\` = '${cleanId}';\n`;
    }

    sql += `\nCOMMIT;\n`;

    const outSqlPath = path.join(__dirname, '..', 'scripts', 'cpanel_asid_numeric_migration.sql');
    fs.writeFileSync(outSqlPath, sql, 'utf8');
    console.log(`Successfully generated cpanel_asid_numeric_migration.sql with ${updates.length} statements!`);

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

main();
