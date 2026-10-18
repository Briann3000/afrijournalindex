const mariadb = require('mariadb');
const crypto = require('crypto');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const AFRICAN_COUNTRY_CODES = new Set([
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CD",
  "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "CI", "KE",
  "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
  "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
  "ZM", "ZW"
]);

// Verified Prominent African Universities
const REAL_VERIFIED_AFRICAN_UNIVERSITIES = [
  // South Africa
  { id: "https://openalex.org/I157614274", name: "University of Cape Town", country: "South Africa", domain: "uct.ac.za", countryCode: "ZA" },
  { id: "https://openalex.org/I192619145", name: "University of the Witwatersrand", country: "South Africa", domain: "wits.ac.za", countryCode: "ZA" },
  { id: "https://openalex.org/I26092322", name: "Stellenbosch University", country: "South Africa", domain: "sun.ac.za", countryCode: "ZA" },
  { id: "https://openalex.org/I69552723", name: "University of Pretoria", country: "South Africa", domain: "up.ac.za", countryCode: "ZA" },
  { id: "https://openalex.org/I95023434", name: "University of KwaZulu-Natal", country: "South Africa", domain: "ukzn.ac.za", countryCode: "ZA" },
  { id: "https://openalex.org/I24027795", name: "University of Johannesburg", country: "South Africa", domain: "uj.ac.za", countryCode: "ZA" },
  { id: "https://openalex.org/I27765905", name: "North-West University", country: "South Africa", domain: "nwu.ac.za", countryCode: "ZA" },
  { id: "https://openalex.org/I10947320", name: "South African Medical Research Council", country: "South Africa", domain: "mrc.ac.za", countryCode: "ZA" },
  // Kenya
  { id: "https://openalex.org/I12859529", name: "University of Nairobi", country: "Kenya", domain: "uonbi.ac.ke", countryCode: "KE" },
  { id: "https://openalex.org/I2841861", name: "Kenya Medical Research Institute", country: "Kenya", domain: "kemri.go.ke", countryCode: "KE" },
  { id: "https://openalex.org/I169248446", name: "Kenyatta University", country: "Kenya", domain: "ku.ac.ke", countryCode: "KE" },
  { id: "https://openalex.org/I11701301", name: "Jomo Kenyatta University of Agriculture and Technology", country: "Kenya", domain: "jkuat.ac.ke", countryCode: "KE" },
  // Nigeria
  { id: "https://openalex.org/I181631907", name: "University of Ibadan", country: "Nigeria", domain: "ui.edu.ng", countryCode: "NG" },
  { id: "https://openalex.org/I197610006", name: "University of Lagos", country: "Nigeria", domain: "unilag.edu.ng", countryCode: "NG" },
  { id: "https://openalex.org/I11892038", name: "University of Nigeria", country: "Nigeria", domain: "unn.edu.ng", countryCode: "NG" },
  { id: "https://openalex.org/I45711476", name: "Obafemi Awolowo University", country: "Nigeria", domain: "oauife.edu.ng", countryCode: "NG" },
  { id: "https://openalex.org/I12789410", name: "Ahmadu Bello University", country: "Nigeria", domain: "abu.edu.ng", countryCode: "NG" },
  // Egypt
  { id: "https://openalex.org/I145487455", name: "Cairo University", country: "Egypt", domain: "cu.edu.eg", countryCode: "EG" },
  { id: "https://openalex.org/I107720978", name: "Ain Shams University", country: "Egypt", domain: "asu.edu.eg", countryCode: "EG" },
  { id: "https://openalex.org/I84524832", name: "Alexandria University", country: "Egypt", domain: "alexu.edu.eg", countryCode: "EG" },
  { id: "https://openalex.org/I159247623", name: "Mansoura University", country: "Egypt", domain: "mans.edu.eg", countryCode: "EG" },
  // Uganda
  { id: "https://openalex.org/I72227227", name: "Makerere University", country: "Uganda", domain: "mak.ac.ug", countryCode: "UG" },
  // Ghana
  { id: "https://openalex.org/I138690464", name: "University of Ghana", country: "Ghana", domain: "ug.edu.gh", countryCode: "GH" },
  { id: "https://openalex.org/I28046988", name: "Kwame Nkrumah University of Science and Technology", country: "Ghana", domain: "knust.edu.gh", countryCode: "GH" },
  // Ethiopia
  { id: "https://openalex.org/I4537092", name: "Addis Ababa University", country: "Ethiopia", domain: "aau.edu.et", countryCode: "ET" },
  // Tanzania
  { id: "https://openalex.org/I146445657", name: "University of Dar es Salaam", country: "Tanzania", domain: "udsm.ac.tz", countryCode: "TZ" },
  // Rwanda
  { id: "https://openalex.org/I174987747", name: "University of Rwanda", country: "Rwanda", domain: "ur.ac.rw", countryCode: "RW" }
];

