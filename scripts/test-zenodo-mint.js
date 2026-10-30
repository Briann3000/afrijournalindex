require('dotenv').config({ path: '.env' });
const { ZenodoClient } = require('../src/lib/zenodo');

async function testPilotMint() {
  console.log("=== Testing Zenodo DOI Automated Minting Engine (Sandbox Pilot) ===");

  const client = new ZenodoClient({ useSandbox: true });
  console.log("Environment:", client.getEnvironment());

  // Test article: arjess-1016
  const articleData = {
    pdfUrl: "http://arjess.org/social-sciences-research/essence-of-environmental-governance-in-solid-waste-management-a-spatial-analysis-of-the-unplanned-dumpsites-in-nairobi-county.pdf",
    filename: "essence-of-environmental-governance-in-solid-waste-management.pdf",
    metadata: {
      title: "Essence of Environmental Governance in Solid Waste Management: A Spatial Analysis of the unplanned Dumpsites in Nairobi County",
      description: "<p>In Nairobi County, rapid urban settlement patterns have been on the increase and this in turn results to stretching the existing resources. Due to this, the existing Solid Waste Management systems have resulted to the mushrooming of unplanned dumpsites. Environmental governance in solid waste management is becoming a key pillar in the proper waste management strategies and dominates the development discourse.</p>",
      publication_date: "2018-08-30",
      creators: [
        { name: "Ogundeph, Maureen", affiliation: "The Catholic University of Eastern Africa" },
        { name: "Calistus, Luhombo Adema", affiliation: "The Catholic University of Eastern Africa" }
      ],
      journal_title: "African Research Journal of Education and Social Sciences",
      journal_volume: "5",
      journal_issue: "2",
      journal_pages: "1-12",
      journal_issn: "2312-0134",
      keywords: ["Solid Waste Management", "Environmental Governance", "Nairobi County", "Spatial Analysis"],
      community_slug: "arjess",
      access_right: "open",
      license: "cc-by-4.0"
    },
    autoPublish: true // Full pilot test: mint DOI on sandbox
  };

  console.log("\nInitiating minting pipeline for article...");
  console.log("Title:", articleData.metadata.title);
  console.log("Target Community:", articleData.metadata.community_slug);
  console.log("PDF Source:", articleData.pdfUrl);

  const startTime = Date.now();
  const result = await client.mintArticleDoi(articleData);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n=== Result (" + elapsed + "s) ===");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\n SUCCESS! Sandbox DOI minted:");
    console.log("DOI:", result.doi);
    console.log("Record URL:", result.recordUrl);
    console.log("DOI URL:", result.doiUrl);
  } else {
    console.error("\n FAILED:", result.error);
  }
}

testPilotMint().catch(console.error);
