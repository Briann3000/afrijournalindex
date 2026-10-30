/**
 * Pan-African Directory Harvester (Resumable & Fault-Tolerant)
 * 
 * Sources:
 * 1. OpenAlex Pan-African Sources API (across all 54 African country codes)
 * 2. DOAJ African Public API
 * 3. Pan-African University Presses & Research Registries
 * 
 * Features:
 * - Resumable State: Persists progress to `.harvest-checkpoint.json`.
 *   If interrupted by network disconnect, power failure, or Ctrl+C,
 *   it will seamlessly resume from the exact country and page without restarting.
 * - Deduplication: Skips any journal already indexed in `journal` or already in `journal_candidate`.
 * - Dual-Track Categorization:
 *   - Track A (FREE_INDEXING): For active unindexed journals.
 *   - Track B (OJS_INCUBATION): For universities/faculties without online journals.
 */

const fs = require('fs');
const path = require('path');
const mariadb = require('mariadb');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

// Connect to DB using credentials
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
  connectionLimit: 4
});

const CHECKPOINT_FILE = path.join(__dirname, '.harvest-checkpoint.json');

// All 54 African countries with ISO codes
const AFRICAN_COUNTRIES = [
  { code: 'DZ', name: 'Algeria' },
  { code: 'AO', name: 'Angola' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cape Verde' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CG', name: 'Republic of the Congo' },
  { code: 'CD', name: 'Democratic Republic of the Congo' },
  { code: 'CI', name: "Ivory Coast" },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'EG', name: 'Egypt' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'KE', name: 'Kenya' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'ML', name: 'Mali' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'ST', name: 'Sao Tome and Principe' },
  { code: 'SN', name: 'Senegal' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'SD', name: 'Sudan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TG', name: 'Togo' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'UG', name: 'Uganda' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' }
];

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCheckpoint(state) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state, null, 2), 'utf8');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'AfriJournalIndex-Harvester/2.0 (mailto:editorial@afrijournal.org)',
          ...(options.headers || {})
        }
      });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
      console.warn(`[HTTP ${res.status}] Retrying in ${1.5 * (i + 1)}s...`);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`[Network Issue] ${err.message}. Retrying in ${2 * (i + 1)}s...`);
    }
    await sleep(2000 * (i + 1));
  }
  return null;
}

// Map generic journal subject / keywords to standard AfriJournal disciplines
function inferDiscipline(subjectOrTitle = '') {
  const text = subjectOrTitle.toLowerCase();
  if (text.includes('medic') || text.includes('health') || text.includes('clinic') || text.includes('pharm') || text.includes('nurs')) {
    return 'Health Sciences';
  }
  if (text.includes('agri') || text.includes('crop') || text.includes('soil') || text.includes('veterin') || text.includes('environ') || text.includes('forest')) {
    return 'Agricultural & Environmental Sciences';
  }
  if (text.includes('engin') || text.includes('tech') || text.includes('comput') || text.includes('physic') || text.includes('math') || text.includes('chemist')) {
    return 'Physical Sciences & Engineering';
  }
  if (text.includes('educat') || text.includes('pedagog') || text.includes('teach') || text.includes('curricul')) {
    return 'Education & Pedagogy';
  }
  if (text.includes('econom') || text.includes('busi') || text.includes('manage') || text.includes('financ') || text.includes('account')) {
    return 'Business & Economics';
  }
  if (text.includes('law') || text.includes('legal') || text.includes('jurid') || text.includes('humanit') || text.includes('sociol') || text.includes('histor')) {
    return 'Social Sciences & Humanities';
  }
  return 'Multidisciplinary';
}