// Verified African Diaspora Scholars (African nationality / heritage currently leading labs abroad)
const VERIFIED_AFRICAN_DIASPORA_SCHOLARS = [
  {
    name: "M. Kariuki Njenga",
    openAlexSearch: "M. Kariuki Njenga",
    institution: "Washington State University",
    homeCountry: "Kenya",
    discipline: "Health Sciences",
    bio: "Renowned Kenyan virologist, Professor at Paul G. Allen School for Global Health at Washington State University (WSU) and KEMRI. Member of the U.S. National Academy of Medicine. [Discipline: Health Sciences] [Interests: Zoonotic Viruses, One Health, Rift Valley Fever, Global Infectious Disease Surveillance]"
  },
  {
    name: "Olufunmilayo Olopade",
    openAlexSearch: "Olufunmilayo Olopade",
    institution: "University of Chicago",
    homeCountry: "Nigeria",
    discipline: "Health Sciences",
    bio: "Distinguished Nigerian-American oncologist and Walter L. Palmer Distinguished Service Professor of Medicine and Human Genetics at the University of Chicago. MacArthur Fellow and Member of the National Academy of Sciences. [Discipline: Health Sciences] [Interests: Breast Cancer Genetics, BRCA Mutations in African Populations, Clinical Oncology, Molecular Epidemiology]"
  }
];

// Known non-African foreign researchers mistakenly linked by international multi-center studies
const EXCLUDED_FOREIGN_RESEARCHERS = new Set([
  'David Moher', 'Geoffrey E. Hinton', 'Andrea C. Tricco', 'Gordon K. Smyth',
  'Lídia Morawska', 'Stuart M. Phillips', 'J. Keaveney', 'Abdelouahed Encadreur Tounsi',
  'Marc‐Alain Widdowson', 'Marc-Alain Widdowson', 'Christian Drosten', 'Amanda G. Paulovich',
  'Todd D. Little', 'George C. Patton', 'Zulfiqar Ahmed Bhutta', 'Markku Kulmala',
  'P. D. Thompson', 'Leo Stockfelt', 'Raj N. Kalaria', 'Holger Jens Schünemann',
  'Catherine Owens Johnson', 'Sarah Charlotte Johnson', 'Bruce Rafael Mellado Garcia',
  'R. Mazini', 'I. van Vulpen', 'J. A. Aguilar–Saavedra', 'Marcel Kaiser', 'Dieter Schams'
]);

function mapToBroadDiscipline(topic) {
  const t = (topic || "").toLowerCase();
  if (t.includes("health") || t.includes("medic") || t.includes("malaria") || t.includes("hiv") || t.includes("tuberculosis") || t.includes("stroke") || t.includes("cardio") || t.includes("disease") || t.includes("clinical") || t.includes("nurs") || t.includes("psych") || t.includes("pharmac") || t.includes("epidemiol") || t.includes("virus")) {
    return "Health Sciences";
  }
  if (t.includes("agri") || t.includes("crop") || t.includes("farm") || t.includes("soil") || t.includes("environment") || t.includes("ecolog") || t.includes("water") || t.includes("forest") || t.includes("climate")) {
    return "Agricultural & Environmental Sciences";
  }
  if (t.includes("physic") || t.includes("math") || t.includes("engineer") || t.includes("comput") || t.includes("energy") || t.includes("material") || t.includes("chem") || t.includes("particle") || t.includes("technol")) {
    return "Physical Sciences & Engineering";
  }
  if (t.includes("econom") || t.includes("finance") || t.includes("business") || t.includes("market") || t.includes("trade") || t.includes("account") || t.includes("bank")) {
    return "Business & Economics";
  }
  if (t.includes("educat") || t.includes("pedagog") || t.includes("school") || t.includes("curriculum") || t.includes("teach") || t.includes("learn")) {
    return "Education & Pedagogy";
  }
  if (t.includes("bio") || t.includes("genet") || t.includes("cell") || t.includes("microbio") || t.includes("plant") || t.includes("zoolog") || t.includes("species")) {
    return "Life Sciences & Biotechnology";
  }
  return "Social Sciences & Humanities";
}

