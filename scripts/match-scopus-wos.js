const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mariadb = require('mariadb');
require('dotenv').config();

async function matchScopusAndWos() {
  const scopusPath = path.join(__dirname, '..', 'scimagojr 2025.csv');
  if (!fs.existsSync(scopusPath)) {
    console.error('scimagojr 2025.csv not found at:', scopusPath);
    process.exit(1);
  }

  console.log('Loading Scopus dataset from:', scopusPath);
  const scopusIssns = new Set();
  const rl = readline.createInterface({
    input: fs.createReadStream(scopusPath),
    crlfDelay: Infinity
  });

  let isHeader = true;
  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    const parts = line.split(';');
    const rawIssn = parts[4] ? parts[4].replace(/"/g, '') : '';
    if (rawIssn) {
      rawIssn.split(',').forEach(item => {
        const clean = item.replace(/[^0-9X]/gi, '').toUpperCase();
        if (clean.length === 8) {
          scopusIssns.add(clean);
        }
      });
    }
  }

  console.log(`Loaded ${scopusIssns.size} verified Scopus ISSNs from 2025 SCImago master index.`);

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    const journals = await conn.query('SELECT id, name, issn, eissn FROM journal');
    console.log(`Auditing ${journals.length} African journals in database...`);

    let scopusCount = 0;
    for (const j of journals) {
      const c1 = (j.issn || '').replace(/[^0-9X]/gi, '').toUpperCase();
      const c2 = (j.eissn || '').replace(/[^0-9X]/gi, '').toUpperCase();

      const isScopus = (c1 && scopusIssns.has(c1)) || (c2 && scopusIssns.has(c2));
      if (isScopus) {
        await conn.query('UPDATE journal SET isScopusIndexed = 1 WHERE id = ?', [j.id]);
        scopusCount++;
      }
    }

    console.log(`===============================================`);
    console.log(`✅ Genuine Scopus-Indexed African Journals Found: ${scopusCount}`);
    console.log(`===============================================`);
  } finally {
    await conn.end();
    await pool.end();
  }
}

matchScopusAndWos().catch(e => {
  console.error('Error matching Scopus/WoS:', e);
  process.exit(1);
});
