const mariadb = require('mariadb');
const crypto = require('crypto');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Complete Set of African Country Codes (54 AU Member States)
const AFRICAN_COUNTRY_CODES = new Set([
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CD",
  "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "CI", "KE",
  "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
  "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
  "ZM", "ZW"
]);

// Country Code to African Sub-Region Mapping
const REGION_MAP = {
  // East Africa
  "KE": "East Africa", "UG": "East Africa", "TZ": "East Africa", "ET": "East Africa", "RW": "East Africa",
  "BI": "East Africa", "SO": "East Africa", "DJ": "East Africa", "ER": "East Africa", "SS": "East Africa",
  "SC": "East Africa", "MU": "East Africa", "KM": "East Africa", "MG": "East Africa",
  // West Africa
  "NG": "West Africa", "GH": "West Africa", "SN": "West Africa", "CI": "West Africa", "BJ": "West Africa",
  "BF": "West Africa", "ML": "West Africa", "NE": "West Africa", "TG": "West Africa", "GN": "West Africa",
  "SL": "West Africa", "LR": "West Africa", "GM": "West Africa", "GW": "West Africa", "CV": "West Africa",
  // North Africa
  "EG": "North Africa", "MA": "North Africa", "DZ": "North Africa", "TN": "North Africa", "LY": "North Africa", "SD": "North Africa",
  // Southern Africa
  "ZA": "Southern Africa", "ZW": "Southern Africa", "ZM": "Southern Africa", "BW": "Southern Africa", "NA": "Southern Africa",
  "MZ": "Southern Africa", "MW": "Southern Africa", "LS": "Southern Africa", "SZ": "Southern Africa", "AO": "Southern Africa",
  // Central Africa
  "CM": "Central Africa", "CD": "Central Africa", "CG": "Central Africa", "GA": "Central Africa", "TD": "Central Africa",
  "CF": "Central Africa", "GQ": "Central Africa", "ST": "Central Africa"
};

// Known Non-African CERN / Multi-center Consortium Authors mistakenly linked to African nodes
const EXCLUDED_FOREIGN_RESEARCHERS = new Set([
  'Zulfiqar Ahmed Bhutta', 'Dan Joseph Stein', 'Mohsen Naghavi', 'George A. Mensah', 'O. Smirnova',
  'David Moher', 'Geoffrey E. Hinton', 'Andrea C. Tricco', 'Gordon K. Smyth',
  'Lídia Morawska', 'Stuart M. Phillips', 'J. Keaveney', 'Abdelouahed Encadreur Tounsi',
  'Marc‐Alain Widdowson', 'Marc-Alain Widdowson', 'Christian Drosten', 'Amanda G. Paulovich',
  'Todd D. Little', 'George C. Patton', 'Markku Kulmala',
  'P. D. Thompson', 'Leo Stockfelt', 'Raj N. Kalaria', 'Holger Jens Schünemann',
  'Catherine Owens Johnson', 'Sarah Charlotte Johnson', 'Bruce Rafael Mellado Garcia',
  'R. Mazini', 'I. van Vulpen', 'J. A. Aguilar–Saavedra', 'Marcel Kaiser', 'Dieter Schams'
]);

// OpenAlex Domain IDs for Balanced Disciplines
// 1 = Physical Sciences, 2 = Life Sciences, 3 = Health Sciences, 4 = Social Sciences & Humanities
const DOMAIN_DISCIPLINES = [
  { domainId: "4", name: "Social Sciences & Humanities", target: 450 },
  { domainId: "2", name: "Agricultural, Environmental & Life Sciences", target: 450 },
  { domainId: "1", name: "Physical Sciences & Engineering", target: 400 },
  { domainId: "3", name: "Health & Medical Sciences", target: 350 }
];

function classifyScholarType(topicsText, worksCount) {
  const t = (topicsText || "").toLowerCase();
  if (t.includes("history") || t.includes("literature") || t.includes("philosophy") || t.includes("law") || t.includes("sociology") || t.includes("political") || t.includes("postcolonial")) {
    return "Monograph & Book Author";
  }
  if (t.includes("economics") || t.includes("policy") || t.includes("trade") || t.includes("development") || t.includes("finance") || t.includes("governance")) {
    return "Policy & Economics Specialist";
  }
  return "Journal Research Scientist";
}

function calculateCareerTier(hIndex, totalCitations) {
  if (hIndex >= 20 || totalCitations >= 2000) return "Distinguished Scholar";
  if (hIndex >= 10 || totalCitations >= 500) return "Established Senior Scholar";
  return "Active Researcher";
}