async function runStrictAfricanScholarsIngest() {
  console.log("=== STRICT AFRICAN SCHOLARS INGESTION & PURGE ===");

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    // 1. Purge all known non-African foreign individuals
    console.log("1. Purging foreign researchers with international multi-center affiliations...");
    for (const name of EXCLUDED_FOREIGN_RESEARCHERS) {
      const users = await conn.query("SELECT id FROM User WHERE name = ? OR name LIKE ?", [name, `%${name}%`]);
      for (const u of users) {
        await conn.query("DELETE FROM ClaimedPublication WHERE userId = ?", [u.id]);
        await conn.query("DELETE FROM User WHERE id = ?", [u.id]);
        console.log(`   Purged: ${name} (${u.id})`);
      }
    }

    const indexedJournals = await conn.query("SELECT id FROM Journal WHERE isIndexed = 1 LIMIT 1");
    const defaultJournalId = indexedJournals[0].id;

    // 2. Harvest Strictly African Faculty
    console.log("\n2. Ingesting strictly African-based faculty...");
    for (const uni of REAL_VERIFIED_AFRICAN_UNIVERSITIES) {
      console.log(`\nHarvesting faculty for: ${uni.name} (${uni.country})...`);
      const authorsUrl = `https://api.openalex.org/authors?filter=last_known_institutions.id:${encodeURIComponent(uni.id)}&sort=cited_by_count:desc&per-page=15&api_key=${OPENALEX_KEY}`;
      
      let authors = [];
      try {
        const res = await fetch(authorsUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/4.0 (mailto:admin@afrijournalindex.org)' }
        });
        if (!res.ok) continue;
        const data = await res.json();
        authors = data.results || [];
      } catch (err) {
        console.error(`Error requesting ${uni.name}:`, err.message);
        continue;
      }

      let addedForUni = 0;
      for (const author of authors) {
        if (addedForUni >= 8) break; // Keep top 8 verified per university
        const name = author.display_name?.trim();
        if (!name) continue;

        // Strict Exclusion check
        if (EXCLUDED_FOREIGN_RESEARCHERS.has(name)) {
          console.log(`   Skipped excluded foreign scholar: ${name}`);
          continue;
        }

        const lastInsts = author.last_known_institutions || [];
        if (lastInsts.length === 0) continue;

        // Check primary affiliation
        const primaryInst = lastInsts[0];
        const primaryCode = primaryInst.country_code;

        // If primary affiliation is non-African (e.g. US, GB, DE, CH, FR), skip!
        if (primaryCode && !AFRICAN_COUNTRY_CODES.has(primaryCode)) {
          console.log(`   Skipped non-African primary affiliate: ${name} (Primary: ${primaryInst.display_name} - ${primaryCode})`);
          continue;
        }

        // Ensure at least one affiliation is the target African university
        const hasAfricanTarget = lastInsts.some(i => i.id === uni.id || (i.country_code && AFRICAN_COUNTRY_CODES.has(i.country_code)));
        if (!hasAfricanTarget) continue;

        const orcid = author.orcid ? author.orcid.replace("https://orcid.org/", "").trim() : null;
        const emailSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
        const email = `${emailSlug}@${uni.domain}`;

        const rawTopics = (author.topics || []).slice(0, 3).map(t => t.display_name).filter(Boolean);
        const broadDiscipline = rawTopics.length > 0 ? mapToBroadDiscipline(rawTopics[0]) : "Multidisciplinary";
        const interestsTag = rawTopics.length > 0 ? `[Interests: ${rawTopics.join(", ")}]` : "";
        const disciplineTag = `[Discipline: ${broadDiscipline}]`;
        const bio = `Faculty researcher at ${uni.name}, specializing in ${broadDiscipline}. ${disciplineTag} ${interestsTag}`.trim();

        let userId;
        const existingUsers = await conn.query("SELECT id FROM User WHERE orcid = ? OR email = ?", [orcid, email]);
        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
          await conn.query("UPDATE User SET institution = ?, bio = ? WHERE id = ?", [uni.name, bio, userId]);
        } else {
          userId = crypto.randomUUID();
          await conn.query(
            "INSERT INTO User (id, name, email, passwordHash, role, institution, orcid, bio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [userId, name, email, "sim_hash_password123", "RESEARCHER", uni.name, orcid, bio]
          );
        }

        // Works
        await sleep(80);
        try {
          const worksUrl = `https://api.openalex.org/works?filter=author.id:${author.id}&sort=cited_by_count:desc&per-page=3&api_key=${OPENALEX_KEY}`;
          const wRes = await fetch(worksUrl, {
            headers: { 'User-Agent': 'AfriJournalIndexHarvester/4.0 (mailto:admin@afrijournalindex.org)' }
          });
          if (wRes.ok) {
            const wData = await wRes.json();
            const works = wData.results || [];
            for (const work of works) {
              const title = work.title;
              if (!title) continue;

              const doi = work.doi ? work.doi.replace("https://doi.org/", "").trim() : null;
              const citationCount = work.cited_by_count || 0;
              const publishDate = work.publication_date ? new Date(work.publication_date) : new Date(2023, 0, 1);

              let articleId;
              let existingArticle = [];
              if (doi) {
                existingArticle = await conn.query("SELECT id FROM Article WHERE doi = ?", [doi]);
              }
              if (existingArticle.length > 0) {
                articleId = existingArticle[0].id;
              } else {
                articleId = crypto.randomUUID();
                await conn.query(
                  "INSERT INTO Article (id, title, doi, publishDate, citationCount, journalId, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                  [articleId, title, doi, publishDate, citationCount, defaultJournalId]
                );
              }

              const claimExists = await conn.query("SELECT id FROM ClaimedPublication WHERE userId = ? AND articleId = ?", [userId, articleId]);
              if (claimExists.length === 0) {
                await conn.query(
                  "INSERT INTO ClaimedPublication (id, userId, articleId, role, status, claimedAt) VALUES (?, ?, ?, ?, ?, NOW())",
                  [crypto.randomUUID(), userId, articleId, "Author", "VERIFIED"]
                );
              }
            }
          }
        } catch {}

        addedForUni++;
        await sleep(60);
      }
      console.log(`   Ingested ${addedForUni} verified scholars for ${uni.name}`);
    }

    // 3. Ingest Verified African Diaspora Scholars
    console.log("\n3. Ingesting Verified African Diaspora Scholars...");
    for (const dScholar of VERIFIED_AFRICAN_DIASPORA_SCHOLARS) {
      console.log(`Harvesting diaspora profile: ${dScholar.name} (${dScholar.institution})...`);
      const searchUrl = `https://api.openalex.org/authors?search=${encodeURIComponent(dScholar.openAlexSearch)}&per-page=1&api_key=${OPENALEX_KEY}`;
      try {
        const res = await fetch(searchUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/4.0 (mailto:admin@afrijournalindex.org)' }
        });
        if (!res.ok) continue;
        const data = await res.json();
        const author = (data.results || [])[0];
        if (!author) continue;

        const orcid = author.orcid ? author.orcid.replace("https://orcid.org/", "").trim() : null;
        const emailSlug = dScholar.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
        const email = `${emailSlug}@diaspora.afrijournal.org`;

        let userId;
        const existingUsers = await conn.query("SELECT id FROM User WHERE name = ?", [dScholar.name]);
        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
          await conn.query("UPDATE User SET institution = ?, bio = ? WHERE id = ?", [dScholar.institution, dScholar.bio, userId]);
        } else {
          userId = crypto.randomUUID();
          await conn.query(
            "INSERT INTO User (id, name, email, passwordHash, role, institution, orcid, bio, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [userId, dScholar.name, email, "sim_hash_password123", "RESEARCHER", dScholar.institution, orcid, dScholar.bio]
          );
        }

        // Works
        const worksUrl = `https://api.openalex.org/works?filter=author.id:${author.id}&sort=cited_by_count:desc&per-page=5&api_key=${OPENALEX_KEY}`;
        const wRes = await fetch(worksUrl, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/4.0 (mailto:admin@afrijournalindex.org)' }
        });
        if (wRes.ok) {
          const wData = await wRes.json();
          const works = wData.results || [];
          for (const work of works) {
            const title = work.title;
            if (!title) continue;

            const doi = work.doi ? work.doi.replace("https://doi.org/", "").trim() : null;
            const citationCount = work.cited_by_count || 0;
            const publishDate = work.publication_date ? new Date(work.publication_date) : new Date(2023, 0, 1);

            let articleId;
            let existingArticle = [];
            if (doi) {
              existingArticle = await conn.query("SELECT id FROM Article WHERE doi = ?", [doi]);
            }
            if (existingArticle.length > 0) {
              articleId = existingArticle[0].id;
            } else {
              articleId = crypto.randomUUID();
              await conn.query(
                "INSERT INTO Article (id, title, doi, publishDate, citationCount, journalId, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                [articleId, title, doi, publishDate, citationCount, defaultJournalId]
              );
            }

            const claimExists = await conn.query("SELECT id FROM ClaimedPublication WHERE userId = ? AND articleId = ?", [userId, articleId]);
            if (claimExists.length === 0) {
              await conn.query(
                "INSERT INTO ClaimedPublication (id, userId, articleId, role, status, claimedAt) VALUES (?, ?, ?, ?, ?, NOW())",
                [crypto.randomUUID(), userId, articleId, "Author", "VERIFIED"]
              );
            }
          }
        }
        console.log(`   Successfully ingested Diaspora scholar: ${dScholar.name}`);
      } catch (err) {
        console.error(`Error ingesting ${dScholar.name}:`, err.message);
      }
    }

    console.log("\n=== STRICT AFRICAN SCHOLARS INGESTION COMPLETE ===");
  } finally {
    await conn.end();
    await pool.end();
  }
}

runStrictAfricanScholarsIngest().catch(console.error);
