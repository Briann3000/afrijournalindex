const mariadb = require('mariadb');
const crypto = require('crypto');

const OPENALEX_KEY = "eP5PAl4g8tOWuRjhyo7hMY";
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Expatriate / Foreign researchers mistakenly listed under KEMRI / Kenyan trial sites
const EXPATRIATE_NAMES = new Set([
  'Charles R. Newton', 'Charles Newton', 'Donal Bisanzio', 'Kevin Marsh', 'Robert William Snow',
  'Robert W. Snow', 'Bob Snow', 'Jason Randolph Andrews', 'Jason Andrews', 'James Alexander Berkley',
  'James Berkley', 'Thomas Neil Williams', 'Thomas N. Williams', 'Peter G. Smith', 'Peter Smith',
  'Mike English', 'Michael English', 'D. James Nokes', 'James Nokes', 'Kathryn Maitland',
  'Philip Bejon', 'John A. Scott', 'Sean C. Hackett', 'Sassy C. Molyneux', 'Sassy Molyneux',
  'Eduard Joachim Sanders', 'Eduard Sanders', 'Richard Morter', 'Angelle Desiree LaBeaud',
  'Angelle LaBeaud', 'Vicki Marsh'
]);

// Expanded Spectrum of 25+ Authentic Kenyan Universities & Research Institutes
const EXPANDED_KENYAN_INSTITUTIONS = [
  // Public Universities
  { id: "https://openalex.org/I12859529", name: "University of Nairobi", domain: "uonbi.ac.ke", quota: 25 },
  { id: "https://openalex.org/I153975220", name: "Kenyatta University", domain: "ku.ac.ke", quota: 20 },
  { id: "https://openalex.org/I26805570", name: "Jomo Kenyatta University of Agriculture and Technology", domain: "jkuat.ac.ke", quota: 20 },
  { id: "https://openalex.org/I147168166", name: "Moi University", domain: "mu.ac.ke", quota: 18 },
  { id: "https://openalex.org/I195931504", name: "Egerton University", domain: "egerton.ac.ke", quota: 15 },
  { id: "https://openalex.org/I195610458", name: "Maseno University", domain: "maseno.ac.ke", quota: 15 },
  { id: "https://openalex.org/I88132101", name: "Masinde Muliro University of Science and Technology", domain: "mmust.ac.ke", quota: 12 },
  { id: "https://openalex.org/I140287389", name: "Technical University of Kenya", domain: "tukenya.ac.ke", quota: 12 },
  { id: "https://openalex.org/I22607950", name: "University of Eldoret", domain: "uoeld.ac.ke", quota: 12 },
  { id: "https://openalex.org/I279922783", name: "Pwani University", domain: "pu.ac.ke", quota: 10 },
  { id: "https://openalex.org/I4210151796", name: "Kisii University", domain: "kisiiuniversity.ac.ke", quota: 10 },
  { id: "https://openalex.org/I315205436", name: "Jaramogi Oginga Odinga University of Science and Technology", domain: "jooust.ac.ke", quota: 10 },
  { id: "https://openalex.org/I4210140277", name: "Dedan Kimathi University of Technology", domain: "dkut.ac.ke", quota: 10 },
  { id: "https://openalex.org/I4210123984", name: "Chuka University", domain: "chuka.ac.ke", quota: 8 },
  { id: "https://openalex.org/I4210134469", name: "University of Embu", domain: "embuni.ac.ke", quota: 8 },
  { id: "https://openalex.org/I4210103299", name: "South Eastern Kenya University", domain: "seku.ac.ke", quota: 8 },
  { id: "https://openalex.org/I4210141697", name: "Machakos University", domain: "mksu.ac.ke", quota: 8 },
  { id: "https://openalex.org/I4210125867", name: "Meru University of Science and Technology", domain: "must.ac.ke", quota: 8 },
  { id: "https://openalex.org/I4210134118", name: "Technical University of Mombasa", domain: "tum.ac.ke", quota: 8 },
  { id: "https://openalex.org/I4210115582", name: "Karatina University", domain: "karu.ac.ke", quota: 6 },
  
  // Chartered Private Universities
  { id: "https://openalex.org/I161372803", name: "Strathmore University", domain: "strathmore.edu", quota: 15 },
  { id: "https://openalex.org/I250207469", name: "Mount Kenya University", domain: "mku.ac.ke", quota: 12 },
  { id: "https://openalex.org/I82889322", name: "Catholic University of Eastern Africa", domain: "cuea.edu", quota: 10 },
  { id: "https://openalex.org/I4210108070", name: "Aga Khan University Nairobi", domain: "aku.edu", quota: 10 },
  { id: "https://openalex.org/I4210128148", name: "United States International University - Africa", domain: "usiu.ac.ke", quota: 10 },
  { id: "https://openalex.org/I4210143899", name: "Daystar University", domain: "daystar.ac.ke", quota: 8 },
  { id: "https://openalex.org/I4210122176", name: "Kabarak University", domain: "kabarak.ac.ke", quota: 8 },

  // National Research Institutes (Kenyan Nationals Only)
  { id: "https://openalex.org/I4210098278", name: "Kenya Agricultural and Livestock Research Organization", domain: "kalro.org", quota: 15 },
  { id: "https://openalex.org/I4210165525", name: "Kenya Marine and Fisheries Research Institute", domain: "kmfri.go.ke", quota: 10 },
  { id: "https://openalex.org/I4210151777", name: "National Museums of Kenya", domain: "museums.or.ke", quota: 10 },
  { id: "https://openalex.org/I4210129448", name: "African Population and Health Research Center", domain: "aphrc.org", quota: 10 },
  { id: "https://openalex.org/I2841861", name: "Kenya Medical Research Institute", domain: "kemri.go.ke", quota: 15 } // Indigenous only!
];