async function runPanAfricanHarvest() {
  console.log("=== EXPANDING PAN-AFRICAN SCHOLARS REGISTRY (~2,000 VERIFIED SCHOLARS) ===");

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    const [existingCountRes] = await conn.query("SELECT COUNT(*) as count FROM user WHERE role = 'RESEARCHER'");
    console.log(`Starting base researchers in DB: ${existingCountRes.count}`);

    // Ensure general academic venue exists for claimed publications
    let [defaultVenue] = await conn.query("SELECT id FROM journal WHERE isIndexed = 1 LIMIT 1");
    if (!defaultVenue) {
      console.error("No indexed journal found.");
      return;
    }

    let totalIngested = 0;
    const countriesCluster = Array.from(AFRICAN_COUNTRY_CODES).join("|");

    for (const discipline of DOMAIN_DISCIPLINES) {
      console.log(`\n======================================================`);
      console.log(`Harvesting Domain: ${discipline.name} (Domain ID: ${discipline.domainId})`);
      console.log(`Target: ${discipline.target} scholars`);
      console.log(`======================================================`);

      let domainIngested = 0;
      let page = 1;

      while (domainIngested < discipline.target && page <= 12) {
        // Query OpenAlex with strict filters:
        // - Primary affiliation in Africa
        // - In specific domain
        // - At least 50 citations
        // - At least 5 works
        const url = `https://api.openalex.org/authors?filter=last_known_institutions.country_code:${countriesCluster},topics.domain.id:${discipline.domainId},cited_by_count:>50,works_count:>5&sort=cited_by_count:desc&per-page=100&page=${page}&api_key=${OPENALEX_KEY}`;
        
        let authors = [];
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/4.0 (mailto:admin@afrijournalindexing.org)' }
          });
          if (!res.ok) {
            console.error(`Page ${page} failed with status: ${res.status}`);
            break;
          }
          const data = await res.json();
          authors = data.results || [];
          if (authors.length === 0) break;
        } catch (err) {
          console.error(`Fetch error on page ${page}:`, err.message);
          break;
        }

        console.log(`\nPage ${page}: Retrieved ${authors.length} candidates from OpenAlex...`);

        for (const author of authors) {
          if (domainIngested >= discipline.target) break;

          const name = author.display_name?.trim();
          if (!name || name.length < 3) continue;

          // Exclusion checks
          if (EXCLUDED_FOREIGN_RESEARCHERS.has(name)) continue;

          const lastInsts = author.last_known_institutions || [];
          if (lastInsts.length === 0) continue;

          // Strict Primary Institution Verification
          const primaryInst = lastInsts[0];
          const countryCode = primaryInst.country_code;

          // Must be an authentic African country code
          if (!countryCode || !AFRICAN_COUNTRY_CODES.has(countryCode)) continue;

          const institutionName = primaryInst.display_name || "African Academic Institution";
          const region = REGION_MAP[countryCode] || "Pan-African";
          const openAlexId = author.id;
          const totalCitations = author.cited_by_count || 0;
          const hIndex = author.summary_stats?.h_index || 0;
          const i10Index = author.summary_stats?.i10_index || 0;
          const orcid = author.orcid ? author.orcid.replace("https://orcid.org/", "").trim() : null;

          // Check if already in DB by openAlexId, orcid, or name
          const existingUser = await conn.query("SELECT id FROM user WHERE openAlexId = ? OR (orcid IS NOT NULL AND orcid = ?) OR (name = ? AND institution = ?)", [openAlexId, orcid, name, institutionName]);
          if (existingUser.length > 0) {
            continue; // Skip existing
          }

          // Extract research interests and topics
          const rawTopics = (author.topics || []).slice(0, 4).map(t => t.display_name).filter(Boolean);
          const topicsText = rawTopics.join(", ");
          const scholarType = classifyScholarType(topicsText, author.works_count);
          const careerTier = calculateCareerTier(hIndex, totalCitations);

          const disciplineTag = `[Discipline: ${discipline.name}]`;
          const interestsTag = rawTopics.length > 0 ? `[Interests: ${topicsText}]` : "";
          const scholarTypeTag = `[Scholar Type: ${scholarType}]`;
          const careerTierTag = `[Career Tier: ${careerTier}]`;
          const regionTag = `[Region: ${region}]`;
          const bio = `Faculty researcher at ${institutionName} (${primaryInst.country_code}), specializing in ${discipline.name}. ${disciplineTag} ${interestsTag} ${scholarTypeTag} ${careerTierTag} ${regionTag}`.trim();

          const authorShortId = author.id.replace('https://openalex.org/', '').toLowerCase();
          const emailSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
          const domainSlug = primaryInst.ror ? `${institutionName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10)}.ac` : "ac.africa";
          const email = `${emailSlug}.${authorShortId}@${domainSlug}`;

          // Extra safety check for duplicate email
          const existingEmail = await conn.query("SELECT id FROM user WHERE email = ?", [email]);
          if (existingEmail.length > 0) {
            continue;
          }

          const userId = crypto.randomUUID();
          const dummyHash = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr";

          await conn.query(`
            INSERT INTO user (
              id, email, passwordHash, name, role, orcid, institution, bio,
              totalCitations, hIndex, i10Index, openAlexId,
              metricsSource, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, 'RESEARCHER', ?, ?, ?, ?, ?, ?, ?, 'OPENALEX', NOW(), NOW())
          `, [
            userId,
            email,
            dummyHash,
            name,
            orcid,
            institutionName,
            bio,
            totalCitations,
            hIndex,
            i10Index,
            openAlexId
          ]);

          domainIngested++;
          totalIngested++;

          if (domainIngested % 50 === 0) {
            console.log(`  -> Domain '${discipline.name}': Ingested ${domainIngested}/${discipline.target} scholars.`);
          }
        }

        page++;
        await sleep(350); // Respect OpenAlex rate limit
      }

      console.log(`Finished ${discipline.name}: Ingested ${domainIngested} scholars.`);
    }

    const [finalCountRes] = await conn.query("SELECT COUNT(*) as count FROM user WHERE role = 'RESEARCHER'");
    console.log(`\n======================================================`);
    console.log(`PAN-AFRICAN HARVEST COMPLETE!`);
    console.log(`New Scholars Added: ${totalIngested}`);
    console.log(`Total Active Researchers in Database: ${finalCountRes.count}`);
    console.log(`======================================================`);

  } finally {
    conn.release();
    pool.end();
  }
}

runPanAfricanHarvest().catch(console.error);
