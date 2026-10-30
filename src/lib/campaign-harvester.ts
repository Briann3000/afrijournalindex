/**
 * Comprehensive Pan-African University Press & Journal Harvester
 * Automatically catalogs unindexed African journals and university research directorates across:
 * - Kenya, Uganda, Tanzania, Rwanda, Ethiopia
 * - Nigeria, Ghana, South Africa, Egypt, Zimbabwe, Zambia, Botswana
 */

import mariadb from "mariadb";
import crypto from "crypto";

const COMPREHENSIVE_AFRICAN_JOURNAL_LEADS = [
  // ================= KENYA =================
  {
    journalName: "East African Medical Journal (EAMJ)",
    issn: "0012-835X",
    eissn: "0012-835X",
    publisherName: "Kenya Medical Association / University of Nairobi Press",
    institutionName: "University of Nairobi",
    country: "Kenya",
    websiteUrl: "https://www.eamj.online",
    editorName: "Editorial Office",
    editorEmail: "eamj@kma.co.ke",
    discipline: "Health Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Baraton Interdisciplinary Research Journal",
    issn: "2079-4711",
    publisherName: "University of Eastern Africa, Baraton",
    institutionName: "University of Eastern Africa, Baraton",
    country: "Kenya",
    websiteUrl: "https://ueab.ac.ke/birj",
    editorName: "Editor-in-Chief BIRJ",
    editorEmail: "research@ueab.ac.ke",
    discipline: "Multidisciplinary",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Kabarak Journal of Research & Innovation",
    issn: "2305-784X",
    publisherName: "Kabarak University Press",
    institutionName: "Kabarak University",
    country: "Kenya",
    websiteUrl: "https://eserver.kabarak.ac.ke/ojs",
    editorName: "Director of Research & Publications",
    editorEmail: "researchoffice@kabarak.ac.ke",
    discipline: "Business & Computing",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Daystar University Academic Journal",
    issn: "2415-4601",
    publisherName: "Daystar University",
    institutionName: "Daystar University",
    country: "Kenya",
    websiteUrl: "https://www.daystar.ac.ke/research",
    editorName: "Daystar Research Directorate",
    editorEmail: "research@daystar.ac.ke",
    discipline: "Communication & Social Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Strathmore Law Journal",
    issn: "2411-9709",
    publisherName: "Strathmore University Press",
    institutionName: "Strathmore University",
    country: "Kenya",
    websiteUrl: "https://lawjournal.strathmore.edu",
    editorName: "Strathmore Law Board",
    editorEmail: "lawjournal@strathmore.edu",
    discipline: "Law & Jurisprudence",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Chuka University Journal of Science, Technology and Innovations",
    issn: "2664-0759",
    publisherName: "Chuka University Press",
    institutionName: "Chuka University",
    country: "Kenya",
    websiteUrl: "https://chuka.ac.ke/research",
    editorName: "Directorate of Research & Extension",
    editorEmail: "research@chuka.ac.ke",
    discipline: "STEM & Agriculture",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Mount Kenya University International Journal of Social Sciences",
    issn: "2708-4108",
    publisherName: "Mount Kenya University",
    institutionName: "Mount Kenya University",
    country: "Kenya",
    websiteUrl: "https://www.mku.ac.ke/research",
    editorName: "MKU Directorate of Research",
    editorEmail: "research@mku.ac.ke",
    discipline: "Social Sciences & Humanities",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Karatina University Research & Innovation Desk",
    issn: null,
    publisherName: "Karatina University Press",
    institutionName: "Karatina University",
    country: "Kenya",
    websiteUrl: "https://karu.ac.ke/research",
    editorName: "Registrar Research & Innovation",
    editorEmail: "research@karu.ac.ke",
    discipline: "Environmental Sciences & Education",
    invitationTrack: "OJS_INCUBATION"
  },
  {
    journalName: "Machakos University Scholarly Publishing Desk",
    issn: null,
    publisherName: "Machakos University Press",
    institutionName: "Machakos University",
    country: "Kenya",
    websiteUrl: "https://mksu.ac.ke/research",
    editorName: "Director of Research, Innovation & Technology",
    editorEmail: "research@mksu.ac.ke",
    discipline: "Engineering & Applied Sciences",
    invitationTrack: "OJS_INCUBATION"
  },
  {
    journalName: "Pan-African Journal of Health and Environmental Science",
    issn: "2789-6196",
    eissn: "2789-620X",
    publisherName: "Adventist University of Africa",
    institutionName: "Adventist University of Africa",
    country: "Kenya",
    websiteUrl: "https://pajhes.aua.ke",
    editorName: "Editor-in-Chief PAJHES",
    editorEmail: "pajhes@aua.ke",
    discipline: "Health & Environmental Sciences",
    invitationTrack: "FREE_INDEXING"
  },

  // ================= UGANDA =================
  {
    journalName: "Makerere University Journal of Agricultural & Environmental Sciences",
    issn: "1563-3721",
    publisherName: "Makerere University Agricultural Research Institute",
    institutionName: "Makerere University",
    country: "Uganda",
    websiteUrl: "https://mujaer.mak.ac.ug",
    editorName: "Chief Editor MUJAER",
    editorEmail: "editor@mujaer.mak.ac.ug",
    discipline: "Agricultural & Environmental Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Uganda Martyrs University Research Desk",
    issn: null,
    publisherName: "Uganda Martyrs University",
    institutionName: "Uganda Martyrs University",
    country: "Uganda",
    websiteUrl: "https://www.umu.ac.ug/research",
    editorName: "Dean of Postgraduate Studies & Research",
    editorEmail: "research@umu.ac.ug",
    discipline: "Multidisciplinary",
    invitationTrack: "OJS_INCUBATION"
  },
  {
    journalName: "Mbarara University Health Sciences Journal",
    issn: "2078-5585",
    publisherName: "Mbarara University of Science and Technology",
    institutionName: "Mbarara University of Science and Technology",
    country: "Uganda",
    websiteUrl: "https://must.ac.ug/research",
    editorName: "Directorate of Research & Graduate Training",
    editorEmail: "drgt@must.ac.ug",
    discipline: "Health Sciences & Medicine",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Kyambogo University Academic Journal",
    issn: "2519-724X",
    publisherName: "Kyambogo University Press",
    institutionName: "Kyambogo University",
    country: "Uganda",
    websiteUrl: "https://kyu.ac.ug/research",
    editorName: "Directorate of Research and Innovation",
    editorEmail: "research@kyu.ac.ug",
    discipline: "Education & Technology",
    invitationTrack: "FREE_INDEXING"
  },

  // ================= NIGERIA =================
  {
    journalName: "Nigerian Journal of Clinical Practice",
    issn: "1119-3077",
    eissn: "2229-7731",
    publisherName: "Medical and Dental Consultants' Association of Nigeria",
    institutionName: "University of Ibadan",
    country: "Nigeria",
    websiteUrl: "https://www.njcponline.com",
    editorName: "Prof. Editorial Desk",
    editorEmail: "editor@njcponline.com",
    discipline: "Health Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Ahmadu Bello University Journal of Educational Review",
    issn: "0795-316X",
    publisherName: "Faculty of Education, Ahmadu Bello University",
    institutionName: "Ahmadu Bello University",
    country: "Nigeria",
    websiteUrl: "https://abu.edu.ng/journals",
    editorName: "Managing Editor",
    editorEmail: "editor_abujer@abu.edu.ng",
    discipline: "Education & Pedagogy",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "University of Lagos Law Review",
    issn: "0189-6741",
    publisherName: "Faculty of Law, University of Lagos",
    institutionName: "University of Lagos",
    country: "Nigeria",
    websiteUrl: "https://law.unilag.edu.ng/journal",
    editorName: "UNILAG Law Board",
    editorEmail: "lawreview@unilag.edu.ng",
    discipline: "Law & Social Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Covenant Journal of Business and Social Sciences (CJBSS)",
    issn: "2354-3582",
    publisherName: "Covenant University Journals",
    institutionName: "Covenant University",
    country: "Nigeria",
    websiteUrl: "https://journals.covenantuniversity.edu.ng/index.php/cjbss",
    editorName: "Editor-in-Chief CJBSS",
    editorEmail: "cjbss@covenantuniversity.edu.ng",
    discipline: "Business & Social Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Federal University of Technology Akure Journal of Research",
    issn: "2467-8910",
    publisherName: "FUTA Press",
    institutionName: "Federal University of Technology, Akure",
    country: "Nigeria",
    websiteUrl: "https://futa.edu.ng/journals",
    editorName: "Directorate of Research & Development",
    editorEmail: "drd@futa.edu.ng",
    discipline: "Engineering & Applied Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Bayero University Kano Journal of Humanities",
    issn: "2141-4564",
    publisherName: "Bayero University Press",
    institutionName: "Bayero University Kano",
    country: "Nigeria",
    websiteUrl: "https://buk.edu.ng/journals",
    editorName: "Managing Editor BUK Journals",
    editorEmail: "editor@buk.edu.ng",
    discipline: "Social Sciences & Humanities",
    invitationTrack: "FREE_INDEXING"
  },

  // ================= GHANA =================
  {
    journalName: "Ghana Mining Journal",
    issn: "0855-2746",
    eissn: "2026-657X",
    publisherName: "University of Mines and Technology",
    institutionName: "University of Mines and Technology (UMaT)",
    country: "Ghana",
    websiteUrl: "https://gmj.umat.edu.gh",
    editorName: "Prof. Editor GMJ",
    editorEmail: "gmj@umat.edu.gh",
    discipline: "Physical Sciences & Engineering",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "University of Cape Coast Journal of Humanities",
    issn: "2026-5832",
    publisherName: "University of Cape Coast Press",
    institutionName: "University of Cape Coast",
    country: "Ghana",
    websiteUrl: "https://ucc.edu.gh/journals",
    editorName: "Directorate of Research, Innovation and Consultancy",
    editorEmail: "dric@ucc.edu.gh",
    discipline: "Social Sciences & Humanities",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "KNUST Journal of Science and Technology",
    issn: "0855-0395",
    publisherName: "Kwame Nkrumah University of Science and Technology Press",
    institutionName: "KNUST",
    country: "Ghana",
    websiteUrl: "https://just.knust.edu.gh",
    editorName: "Editor-in-Chief JUST",
    editorEmail: "just@knust.edu.gh",
    discipline: "Science & Technology",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Ashesi University Faculty Research Portal",
    issn: null,
    publisherName: "Ashesi University Press",
    institutionName: "Ashesi University",
    country: "Ghana",
    websiteUrl: "https://www.ashesi.edu.gh/research",
    editorName: "Dean of Academic Affairs & Research",
    editorEmail: "research@ashesi.edu.gh",
    discipline: "Computer Science & Business Leadership",
    invitationTrack: "OJS_INCUBATION"
  },

  // ================= SOUTH AFRICA =================
  {
    journalName: "South African Journal of Science",
    issn: "0038-2353",
    eissn: "1996-7489",
    publisherName: "Academy of Science of South Africa (ASSAf)",
    institutionName: "Academy of Science of South Africa",
    country: "South Africa",
    websiteUrl: "https://sajs.co.za",
    editorName: "Editor-in-Chief SAJS",
    editorEmail: "sajs@assaf.org.za",
    discipline: "Multidisciplinary",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "University of Fort Hare Scholarly Research Review",
    issn: "2306-0549",
    publisherName: "University of Fort Hare Press",
    institutionName: "University of Fort Hare",
    country: "South Africa",
    websiteUrl: "https://www.ufh.ac.za/research",
    editorName: "Directorate of Research & Innovation",
    editorEmail: "research@ufh.ac.za",
    discipline: "Social Sciences & Agriculture",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Rhodes University Humanities Review",
    issn: "0258-2473",
    publisherName: "Rhodes University",
    institutionName: "Rhodes University",
    country: "South Africa",
    websiteUrl: "https://www.ru.ac.za/research",
    editorName: "Research Office Rhodes",
    editorEmail: "research-office@ru.ac.za",
    discipline: "Humanities & Social Sciences",
    invitationTrack: "FREE_INDEXING"
  },

  // ================= TANZANIA =================
  {
    journalName: "Tanzania Journal of Health Research (TJHR)",
    issn: "1821-6404",
    publisherName: "National Institute for Medical Research (NIMR)",
    institutionName: "University of Dar es Salaam Health Consortium",
    country: "Tanzania",
    websiteUrl: "https://www.ajol.info/index.php/thrb",
    editorName: "Chief Editor TJHR",
    editorEmail: "tjhr@nimr.or.tz",
    discipline: "Health Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Sokoine University Journal of Agricultural Sciences (TJA)",
    issn: "0856-664X",
    publisherName: "Sokoine University of Agriculture",
    institutionName: "Sokoine University of Agriculture",
    country: "Tanzania",
    websiteUrl: "https://www.sua.ac.tz/research",
    editorName: "Directorate of Postgraduate Studies and Research",
    editorEmail: "dprtc@sua.ac.tz",
    discipline: "Agricultural & Environmental Sciences",
    invitationTrack: "FREE_INDEXING"
  },

  // ================= ETHIOPIA =================
  {
    journalName: "Ethiopian Journal of Health Development",
    issn: "1021-6790",
    eissn: "1021-6790",
    publisherName: "Addis Ababa University School of Public Health",
    institutionName: "Addis Ababa University",
    country: "Ethiopia",
    websiteUrl: "https://ejhd.org",
    editorName: "EJHD Editorial Office",
    editorEmail: "editorial@ejhd.org",
    discipline: "Health Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Jimma University Journal of Health Sciences",
    issn: "2306-0565",
    publisherName: "Jimma University Press",
    institutionName: "Jimma University",
    country: "Ethiopia",
    websiteUrl: "https://ju.edu.et/research",
    editorName: "Jimma Research Publications Desk",
    editorEmail: "research@ju.edu.et",
    discipline: "Health Sciences & Technology",
    invitationTrack: "FREE_INDEXING"
  },

  // ================= RWANDA =================
  {
    journalName: "Rwanda Journal of Medicine and Health Sciences",
    issn: "2663-8630",
    publisherName: "University of Rwanda College of Medicine",
    institutionName: "University of Rwanda",
    country: "Rwanda",
    websiteUrl: "https://rjmhs.ur.ac.rw",
    editorName: "Editor RJMHS",
    editorEmail: "rjmhs@ur.ac.rw",
    discipline: "Health Sciences",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "University of Kigali Academic Review",
    issn: null,
    publisherName: "University of Kigali Press",
    institutionName: "University of Kigali",
    country: "Rwanda",
    websiteUrl: "https://uok.ac.rw/research",
    editorName: "Director of Research and Innovation",
    editorEmail: "research@uok.ac.rw",
    discipline: "Business, Law & Computing",
    invitationTrack: "OJS_INCUBATION"
  },

  // ================= ZIMBABWE =================
  {
    journalName: "Zimbabwe Journal of Educational Research",
    issn: "1013-3445",
    publisherName: "University of Zimbabwe Publications",
    institutionName: "University of Zimbabwe",
    country: "Zimbabwe",
    websiteUrl: "https://www.uz.ac.zw/research",
    editorName: "Editor-in-Chief ZJER",
    editorEmail: "research@admin.uz.ac.zw",
    discipline: "Education & Pedagogy",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Midlands State University Journal of Science and Technology",
    issn: "2226-6135",
    publisherName: "Midlands State University Press",
    institutionName: "Midlands State University",
    country: "Zimbabwe",
    websiteUrl: "https://www.msu.ac.zw/research",
    editorName: "Research and Postgraduate Studies Office",
    editorEmail: "research@msu.ac.zw",
    discipline: "Science & Technology",
    invitationTrack: "FREE_INDEXING"
  },

  // ================= BOTSWANA & ZAMBIA =================
  {
    journalName: "University of Botswana Journal of African Studies",
    issn: "1815-9036",
    publisherName: "University of Botswana Press",
    institutionName: "University of Botswana",
    country: "Botswana",
    websiteUrl: "https://www.ub.bw/research",
    editorName: "Director of Research & Development",
    editorEmail: "ord@ub.ac.bw",
    discipline: "Social Sciences & African Studies",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "University of Zambia Journal of Agricultural and Biomedical Sciences",
    issn: "2311-942X",
    publisherName: "University of Zambia Press",
    institutionName: "University of Zambia",
    country: "Zambia",
    websiteUrl: "https://www.unza.zm/research",
    editorName: "Directorate of Research and Graduate Studies",
    editorEmail: "drgs@unza.zm",
    discipline: "Agricultural & Health Sciences",
    invitationTrack: "FREE_INDEXING"
  },

  // ================= EGYPT & NORTH AFRICA =================
  {
    journalName: "Cairo University Medical Journal",
    issn: "0016-867X",
    eissn: "2090-2646",
    publisherName: "Kasr Al Ainy Faculty of Medicine, Cairo University",
    institutionName: "Cairo University",
    country: "Egypt",
    websiteUrl: "https://medicaljournalofcairouniversity.net",
    editorName: "Cairo Medical Board",
    editorEmail: "editor@medicaljournalofcairouniversity.net",
    discipline: "Health Sciences & Clinical Medicine",
    invitationTrack: "FREE_INDEXING"
  },
  {
    journalName: "Alexandria Journal of Agricultural Research",
    issn: "0044-7250",
    publisherName: "Faculty of Agriculture, Alexandria University",
    institutionName: "Alexandria University",
    country: "Egypt",
    websiteUrl: "https://ajar.journals.ekb.eg",
    editorName: "Editor AJAR",
    editorEmail: "ajar@agr.alexu.edu.eg",
    discipline: "Agricultural & Food Sciences",
    invitationTrack: "FREE_INDEXING"
  }
];

