require('dotenv').config({ path: '.env' });
const mariadb = require('mariadb');

async function syncWanjohiDossier() {
  const pool = mariadb.createPool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "afrijournalindex",
    connectionLimit: 5,
  });

  const dossier = {
    externalLinks: {
      googleScholar: "https://scholar.google.com/citations?user=35w1t_gAAAAJ",
      orcid: "https://orcid.org/0000-0002-6980-0298",
      amazonAuthor: "https://www.amazon.com/stores/author/B007SNFB5Q",
      academia: "https://independent.academia.edu/AnthonyMWanjohi/Publications",
      researchGate: "https://www.researchgate.net/profile/Anthony-Wanjohi",
      linkedIn: "https://ke.linkedin.com/in/anthony-m-wanjohi",
      semanticScholar: "https://www.semanticscholar.org/search?q=Anthony%20M.%20Wanjohi&sort=relevance",
      website: "https://kenpro.org/"
    },
    books: [
      {
        id: "book-1",
        title: "Environmental, Social, Economic, and Political Sustainability in Sub-Saharan Africa",
        type: "Book chapter",
        year: "2025",
        publisher: "Springer Nature",
        url: "https://link.springer.com/chapter/10.1007/978-3-031-82857-7_3",
        description: "The Palgrave Handbook of Practical Sustainability (DOI: 10.1007/978-3-031-82857-7_3)"
      },
      {
        id: "book-2",
        title: "The Blue Flame: Biogas Training Blueprint",
        type: "Book",
        year: "2022",
        publisher: "Amazon Kindle / KENPRO",
        url: "https://www.amazon.com/stores/author/B007SNFB5Q",
        description: "Comprehensive training blueprint for biogas technology installation and management in East Africa."
      },
      {
        id: "book-3",
        title: "The Projects Guide: Basics of Planning and Management of Development Projects",
        type: "Book",
        year: "2022",
        publisher: "Amazon Kindle / KENPRO",
        url: "https://www.amazon.com/stores/author/B007SNFB5Q",
        description: "Core concepts, project cycle management, logical framework approach, and resource mobilisation."
      },
      {
        id: "book-4",
        title: "Needs Assessment Survey of Persons with Disabilities",
        type: "Research report",
        year: "2014",
        publisher: "KENPRO Publications",
        url: "https://kenpro.org/category/publications/",
        description: "Comprehensive field survey and policy report on accessibility and socio-economic empowerment."
      },
      {
        id: "book-5",
        title: "The Plight of Youth in the 21st Century: Key Issues and Interventions in a Developing Economy’s Perspective",
        type: "Research article",
        year: "2014",
        publisher: "ARJESS",
        url: "https://arjess.org/tag/anthony-m-wanjohi/",
        description: "Socio-economic analysis of youth employment, governance challenges, and vocational interventions."
      },
      {
        id: "book-6",
        title: "The Process of Developing a School Improvement Plan: Situation Analysis, Data Collection, Analysis, Interpretation and Reporting Processes",
        type: "Research article",
        year: "2014",
        publisher: "ARJESS",
        url: "https://arjess.org/the-process-of-developing-a-school-improvement-plan-situation-analysis-data-collection-analysis-interpretation-and-reporting-processes/",
        description: "Strategic framework for educational leadership and performance enhancement in Kenyan schools."
      },
      {
        id: "book-7",
        title: "Social Research Methods Series: Proposal Writing Guide",
        type: "Book",
        year: "2014",
        publisher: "Amazon / KENPRO",
        url: "https://www.amazon.com/stores/author/B007SNFB5Q",
        description: "Standard university textbook and practical guide for postgraduate thesis and project proposals."
      },
      {
        id: "book-8",
        title: "Defying All Odds: The Story of a Peasant Boy",
        type: "Book",
        year: "2012",
        publisher: "Amazon / KENPRO",
        url: "https://www.amazon.com/stores/author/B007SNFB5Q",
        description: "Biographical narrative and motivational memoir on resilience, education, and social change."
      },
      {
        id: "book-9",
        title: "Graphic Design and Marketing: The Existing Link",
        type: "Book/research publication",
        year: "2011",
        publisher: "Amazon / KENPRO",
        url: "https://www.amazon.com/stores/author/B007SNFB5Q",
        description: "Interdisciplinary study examining visual communication, brand positioning, and enterprise growth."
      },
      {
        id: "book-10",
        title: "Primary Science Series: Revision Guide for Standards 6, 7 and 8",
        type: "Educational book",
        year: "2011",
        publisher: "Amazon / KENPRO",
        url: "https://www.amazon.com/stores/author/B007SNFB5Q",
        description: "Curriculum revision guide for basic education and experimental sciences."
      },
      {
        id: "book-11",
        title: "Sustainability of Community-Based Projects in Developing Countries",
        type: "Research publication",
        year: "2010",
        publisher: "KENPRO Publications",
        url: "https://kenpro.org/category/publications/",
        description: "Empirical investigation of participatory approaches and institutional sustainability factors."
      },
      {
        id: "book-12",
        title: "Foundation Computer Studies: Students’ and Teachers’ Books",
        type: "Educational book series",
        year: "2005–2006",
        publisher: "Amazon Author",
        url: "https://www.amazon.com/stores/author/B007SNFB5Q",
        description: "Secondary school information technology textbook series covering digital literacy and applications."
      },
      {
        id: "book-13",
        title: "Harnessing Biogas in Kenyan Schools for Sustainable Energy and Education",
        type: "Research article",
        year: "2023",
        publisher: "KENPRO Research",
        url: "https://kenpro.org/harnessing-biogas-in-kenyan-schools-for-sustainable-energy-and-education/",
        description: "Institutional case study on clean cooking energy transitions in secondary schools."
      },
      {
        id: "book-14",
        title: "Fixed Dome Biogas Digester Installation in Kenya",
        type: "Technical article",
        year: "2023",
        publisher: "KENPRO Publications",
        url: "https://kenpro.org/fixed-dome-biogas-digester-installation-in-kenya/",
        description: "Engineering design, mason training protocols, and hydraulic sizing for masonry fixed dome digesters."
      },
      {
        id: "book-15",
        title: "Role of Renewable Energy in Agriculture in Kenya",
        type: "Research article",
        year: "2022",
        publisher: "KENPRO Research",
        url: "https://kenpro.org/role-of-renewable-energy-in-agriculture-in-kenya/",
        description: "Assessment of decentralized solar and bioenergy applications in post-harvest preservation."
      },
      {
        id: "book-16",
        title: "An Overview of Portable Domestic Household Biogas Plants Designs in Developing Economies",
        type: "Technical paper",
        year: "2021",
        publisher: "KENPRO Publications",
        url: "https://kenpro.org/tag/anthony-m-wanjohi/",
        description: "Comparative review of prefabricated and modular domestic digester technologies."
      },
      {
        id: "book-17",
        title: "An Overview of Improvised Kenpro Portable Biogas Plant (iKPBP) Design",
        type: "Technical paper",
        year: "2020",
        publisher: "Academia.edu",
        url: "https://independent.academia.edu/AnthonyMWanjohi/Publications",
        description: "Patent specifications, hydraulic parameters, and testing metrics of the iKPBP portable biogas unit."
      }
    ],
    consultancies: [
      {
        id: "con-1",
        assignment: "Renewable energy technologies for the agri-food value chain in Kiambu County",
        client: "ADS-Kenya",
        period: "2024 onward",
        url: "https://www.adskin.org/"
      },
      {
        id: "con-2",
        assignment: "Evaluation of the Green Businesses programme",
        client: "Zizi Afrique Foundation",
        period: "Feb–May 2024",
        url: "https://ziziafrique.org/"
      },
      {
        id: "con-3",
        assignment: "Fixed-dome biogas plant installation, Wema Centre",
        client: "Wema Centre",
        period: "Jan–Feb 2024",
        url: "https://kenpro.org/biogas-installation-project/"
      },
      {
        id: "con-4",
        assignment: "Solar brand market study across five East African countries",
        client: "Redington Group",
        period: "May–June 2023",
        url: "https://redingtongroup.com/"
      },
      {
        id: "con-5",
        assignment: "Fixed-dome biogas plant installation, Mathare",
        client: "Kenya Climate Innovation Center (KCIC)",
        period: "Feb–Apr 2022",
        url: "https://www.kenyacic.org/"
      },
      {
        id: "con-6",
        assignment: "IT and soft-skills training",
        client: "Don Bosco Boys Town",
        period: "Sept 2022",
        url: "https://donboscotechafrica.org/"
      },
      {
        id: "con-7",
        assignment: "Employment survey and review across 25 African countries",
        client: "Don Bosco Tech Africa",
        period: "Aug 2019–Mar 2020",
        url: "https://donboscotechafrica.org/"
      },
      {
        id: "con-8",
        assignment: "Prison-reform project evaluation",
        client: "St Joseph Cafasso Consolation House / CEFA",
        period: "Jan–Feb 2018",
        url: "https://www.kenpro.org/publications.htm"
      },
      {
        id: "con-9",
        assignment: "Milk-processing plant feasibility study, West Pokot",
        client: "Development project",
        period: "Jan–May 2017",
        url: "https://www.kenpro.org/publications.htm"
      },
      {
        id: "con-10",
        assignment: "Fruit-farming viability study, Kajiado",
        client: "Nasaru CBO",
        period: "July–Aug 2017",
        url: "https://www.kenpro.org/publications.htm"
      },
      {
        id: "con-11",
        assignment: "Rehabilitation data-management system, Dadaab and Kakuma",
        client: "Handicap International",
        period: "Mar–Apr 2015",
        url: "https://www.hi.org/"
      },
      {
        id: "con-12",
        assignment: "Systematic review of vocational training in Somalia",
        client: "African Development and Emergency Organization (ADEO)",
        period: "Nov–Dec 2014",
        url: "https://www.kenpro.org/publications.htm"
      },
      {
        id: "con-13",
        assignment: "Disability needs assessment in Dadaab",
        client: "Lutheran World Federation",
        period: "Aug–Nov 2014",
        url: "https://kenpro.org/category/publications/"
      },
      {
        id: "con-14",
        assignment: "Project planning training for youth",
        client: "Refugee Education Trust",
        period: "May–June 2014",
        url: "https://www.kenpro.org/publications.htm"
      },
      {
        id: "con-15",
        assignment: "Small Claims Court research",
        client: "Legal Resources Foundation Trust",
        period: "Sept–Oct 2010",
        url: "https://www.kenpro.org/publications.htm"
      }
    ],
    innovations: [
      {
        id: "inn-1",
        title: "Kenpro Portable Biogas Plant (KPBP)",
        type: "Patent / Technical Design",
        description: "Portable domestic biogas plant innovation designed for households and institutional test sites.",
        url: "https://kenpro.org/biogas-installation-project/"
      },
      {
        id: "inn-2",
        title: "Improvised Kenpro Portable Biogas Plant (iKPBP)",
        type: "Patent / Technical Design",
        description: "Improvised and reinforced design of the Kenpro Portable Biogas Plant for localized manufacturing.",
        url: "https://independent.academia.edu/AnthonyMWanjohi/Publications"
      }
    ],
    media: [
      {
        id: "med-1",
        outlet: "Citizen TV Kenya",
        subject: "Kenya’s Gold: Scaling Up Renewable Energy",
        date: "15 Nov 2024",
        url: "https://www.youtube.com/watch?v=pJ7vAyPvkLw"
      },
      {
        id: "med-2",
        outlet: "KBC",
        subject: "Biogas project launch at KIRDI/UNIDO",
        date: "31 Jan 2023",
        url: "https://www.youtube.com/watch?v=7bWAnJJMuDw&t=3s"
      },
      {
        id: "med-3",
        outlet: "Metro TV",
        subject: "Game Changers: Digitizing Education in Kenya",
        date: "30 Aug 2019",
        url: "https://www.youtube.com/watch?v=_yAY708o1uM"
      },
      {
        id: "med-4",
        outlet: "ABC South Africa",
        subject: "Small and medium-sized enterprise sector in Kenya",
        date: "6 Feb 2013",
        url: "https://www.youtube.com/watch?v=w3nc2uYquLU"
      }
    ],
    memberships: [
      {
        id: "mem-1",
        body: "International Society for Development and Sustainability (ISDS)",
        details: "Member ID: M13110433"
      }
    ]
  };

  const bioText = "Wanjohi is a scholar, author, educationist, social research scientist and sustainable development practitioner. He is Founder and Director of Projects and Research at Kenya Projects Organization (KENPRO), Higher Institute of Applied Learning (HIAL) and Editor-in-Chief of the African Research Journal of Education and Social Sciences (ARJESS). His work spans research and publishing, quality education, sustainable development, environmental sustainability, and innovations in renewable energy and information systems.\n\nResearch interests: Quality education, sustainable development, environmental sustainability and renewable energy. Related interests include educational improvement, research methodology, monitoring, evaluation, research and learning (MERL), community development, youth development, biogas technologies and clean energy applications in agriculture and innovative IT Solutions.";

  try {
    // 1. Release conflicting orcid from test accounts if any
    await pool.query(
      `UPDATE user SET orcid = NULL WHERE orcid = '0000-0002-6980-0298' AND email != 'wanjohi@kenpro.org'`
    );

    // 2. Update Wanjohi profile
    const result = await pool.query(
      `UPDATE user 
       SET dossierData = ?,
           bio = ?,
           orcid = '0000-0002-6980-0298',
           googleScholarId = '35w1t_gAAAAJ',
           googleScholarUrl = 'https://scholar.google.com/citations?user=35w1t_gAAAAJ',
           totalCitations = 633,
           hIndex = 10,
           i10Index = 11,
           isClaimed = 1
       WHERE email = 'wanjohi@kenpro.org' OR id = '8423bb89-025f-4dd9-b0cf-b63269d856a7'`,
      [JSON.stringify(dossier), bioText]
    );

    console.log("Updated Wanjohi dossierData in DB successfully:", result);

  } catch (err) {
    console.error("Error updating Wanjohi dossier:", err);
  } finally {
    await pool.end();
  }
}

syncWanjohiDossier();
