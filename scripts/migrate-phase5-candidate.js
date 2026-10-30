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
    console.log("Checking journal_candidate table in database...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`journal_candidate\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`journalName\` VARCHAR(500) NOT NULL,
        \`issn\` VARCHAR(50) NULL,
        \`eissn\` VARCHAR(50) NULL,
        \`publisherName\` VARCHAR(500) NULL,
        \`institutionName\` VARCHAR(500) NULL,
        \`country\` VARCHAR(100) NOT NULL DEFAULT 'Pan-African',
        \`websiteUrl\` TEXT NULL,
        \`editorName\` VARCHAR(255) NULL,
        \`editorEmail\` VARCHAR(191) NOT NULL,
        \`discipline\` VARCHAR(150) NULL DEFAULT 'Multidisciplinary',
        \`invitationTrack\` VARCHAR(50) NOT NULL DEFAULT 'FREE_INDEXING',
        \`invitationStatus\` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        \`invitedAt\` DATETIME NULL,
        \`inviteToken\` VARCHAR(100) NULL UNIQUE,
        \`notes\` TEXT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`journal_candidate_editorEmail_idx\` (\`editorEmail\`),
        INDEX \`journal_candidate_country_idx\` (\`country\`),
        INDEX \`journal_candidate_invitationTrack_idx\` (\`invitationTrack\`),
        INDEX \`journal_candidate_invitationStatus_idx\` (\`invitationStatus\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("✔ Table `journal_candidate` verified/created successfully.");
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch(console.error);
