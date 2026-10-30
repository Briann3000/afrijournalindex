const mariadb = require('mariadb');
const dotenv = require('dotenv');
dotenv.config();

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

const pool = mariadb.createPool({
  host,
  port,
  user,
  password,
  database,
  connectionLimit: 2
});

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log("Checking columns in institution table...");
    const cols = await conn.query("DESCRIBE institution");
    const colNames = cols.map(c => c.Field);

    const additions = [
      { name: "logoUrl", sql: "ALTER TABLE `institution` ADD COLUMN `logoUrl` TEXT NULL" },
      { name: "bannerUrl", sql: "ALTER TABLE `institution` ADD COLUMN `bannerUrl` TEXT NULL" },
      { name: "isKenproVerified", sql: "ALTER TABLE `institution` ADD COLUMN `isKenproVerified` TINYINT(1) NOT NULL DEFAULT 0" },
      { name: "verificationDate", sql: "ALTER TABLE `institution` ADD COLUMN `verificationDate` DATETIME NULL" },
      { name: "verificationDocUrl", sql: "ALTER TABLE `institution` ADD COLUMN `verificationDocUrl` TEXT NULL" },
      { name: "accreditationBody", sql: "ALTER TABLE `institution` ADD COLUMN `accreditationBody` VARCHAR(255) NULL" },
      { name: "contactEmail", sql: "ALTER TABLE `institution` ADD COLUMN `contactEmail` VARCHAR(191) NULL" },
      { name: "metadataSyncedAt", sql: "ALTER TABLE `institution` ADD COLUMN `metadataSyncedAt` DATETIME NULL" }
    ];

    for (const item of additions) {
      if (!colNames.includes(item.name)) {
        console.log(`Adding column ${item.name}...`);
        await conn.query(item.sql);
      } else {
        console.log(`Column ${item.name} already exists.`);
      }
    }

    // Now ensure KENPRO is marked as verified with logo
    console.log("Updating KENPRO record with verified status and logo...");
    await conn.query(`
      UPDATE \`institution\`
      SET 
        \`isKenproVerified\` = 1,
        \`isClaimed\` = 1,
        \`verificationDate\` = NOW(),
        \`accreditationBody\` = 'Kenya Projects Organization (KENPRO) Academic Research Directorate',
        \`websiteUrl\` = 'https://www.kenpro.org',
        \`logoUrl\` = 'https://www.kenpro.org/wp-content/uploads/2019/08/cropped-kenpro-logo-final-1-192x192.png',
        \`domain\` = 'kenpro.org'
      WHERE \`domain\` = 'kenpro.org' OR \`name\` LIKE '%KENPRO%'
    `);

    const updated = await conn.query("SELECT id, name, isKenproVerified, logoUrl, accreditationBody FROM institution WHERE domain = 'kenpro.org'");
    console.log("Updated KENPRO row:", updated);

  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch(console.error);
