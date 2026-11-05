import { NextResponse } from "next/server";
import { harvestOaiRecords, identifyOaiRepository } from "../../../../lib/oai-harvester";
import { prisma } from "../../../../lib/db";

export const dynamic = "force-dynamic";

function escapeXml(unsafe?: string | null): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * OAI-PMH v2.0 Protocol Server Endpoint
 * Implements Open Archives Initiative protocol for international harvesters
 * (OpenAlex, BASE, CORE, Google Scholar, WorldCat)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const verb = searchParams.get("verb") || "Identify";
    const set = searchParams.get("set");
    const identifier = searchParams.get("identifier");
    const metadataPrefix = searchParams.get("metadataPrefix") || "oai_dc";
    const responseDate = new Date().toISOString();
    const baseUrl = "https://afrijournalindexing.org/api/harvester/oai";

    let bodyXml = "";

    if (verb === "Identify") {
      bodyXml = `
  <Identify>
    <repositoryName>AfriJournal Index Continental Scholarly Repository</repositoryName>
    <baseURL>${baseUrl}</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>info@afrijournalindexing.org</adminEmail>
    <earliestDatestamp>2020-01-01T00:00:00Z</earliestDatestamp>
    <deletedRecord>no</deletedRecord>
    <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
  </Identify>`;
    } else if (verb === "ListMetadataFormats") {
      bodyXml = `
  <ListMetadataFormats>
    <metadataFormat>
      <metadataPrefix>oai_dc</metadataPrefix>
      <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
      <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
    </metadataFormat>
  </ListMetadataFormats>`;
    } else if (verb === "ListSets") {
      bodyXml = `
  <ListSets>
    <set>
      <setSpec>scholars</setSpec>
      <setName>Accredited African Scholars (AfriScholar ID Registry)</setName>
    </set>
    <set>
      <setSpec>articles</setSpec>
      <setName>Peer-Reviewed Articles</setName>
    </set>
  </ListSets>`;
    } else if (verb === "ListRecords" || verb === "GetRecord") {
      const recordsXml: string[] = [];

      if (identifier) {
        // Handle single GetRecord
        const asidMatch = identifier.match(/ASID-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
        const targetAsid = asidMatch ? asidMatch[0].toUpperCase() : identifier.replace(/.*:/, "").toUpperCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { afriScholarId: targetAsid },
              { id: identifier.replace(/.*:/, "") }
            ]
          }
        });

        if (user && user.afriScholarId) {
          recordsXml.push(`
    <record>
      <header>
        <identifier>oai:afrijournalindexing.org:scholar:${user.afriScholarId}</identifier>
        <datestamp>${user.createdAt.toISOString()}</datestamp>
        <setSpec>scholars</setSpec>
      </header>
      <metadata>
        <oai_dc:dc 
          xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" 
          xmlns:dc="http://purl.org/dc/elements/1.1/" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
          <dc:title>${escapeXml(user.name)}</dc:title>
          <dc:creator>${escapeXml(user.name)}</dc:creator>
          <dc:description>${escapeXml(user.bio || user.department || "Accredited African Scholar")}</dc:description>
          <dc:publisher>${escapeXml(user.institution || "African Academic Institution")}</dc:publisher>
          <dc:identifier>https://afrijournalindexing.org/scholar/${user.afriScholarId}</dc:identifier>
          <dc:identifier>urn:asid:${user.afriScholarId}</dc:identifier>
          ${user.orcid ? `<dc:relation>https://orcid.org/${escapeXml(user.orcid)}</dc:relation>` : ""}
          ${user.openAlexId ? `<dc:relation>${escapeXml(user.openAlexId)}</dc:relation>` : ""}
          <dc:type>Person / Researcher</dc:type>
        </oai_dc:dc>
      </metadata>
    </record>`);
        }
      } else {
        // List records for scholars
        const scholars = await prisma.user.findMany({
          where: { afriScholarId: { not: null } },
          take: 50,
          orderBy: { totalCitations: "desc" }
        });

        for (const s of scholars) {
          if (!s.afriScholarId) continue;
          recordsXml.push(`
    <record>
      <header>
        <identifier>oai:afrijournalindexing.org:scholar:${s.afriScholarId}</identifier>
        <datestamp>${s.createdAt.toISOString()}</datestamp>
        <setSpec>scholars</setSpec>
      </header>
      <metadata>
        <oai_dc:dc 
          xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" 
          xmlns:dc="http://purl.org/dc/elements/1.1/" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
          <dc:title>${escapeXml(s.name)}</dc:title>
          <dc:creator>${escapeXml(s.name)}</dc:creator>
          <dc:description>${escapeXml(s.bio || s.department || "Accredited African Scholar")}</dc:description>
          <dc:publisher>${escapeXml(s.institution || "African Academic Institution")}</dc:publisher>
          <dc:identifier>https://afrijournalindexing.org/scholar/${s.afriScholarId}</dc:identifier>
          <dc:identifier>urn:asid:${s.afriScholarId}</dc:identifier>
          ${s.orcid ? `<dc:relation>https://orcid.org/${escapeXml(s.orcid)}</dc:relation>` : ""}
          ${s.openAlexId ? `<dc:relation>${escapeXml(s.openAlexId)}</dc:relation>` : ""}
          <dc:type>Person / Researcher</dc:type>
        </oai_dc:dc>
      </metadata>
    </record>`);
        }
      }

      bodyXml = `
  <${verb}>
    ${recordsXml.join("\n")}
  </${verb}>`;
    } else {
      bodyXml = `
  <error code="badVerb">Illegal OAI verb</error>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${responseDate}</responseDate>
  <request verb="${escapeXml(verb)}">${baseUrl}</request>${bodyXml}
</OAI-PMH>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err: any) {
    console.error("OAI feed error:", err);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/"><error code="internalError">${escapeXml(err.message)}</error></OAI-PMH>`, {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" }
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { oaiUrl, journalId, autoSave } = body;

    if (!oaiUrl || typeof oaiUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid OAI-PMH Base URL is required." },
        { status: 400 }
      );
    }

    // 1. Identify repository
    const identify = await identifyOaiRepository(oaiUrl);
    if (!identify) {
      return NextResponse.json(
        { success: false, error: "Could not connect to OAI-PMH endpoint. Ensure the server supports OAI-PMH v2.0." },
        { status: 422 }
      );
    }

    const maxLimit = Math.min(1000, Math.max(10, parseInt(body.limit || "500", 10)));

    // 2. Harvest records with deep pagination
    const harvest = await harvestOaiRecords(oaiUrl, maxLimit);

    if (!harvest.success) {
      return NextResponse.json(
        { success: false, error: harvest.error || "Failed to harvest records." },
        { status: 500 }
      );
    }

    let savedCount = 0;

    // 3. Optional auto-save if journalId is passed
    if (autoSave && journalId && harvest.records.length > 0) {
      for (const rec of harvest.records) {
        try {
          const doi = rec.doi ? rec.doi.trim() : null;
          if (doi) {
            const existing = await prisma.article.findUnique({ where: { doi } });
            if (!existing) {
              await prisma.article.create({
                data: {
                  title: rec.title,
                  doi,
                  abstract: rec.description || null,
                  pdfUrl: rec.url || null,
                  publishDate: new Date(rec.publishDate || Date.now()),
                  journalId
                }
              });
              savedCount++;
            }
          } else {
            await prisma.article.create({
              data: {
                title: rec.title,
                doi: null,
                abstract: rec.description || null,
                pdfUrl: rec.url || null,
                publishDate: new Date(rec.publishDate || Date.now()),
                journalId
              }
            });
            savedCount++;
          }
        } catch {
          // Skip on conflict
        }
      }
    }

    return NextResponse.json({
      success: true,
      repository: identify,
      totalHarvested: harvest.records.length,
      savedCount,
      articles: harvest.records
    });
  } catch (error: any) {
    console.error("OAI Harvesting API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