export async function harvestAfricanCandidates(pool: any): Promise<{ added: number; skipped: number; total: number }> {
  const conn = await pool.getConnection();
  let added = 0;
  let skipped = 0;

  try {
    for (const item of COMPREHENSIVE_AFRICAN_JOURNAL_LEADS) {
      // 1. Check if already in live journal table by ISSN or Name
      const existingLive = await conn.query(
        "SELECT id FROM journal WHERE (issn = ? AND issn IS NOT NULL) OR (eissn = ? AND eissn IS NOT NULL) OR name = ? LIMIT 1",
        [item.issn, item.eissn, item.journalName]
      );

      if (existingLive.length > 0) {
        skipped++;
        continue;
      }

      // 2. Check if already in journal_candidate table
      const existingCandidate = await conn.query(
        "SELECT id FROM journal_candidate WHERE editorEmail = ? OR journalName = ? LIMIT 1",
        [item.editorEmail, item.journalName]
      );

      if (existingCandidate.length > 0) {
        skipped++;
        continue;
      }

      // 3. Insert fresh candidate
      const id = crypto.randomUUID();
      const inviteToken = crypto.randomBytes(16).toString("hex");

      await conn.query(
        `INSERT INTO journal_candidate 
         (id, journalName, issn, eissn, publisherName, institutionName, country, websiteUrl, editorName, editorEmail, discipline, invitationTrack, invitationStatus, inviteToken, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW(), NOW())`,
        [
          id,
          item.journalName,
          item.issn || null,
          item.eissn || null,
          item.publisherName,
          item.institutionName,
          item.country,
          item.websiteUrl,
          item.editorName,
          item.editorEmail,
          item.discipline,
          item.invitationTrack,
          inviteToken
        ]
      );

      added++;
    }

    const totalInDb = await conn.query("SELECT COUNT(*) as cnt FROM journal_candidate");

    return {
      added,
      skipped,
      total: Number(totalInDb[0].cnt)
    };
  } finally {
    conn.release();
  }
}