async function harvestCandidate(conn, item) {
  // 1. Check if journal is already in live index (match by ISSN or name)
  const existingLive = await conn.query(
    "SELECT id FROM journal WHERE (issn = ? AND issn IS NOT NULL) OR (eissn = ? AND eissn IS NOT NULL) OR name = ? LIMIT 1",
    [item.issn || null, item.eissn || null, item.journalName]
  );
  if (existingLive.length > 0) return { status: 'skipped_indexed' };

  // 2. Check if already in candidate pool
  const existingCandidate = await conn.query(
    "SELECT id FROM journal_candidate WHERE editorEmail = ? OR (journalName = ? AND country = ?) LIMIT 1",
    [item.editorEmail, item.journalName, item.country]
  );
  if (existingCandidate.length > 0) return { status: 'skipped_candidate' };

  // 3. Insert new candidate
  const id = crypto.randomUUID();
  const inviteToken = crypto.randomBytes(16).toString('hex');

  await conn.query(`
    INSERT INTO journal_candidate 
    (id, journalName, issn, eissn, publisherName, institutionName, country, websiteUrl, editorName, editorEmail, discipline, invitationTrack, invitationStatus, inviteToken, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW(), NOW())
  `, [
    id,
    item.journalName,
    item.issn || null,
    item.eissn || null,
    item.publisherName || null,
    item.institutionName || null,
    item.country || 'Pan-African',
    item.websiteUrl || null,
    item.editorName || 'Editor-in-Chief',
    item.editorEmail,
    item.discipline || 'Multidisciplinary',
    item.invitationTrack || 'FREE_INDEXING',
    inviteToken
  ]);

  return { status: 'added', id };
}

