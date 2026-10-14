const mariadb = require("mariadb");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

let host = process.env.DB_HOST || "localhost";
let port = parseInt(process.env.DB_PORT || "3306", 10);
let user = process.env.DB_USERNAME || "root";
let password = process.env.DB_PASSWORD || "";
let database = process.env.DB_DATABASE || "afrijournalindex";

if (process.env.DATABASE_URL && (!process.env.DB_HOST || !process.env.DB_DATABASE)) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    host = parsed.hostname || host;
    port = parsed.port ? parseInt(parsed.port, 10) : port;
    user = decodeURIComponent(parsed.username || user);
    password = decodeURIComponent(parsed.password || password);
    database = parsed.pathname ? parsed.pathname.replace(/^\//, "") : database;
  } catch (e) {}
}

function escapeSql(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "1" : "0";
  if (typeof val === "number") return val.toString();
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  
  // String escaping
  const escaped = val
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
  return `'${escaped}'`;
}

async function exportSql() {
  const pool = mariadb.createPool({ host, port, user, password, database, connectionLimit: 5 });
  const conn = await pool.getConnection();

  const outputFile = path.join(__dirname, "..", "afrijournal_dump.sql");
  const writeStream = fs.createWriteStream(outputFile, { encoding: "utf8" });

  console.log(`\n======================================================`);
  console.log(`📦 EXPORTING MYSQL DATABASE TO: afrijournal_dump.sql`);
  console.log(`======================================================\n`);

  writeStream.write(`-- AfriJournal Index MySQL Production Database Dump\n`);
  writeStream.write(`-- Generated at: ${new Date().toISOString()}\n`);
  writeStream.write(`-- Server: ${host}:${port}, Database: ${database}\n\n`);
  writeStream.write(`SET NAMES utf8mb4;\n`);
  writeStream.write(`SET FOREIGN_KEY_CHECKS = 0;\n`);
  writeStream.write(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`);
  writeStream.write(`START TRANSACTION;\n\n`);

  try {
    const tables = [
      "user",
      "journal",
      "submission",
      "article",
      "citation",
      "claimedpublication",
      "comment",
      "impactfactorreport",
      "payment"
    ];

    for (const table of tables) {
      console.log(`Exporting table: \`${table}\`...`);
      
      // Check if table exists
      try {
        const createTableRes = await conn.query(`SHOW CREATE TABLE \`${table}\``);
        const createTableSql = createTableRes[0]["Create Table"];
        
        writeStream.write(`-- -----------------------------------------------------\n`);
        writeStream.write(`-- Table structure for \`${table}\`\n`);
        writeStream.write(`-- -----------------------------------------------------\n`);
        writeStream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
        writeStream.write(`${createTableSql};\n\n`);

        // Fetch rows in batches
        const countRes = await conn.query(`SELECT COUNT(*) as total FROM \`${table}\``);
        const totalRows = Number(countRes[0].total);
        console.log(`  -> Found ${totalRows} rows in \`${table}\``);

        if (totalRows > 0) {
          writeStream.write(`-- Dumping data for table \`${table}\`\n`);
          const batchSize = 500;
          let offset = 0;

          while (offset < totalRows) {
            const rows = await conn.query(`SELECT * FROM \`${table}\` LIMIT ${batchSize} OFFSET ${offset}`);
            if (rows.length === 0) break;

            const columns = Object.keys(rows[0]);
            const colList = columns.map(c => `\`${c}\``).join(", ");

            writeStream.write(`INSERT INTO \`${table}\` (${colList}) VALUES\n`);
            
            const valueLines = rows.map(row => {
              const vals = columns.map(col => escapeSql(row[col]));
              return `  (${vals.join(", ")})`;
            });

            writeStream.write(valueLines.join(",\n") + ";\n\n");
            offset += rows.length;
            process.stdout.write(`  -> Exported ${offset}/${totalRows} rows...\r`);
          }
          console.log(`  -> Finished exporting \`${table}\` (${totalRows} rows).`);
        }
      } catch (tableErr) {
        console.warn(`  Notice: Table \`${table}\` not found or skipped:`, tableErr.message);
      }
    }

    writeStream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
    writeStream.write(`COMMIT;\n`);
    writeStream.end();

    console.log(`\n======================================================`);
    console.log(`✅ DATABASE EXPORT COMPLETE!`);
    console.log(`📁 File saved at: ${outputFile}`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error("Export failed:", err);
  } finally {
    conn.release();
    await pool.end();
  }
}

exportSql();
