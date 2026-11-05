const mariadb = require('mariadb');
require('dotenv').config({ path: '.env' });

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CHAR_TO_VAL = {};
for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
  CHAR_TO_VAL[CROCKFORD_ALPHABET[i]] = i;
}

function computeChecksum(payload11) {
  let sum = 0;
  for (let i = 0; i < payload11.length; i++) {
    const char = payload11[i].toUpperCase();
    const val = CHAR_TO_VAL[char] ?? 0;
    sum += val * (i + 1);
  }
  const checkVal = sum % 32;
  return CROCKFORD_ALPHABET[checkVal];
}

function generateAfriScholarId() {
  let payload = "";
  for (let i = 0; i < 11; i++) {
    const randIdx = Math.floor(Math.random() * CROCKFORD_ALPHABET.length);
    payload += CROCKFORD_ALPHABET[randIdx];
  }
  const checkChar = computeChecksum(payload);
  const full12 = payload + checkChar;
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
  const conn = await pool.getConnection();
  try {
    console.log("Fetching users without afriScholarId...");
    const users = await conn.query("SELECT id, name, email FROM user WHERE afriScholarId IS NULL");
    console.log(`Found ${users.length} users requiring AfriScholar ID assignment.`);

    if (users.length === 0) {
      console.log("All scholars already have an AfriScholar ID.");
      return;
    }

    const existingIds = new Set();
    const existingRows = await conn.query("SELECT afriScholarId FROM user WHERE afriScholarId IS NOT NULL");
    for (const r of existingRows) {
      existingIds.add(r.afriScholarId);
    }

    let updatedCount = 0;
    for (const user of users) {
      let asid = generateAfriScholarId();
      while (existingIds.has(asid)) {
        asid = generateAfriScholarId();
      }
      existingIds.add(asid);

      await conn.query("UPDATE user SET afriScholarId = ? WHERE id = ?", [asid, user.id]);
      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === users.length) {
        console.log(`Updated ${updatedCount}/${users.length} scholars... (Latest: ${user.name} -> ${asid})`);
      }
    }

    console.log(`Successfully assigned unique AfriScholar IDs to all ${updatedCount} users.`);
  } finally {
    conn.release();
  }
}

main().catch(console.error).finally(() => pool.end());