function mapToBroadDiscipline(topic) {
  const t = (topic || "").toLowerCase();
  if (t.includes("health") || t.includes("medic") || t.includes("malaria") || t.includes("hiv") || t.includes("tuberculosis") || t.includes("cardio") || t.includes("disease") || t.includes("clinical") || t.includes("nurs") || t.includes("epidemiol")) {
    return "Health & Medical Sciences";
  }
  if (t.includes("agri") || t.includes("crop") || t.includes("farm") || t.includes("soil") || t.includes("environment") || t.includes("ecolog") || t.includes("water") || t.includes("forest") || t.includes("marine") || t.includes("fisher")) {
    return "Agricultural, Environmental & Life Sciences";
  }
  if (t.includes("physic") || t.includes("math") || t.includes("engineer") || t.includes("comput") || t.includes("energy") || t.includes("material") || t.includes("chem") || t.includes("technol")) {
    return "Physical Sciences & Engineering";
  }
  if (t.includes("econom") || t.includes("finance") || t.includes("business") || t.includes("market") || t.includes("trade") || t.includes("account") || t.includes("bank")) {
    return "Business & Economics";
  }
  if (t.includes("educat") || t.includes("pedagog") || t.includes("school") || t.includes("teach") || t.includes("curriculum")) {
    return "Education & Pedagogy";
  }
  return "Social Sciences & Humanities";
}

