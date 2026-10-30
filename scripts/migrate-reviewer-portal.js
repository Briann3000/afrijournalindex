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
    console.log("Checking and creating manuscript_review_request table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`manuscript_review_request\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`trackingCode\` VARCHAR(50) NOT NULL,
        \`authorId\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(500) NOT NULL,
        \`abstract\` LONGTEXT NOT NULL,
        \`discipline\` VARCHAR(150) NOT NULL,
        \`targetJournal\` VARCHAR(255) NULL,
        \`manuscriptFileUrl\` TEXT NOT NULL,
        \`supplementaryUrl\` TEXT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'AWAITING_REVIEWER',
        \`excludedReviewers\` TEXT NULL,
        \`candidateQueue\` TEXT NOT NULL,
        \`currentCascadeIndex\` INT NOT NULL DEFAULT 0,
        \`completedAt\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`manuscript_review_request_trackingCode_key\` (\`trackingCode\`),
        INDEX \`manuscript_review_request_authorId_idx\` (\`authorId\`),
        INDEX \`manuscript_review_request_status_idx\` (\`status\`),
        CONSTRAINT \`fk_mrr_author\` FOREIGN KEY (\`authorId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Checking and creating manuscript_review_assignment table...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`manuscript_review_assignment\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`reviewRequestId\` VARCHAR(191) NOT NULL,
        \`reviewerId\` VARCHAR(191) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'INVITED',
        \`invitationToken\` VARCHAR(100) NOT NULL,
        \`invitationExpiresAt\` DATETIME(3) NOT NULL,
        \`reviewDeadlineAt\` DATETIME(3) NULL,
        \`methodologyScore\` INT NULL,
        \`originalityScore\` INT NULL,
        \`literatureScore\` INT NULL,
        \`integrityScore\` INT NULL,
        \`presentationScore\` INT NULL,
        \`overallRecommendation\` VARCHAR(50) NULL,
        \`feedbackSummary\` TEXT NULL,
        \`methodologyCritique\` LONGTEXT NULL,
        \`literatureCritique\` LONGTEXT NULL,
        \`actionableRevisions\` LONGTEXT NULL,
        \`confidentialNotes\` TEXT NULL,
        \`certificateIssued\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`certificateVerificationId\` VARCHAR(100) NULL,
        \`completedAt\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`manuscript_review_assignment_invitationToken_key\` (\`invitationToken\`),
        UNIQUE KEY \`manuscript_review_assignment_cert_key\` (\`certificateVerificationId\`),
        UNIQUE KEY \`manuscript_review_assignment_request_reviewer_key\` (\`reviewRequestId\`, \`reviewerId\`),
        INDEX \`manuscript_review_assignment_reviewerId_idx\` (\`reviewerId\`),
        INDEX \`manuscript_review_assignment_status_idx\` (\`status\`),
        CONSTRAINT \`fk_mra_request\` FOREIGN KEY (\`reviewRequestId\`) REFERENCES \`manuscript_review_request\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_mra_reviewer\` FOREIGN KEY (\`reviewerId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    conn.release();
    pool.end();
  }
}

migrate();
