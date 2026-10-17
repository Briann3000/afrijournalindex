const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function exportDatabaseSqlWithSchema() {
  console.log('=== Exporting MariaDB/MySQL Production Database with Auto-Schema Alterations ===\n');

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    const tables = ['journal', 'article', 'citation', 'impactfactorreport', 'user', 'submission', 'comment', 'claimedpublication', 'payment'];

    let sqlDump = `-- AfriJournal Index Production Database Export (cPanel Ready)
-- Generated: ${new Date().toISOString()}
-- Platform: MariaDB / MySQL
SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Ensure new columns exist on cPanel tables before importing data
-- 1. Article 'url' column
SET @exist_art_url := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'article' AND COLUMN_NAME = 'url');
SET @sql_art_url := IF(@exist_art_url = 0, 'ALTER TABLE \`article\` ADD COLUMN \`url\` TEXT NULL AFTER \`abstract\`', 'SELECT 1');
PREPARE stmt_art FROM @sql_art_url;
EXECUTE stmt_art;
DEALLOCATE PREPARE stmt_art;

-- 2. Citation 'citingVenue' column
SET @exist_cite_venue := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'citation' AND COLUMN_NAME = 'citingVenue');
SET @sql_cite_venue := IF(@exist_cite_venue = 0, 'ALTER TABLE \`citation\` ADD COLUMN \`citingVenue\` VARCHAR(500) NULL', 'SELECT 1');
PREPARE stmt_cite1 FROM @sql_cite_venue;
EXECUTE stmt_cite1;
DEALLOCATE PREPARE stmt_cite1;

-- 3. Citation 'citingCountry' column
SET @exist_cite_country := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'citation' AND COLUMN_NAME = 'citingCountry');
SET @sql_cite_country := IF(@exist_cite_country = 0, 'ALTER TABLE \`citation\` ADD COLUMN \`citingCountry\` VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt_cite2 FROM @sql_cite_country;
EXECUTE stmt_cite2;
DEALLOCATE PREPARE stmt_cite2;

`;

    for (const table of tables) {
      try {
        const rows = await conn.query(`SELECT * FROM \`${table}\``);
        console.log(`Exported ${rows.length} rows from table '${table}'`);

        if (rows.length > 0) {
          sqlDump += `-- Dumping data for table \`${table}\`\n`;
          sqlDump += `TRUNCATE TABLE \`${table}\`;\n`;

          const columns = Object.keys(rows[0]);
          const colList = columns.map(c => `\`${c}\``).join(', ');

          for (let i = 0; i < rows.length; i += 100) {
            const batch = rows.slice(i, i + 100);
            const valueStrings = batch.map(row => {
              const vals = columns.map(col => {
                const val = row[col];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number') return val;
                if (typeof val === 'boolean') return val ? 1 : 0;
                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                return `'${str}'`;
              });
              return `(${vals.join(', ')})`;
            });

            sqlDump += `INSERT INTO \`${table}\` (${colList}) VALUES\n${valueStrings.join(',\n')};\n`;
          }
          sqlDump += '\n';
        }
      } catch (err) {
        console.warn(`Could not export table '${table}': ${err.message}`);
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS=1;\nCOMMIT;\n`;

    const outPath = path.join(__dirname, '..', 'cpanel-db-dump.sql');
    fs.writeFileSync(outPath, sqlDump, 'utf8');

    const zipPath = path.join(__dirname, '..', 'database-cpanel-dump.zip');
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

    execSync(`powershell -Command "Compress-Archive -Path '${outPath}' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });

    const sizeMb = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
    console.log(`\nSuccessfully created self-migrating database-cpanel-dump.zip (${sizeMb} MB)!`);

  } finally {
    conn.release();
    await pool.end();
  }
}

exportDatabaseSqlWithSchema().catch(console.error);
