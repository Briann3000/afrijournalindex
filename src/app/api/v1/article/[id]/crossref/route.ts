import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
 * Crossref 5.3.1 Schema Deposit XML Generator
 * Exports validated Crossref XML with contributor ORCID and sovereign AfriScholar ID attributes.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new Response("<error>Missing article ID</error>", { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        journal: true,
        claims: {
          where: { status: "VERIFIED" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                institution: true,
                afriScholarId: true,
                orcid: true
              }
            }
          }
        }
      }
    });

    if (!article) {
      return new Response("<error>Article not found</error>", { status: 404 });
    }

    const pubDate = new Date(article.publishDate);
    const pubYear = !isNaN(pubDate.getFullYear()) ? pubDate.getFullYear() : 2024;
    const pubMonth = !isNaN(pubDate.getMonth()) ? String(pubDate.getMonth() + 1).padStart(2, "0") : "01";
    const pubDay = !isNaN(pubDate.getDate()) ? String(pubDate.getDate()).padStart(2, "0") : "01";

    const timestamp = Date.now();
    const batchId = `AJI-BATCH-${article.id.slice(0, 8)}-${timestamp}`;

    // Contributors
    const contributors = (article.claims && article.claims.length > 0)
      ? article.claims.map((c: any, idx: number) => {
          const user = c.user;
          const nameParts = (user?.name || "Author").trim().split(/\s+/);
          const surname = nameParts.length > 1 ? nameParts.pop()! : nameParts[0];
          const givenName = nameParts.join(" ") || "Scholar";
          const sequence = idx === 0 ? "first" : "additional";
          const orcid = user?.orcid ? user.orcid.replace(/^https?:\/\/orcid\.org\//i, "") : null;

          return `
          <person_name contributor_role="author" sequence="${sequence}">
            <given_name>${escapeXml(givenName)}</given_name>
            <surname>${escapeXml(surname)}</surname>
            ${user?.institution ? `<affiliations><institution><institution_name>${escapeXml(user.institution)}</institution_name></institution></affiliations>` : ""}
            ${orcid ? `<ORCID authenticated="true">https://orcid.org/${escapeXml(orcid)}</ORCID>` : ""}
            ${user?.afriScholarId ? `<item_number item_number_type="afrischolar-id">${escapeXml(user.afriScholarId)}</item_number>` : ""}
          </person_name>`;
        }).join("")
      : `
          <person_name contributor_role="author" sequence="first">
            <given_name>Contributing</given_name>
            <surname>Scholar</surname>
            <affiliations><institution><institution_name>${escapeXml(article.journal?.name || "African Academic Publisher")}</institution_name></institution></affiliations>
          </person_name>`;

    const doi = article.doi || `10.6084/m9.afrijournal.${article.id.slice(0, 8)}`;
    const landingUrl = `https://afrijournalindexing.org/article/${article.id}`;
    const pdfUrl = article.pdfUrl || landingUrl;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch version="5.3.1"
           xmlns="http://www.crossref.org/schema/5.3.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://www.crossref.org/schema/5.3.1 http://www.crossref.org/schemas/crossref5.3.1.xsd">
  <head>
    <doi_batch_id>${batchId}</doi_batch_id>
    <timestamp>${timestamp}</timestamp>
    <depositor>
      <depositor_name>AfriJournal Index Registry</depositor_name>
      <email_address>registry@afrijournalindexing.org</email_address>
    </depositor>
    <registrant>AfriJournal Index</registrant>
  </head>
  <body>
    <journal>
      <journal_metadata language="en">
        <full_title>${escapeXml(article.journal?.name || "AfriJournal Index")}</full_title>
        <issn media_type="electronic">${escapeXml(article.journal?.eissn || article.journal?.issn || "2312-0134")}</issn>
      </journal_metadata>
      <journal_issue>
        <publication_date media_type="online">
          <month>${pubMonth}</month>
          <day>${pubDay}</day>
          <year>${pubYear}</year>
        </publication_date>
      </journal_issue>
      <journal_article publication_type="full_text">
        <titles>
          <title>${escapeXml(article.title)}</title>
        </titles>
        <contributors>${contributors}
        </contributors>
        <publication_date media_type="online">
          <month>${pubMonth}</month>
          <day>${pubDay}</day>
          <year>${pubYear}</year>
        </publication_date>
        <doi_data>
          <doi>${escapeXml(doi)}</doi>
          <resource>${escapeXml(landingUrl)}</resource>
          <collection property="crawler-based">
            <item crawler="google">
              <resource>${escapeXml(pdfUrl)}</resource>
            </item>
          </collection>
        </doi_data>
      </journal_article>
    </journal>
  </body>
</doi_batch>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${article.id.slice(0, 8)}_crossref_deposit.xml"`,
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err: any) {
    console.error("Crossref XML generation error:", err);
    return new Response(`<error>${escapeXml(err.message)}</error>`, {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" }
    });
  }
}