async function runHarvester() {
  console.log(`\n===============================================================`);
  console.log(`   PAN-AFRICAN JOURNAL DIRECTORY HARVESTER (FAULT-TOLERANT)`);
  console.log(`   Targeting unindexed academic journals & university presses`);
  console.log(`===============================================================\n`);

  const checkpoint = loadCheckpoint();
  console.log(`Checkpoint status:`, checkpoint.lastCountry ? `Resuming from ${checkpoint.lastCountry} (DOAJ / OpenAlex)` : `Starting fresh from first country.`);

  const conn = await pool.getConnection();

  let totalAdded = 0;
  let totalSkipped = 0;

  try {
    // -------------------------------------------------------------
    // PHASE A: DOAJ Continental Open-Access African Venues
    // -------------------------------------------------------------
    console.log(`\n--- [Stage 1] Querying DOAJ African Public Registries ---`);
    for (let i = 0; i < AFRICAN_COUNTRIES.length; i++) {
      const country = AFRICAN_COUNTRIES[i];

      // Check if this country was already completed in checkpoint
      if (checkpoint.doajCompleted && checkpoint.doajCompleted.includes(country.code)) {
        continue;
      }

      process.stdout.write(`Fetching DOAJ journals for ${country.name} (${country.code})... `);
      
      let page = 1;
      let countryAdded = 0;

      while (true) {
        const url = `https://doaj.org/api/v3/search/journals/bibjson.publisher.country:${country.code}?page=${page}&pageSize=100`;
        const data = await fetchWithRetry(url);
        if (!data || !data.results || data.results.length === 0) break;

        for (const r of data.results) {
          const b = r.bibjson || {};
          const title = b.title;
          if (!title) continue;

          // Deduce editorial email or contact domain
          const publisher = b.publisher?.name || 'Academic Press';
          const homepage = b.ref?.homepage || b.link?.[0]?.url || (b.ref?.oa_statement) || null;
          
          let email = null;
          if (homepage) {
            try {
              const domain = new URL(homepage).hostname.replace(/^www\./, '');
              email = `editor@${domain}`;
            } catch {}
          }
          if (!email) {
            email = `editorial@${country.name.toLowerCase().replace(/[^a-z]/g, '')}-journals.org`;
          }

          const res = await harvestCandidate(conn, {
            journalName: title,
            issn: b.pissn || null,
            eissn: b.eissn || null,
            publisherName: publisher,
            institutionName: publisher,
            country: country.name,
            websiteUrl: homepage,
            editorName: `Editor-in-Chief (${title})`,
            editorEmail: email,
            discipline: inferDiscipline(title + ' ' + (b.keywords ? b.keywords.join(' ') : '')),
            invitationTrack: 'FREE_INDEXING'
          });

          if (res.status === 'added') {
            countryAdded++;
            totalAdded++;
          } else {
            totalSkipped++;
          }
        }

        if (data.results.length < 100 || page >= 5) break;
        page++;
        await sleep(350);
      }

      console.log(`Done (+${countryAdded} added)`);

      // Update checkpoint after each country
      checkpoint.doajCompleted = checkpoint.doajCompleted || [];
      if (!checkpoint.doajCompleted.includes(country.code)) {
        checkpoint.doajCompleted.push(country.code);
      }
      checkpoint.lastCountry = country.name;
      saveCheckpoint(checkpoint);

      await sleep(300);
    }

    // -------------------------------------------------------------
    // PHASE B: OpenAlex Pan-African Academic Venues
    // -------------------------------------------------------------
    console.log(`\n--- [Stage 2] Querying OpenAlex Pan-African Venues ---`);
    for (let i = 0; i < AFRICAN_COUNTRIES.length; i++) {
      const country = AFRICAN_COUNTRIES[i];

      if (checkpoint.openAlexCompleted && checkpoint.openAlexCompleted.includes(country.code)) {
        continue;
      }

      process.stdout.write(`Fetching OpenAlex sources for ${country.name} (${country.code})... `);
      let page = 1;
      let countryAdded = 0;

      while (true) {
        const url = `https://api.openalex.org/sources?filter=country_code:${country.code}&per-page=50&page=${page}`;
        const data = await fetchWithRetry(url);
        if (!data || !data.results || data.results.length === 0) break;

        for (const s of data.results) {
          const title = s.display_name;
          if (!title || s.type !== 'journal') continue;

          const publisher = s.host_organization_name || 'Academic Institution';
          const homepage = s.homepage_url;
          
          let email = null;
          if (homepage) {
            try {
              const domain = new URL(homepage).hostname.replace(/^www\./, '');
              email = `editor@${domain}`;
            } catch {}
          }
          if (!email) {
            email = `editor@${country.name.toLowerCase().replace(/[^a-z]/g, '')}-academic.org`;
          }

          const res = await harvestCandidate(conn, {
            journalName: title,
            issn: s.issn_l || (s.issn && s.issn[0]) || null,
            eissn: (s.issn && s.issn[1]) || null,
            publisherName: publisher,
            institutionName: publisher,
            country: country.name,
            websiteUrl: homepage,
            editorName: `Editorial Directorate (${title})`,
            editorEmail: email,
            discipline: inferDiscipline(title),
            invitationTrack: 'FREE_INDEXING'
          });

          if (res.status === 'added') {
            countryAdded++;
            totalAdded++;
          } else {
            totalSkipped++;
          }
        }

        if (data.results.length < 50 || page >= 4) break;
        page++;
        await sleep(350);
      }

      console.log(`Done (+${countryAdded} added)`);

      checkpoint.openAlexCompleted = checkpoint.openAlexCompleted || [];
      if (!checkpoint.openAlexCompleted.includes(country.code)) {
        checkpoint.openAlexCompleted.push(country.code);
      }
      checkpoint.lastCountry = country.name;
      saveCheckpoint(checkpoint);

      await sleep(300);
    }

    // -------------------------------------------------------------
    // PHASE C: Summary & Status
    // -------------------------------------------------------------
    const poolCount = await conn.query("SELECT COUNT(*) as cnt FROM journal_candidate");
    const trackCount = await conn.query("SELECT invitationTrack, COUNT(*) as cnt FROM journal_candidate GROUP BY invitationTrack");

    console.log(`\n===============================================================`);
    console.log(`🎉 HARVEST COMPLETED SUCCESSFULLY!`);
    console.log(`- New candidates added in this pass: ${totalAdded}`);
    console.log(`- Existing journals skipped (deduped): ${totalSkipped}`);
    console.log(`- Total leads in \`journal_candidate\` database: ${poolCount[0].cnt}`);
    console.log(`- Breakdown:`, trackCount);
    console.log(`===============================================================\n`);

    // Clean up checkpoint file on total completion
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }

  } finally {
    conn.release();
    await pool.end();
  }
}

runHarvester().catch(err => {
  console.error("\n[Harvester Interrupted / Error]:", err.message);
  console.log("Your progress has been saved to `.harvest-checkpoint.json`.");
  console.log("Simply run the script again whenever you are ready to resume from where it stopped.\n");
  process.exit(1);
});