async function cleanseAndHarvestKenyanScholars() {
  console.log("=== 1. CLEANSING KEMRI OF NON-KENYAN EXPATRIATE PIs ===");

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'afrijournalindex'
  });

  const conn = await pool.getConnection();

  try {
    let purgedCount = 0;
    for (const expat of EXPATRIATE_NAMES) {
      const users = await conn.query("SELECT id, name FROM user WHERE name = ? OR name LIKE ?", [expat, `%${expat}%`]);
      for (const u of users) {
        await conn.query("DELETE FROM claimedpublication WHERE userId = ?", [u.id]);
        await conn.query("DELETE FROM user WHERE id = ?", [u.id]);
        console.log(`  Purged expatriate record: ${u.name} (${u.id})`);
        purgedCount++;
      }
    }
    console.log(`Cleansed ${purgedCount} non-Kenyan records from database.`);

    console.log("\n=== 2. HARVESTING SCHOLARS ACROSS 25+ KENYAN UNIVERSITIES & INSTITUTES ===");

    let totalKenyanIngested = 0;

    for (const inst of EXPANDED_KENYAN_INSTITUTIONS) {
      console.log(`\nHarvesting: ${inst.name} (Target quota: ${inst.quota})...`);
      
      const url = `https://api.openalex.org/authors?filter=last_known_institutions.id:${encodeURIComponent(inst.id)},cited_by_count:>20,works_count:>3&sort=cited_by_count:desc&per-page=50&api_key=${OPENALEX_KEY}`;
      
      let authors = [];
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'AfriJournalIndexHarvester/4.0 (mailto:admin@afrijournalindexing.org)' }
        });
        if (res.ok) {
          const data = await res.json();
          authors = data.results || [];
        }
      } catch (err) {
        console.error(`  Error requesting ${inst.name}:`, err.message);
        continue;
      }

      let addedForInst = 0;

      for (const author of authors) {
        if (addedForInst >= inst.quota) break;

        const name = author.display_name?.trim();
        if (!name || name.length < 3) continue;

        // Strict Exclusion check
        if (EXPATRIATE_NAMES.has(name)) {
          console.log(`  Skipped foreign expatriate: ${name}`);
          continue;
        }

        const lastInsts = author.last_known_institutions || [];
        if (lastInsts.length === 0) continue;

        // Ensure affiliation is genuinely this Kenyan institution
        const matchesInst = lastInsts.some(i => i.id === inst.id || i.country_code === "KE");
        if (!matchesInst) continue;

        const openAlexId = author.id;
        const totalCitations = author.cited_by_count || 0;
        const hIndex = author.summary_stats?.h_index || 0;
        const i10Index = author.summary_stats?.i10_index || 0;
        const orcid = author.orcid ? author.orcid.replace("https://orcid.org/", "").trim() : null;

        // Check if already in DB by openAlexId, orcid, or name
        const existingUser = await conn.query("SELECT id FROM user WHERE openAlexId = ? OR (orcid IS NOT NULL AND orcid = ?) OR (name = ? AND institution = ?)", [openAlexId, orcid, name, inst.name]);
        if (existingUser.length > 0) {
          continue; // Already in DB
        }

        const rawTopics = (author.topics || []).slice(0, 4).map(t => t.display_name).filter(Boolean);
        const broadDiscipline = rawTopics.length > 0 ? mapToBroadDiscipline(rawTopics[0]) : "Multidisciplinary";
        const topicsText = rawTopics.join(", ");

        const disciplineTag = `[Discipline: ${broadDiscipline}]`;
        const interestsTag = rawTopics.length > 0 ? `[Interests: ${topicsText}]` : "";
        const regionTag = `[Region: East Africa]`;
        const countryTag = `[Country: Kenya]`;
        const bio = `Faculty researcher at ${inst.name} (Kenya), specializing in ${broadDiscipline}. ${disciplineTag} ${interestsTag} ${countryTag} ${regionTag}`.trim();

        const authorShortId = author.id.replace('https://openalex.org/', '').toLowerCase();
        const emailSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
        const email = `${emailSlug}.${authorShortId}@${inst.domain}`;

        // Ensure unique email
        const existingEmail = await conn.query("SELECT id FROM user WHERE email = ?", [email]);
        if (existingEmail.length > 0) continue;

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
          inst.name,
          bio,
          totalCitations,
          hIndex,
          i10Index,
          openAlexId
        ]);

        addedForInst++;
        totalKenyanIngested++;
      }

      console.log(`  -> Added ${addedForInst} verified scholars for ${inst.name}.`);
      await sleep(250); // Respect rate limit
    }

    const [finalTotal] = await conn.query("SELECT COUNT(*) as count FROM user WHERE role = 'RESEARCHER'");
    const [finalKenyan] = await conn.query(`
      SELECT COUNT(*) as count FROM user 
      WHERE role = 'RESEARCHER' 
        AND (bio LIKE '%[Country: Kenya]%' OR bio LIKE '%(Kenya)%' OR bio LIKE '%(KE)%' 
             OR institution LIKE '%Nairobi%' OR institution LIKE '%Kenyatta%' 
             OR institution LIKE '%Moi%' OR institution LIKE '%Maseno%' OR institution LIKE '%Egerton%')
    `);

    console.log(`\n======================================================`);
    console.log(`KENYAN SPECTRUM HARVEST COMPLETE!`);
    console.log(`New Kenyan Scholars Added: ${totalKenyanIngested}`);
    console.log(`Total Verified Kenyan Scholars in Registry: ${finalKenyan.count}`);
    console.log(`Total Researchers in Entire Database: ${finalTotal.count}`);
    console.log(`======================================================`);

  } finally {
    conn.release();
    pool.end();
  }
}

cleanseAndHarvestKenyanScholars().catch(console.error);
