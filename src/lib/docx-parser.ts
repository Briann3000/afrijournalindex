import zlib from "zlib";

export interface DocxParsedProfile {
  profile: {
    orcid?: string;
    bio?: string;
    researchFocus?: string[];
  };
  externalLinks: {
    googleScholar?: string;
    amazonAuthor?: string;
    researchGate?: string;
    academia?: string;
    linkedIn?: string;
    semanticScholar?: string;
  };
  dossier: {
    books: Array<{
      title: string;
      authors?: string;
      year?: string;
      publisher?: string;
      url?: string;
      type?: string;
      description?: string;
    }>;
    consultancies: Array<{
      client: string;
      title: string;
      period?: string;
      url?: string;
      description?: string;
    }>;
    innovations: Array<{
      title: string;
      type?: string;
      description?: string;
      url?: string;
    }>;
    media: Array<{
      outlet: string;
      title: string;
      date?: string;
      url?: string;
    }>;
    memberships: Array<{
      organization: string;
      role?: string;
      year?: string;
    }>;
  };
}

function extractFileFromZip(zipBuffer: Buffer, targetFileName: string): string | null {
  let offset = 0;
  while (offset < zipBuffer.length - 4) {
    const sig = zipBuffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const method = zipBuffer.readUInt16LE(offset + 8);
    const compSize = zipBuffer.readUInt32LE(offset + 18);
    const fnameLen = zipBuffer.readUInt16LE(offset + 26);
    const extraLen = zipBuffer.readUInt16LE(offset + 28);
    const filename = zipBuffer.toString("utf8", offset + 30, offset + 30 + fnameLen);
    const dataStart = offset + 30 + fnameLen + extraLen;

    if (filename === targetFileName) {
      const compData = zipBuffer.subarray(dataStart, dataStart + compSize);
      return method === 8 ? zlib.inflateRawSync(compData).toString("utf8") : compData.toString("utf8");
    }
    offset = dataStart + compSize;
  }
  return null;
}

function getCleanText(xmlFragment: string): string {
  const parts: string[] = [];
  const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
  let m: RegExpExecArray | null;
  while ((m = tRegex.exec(xmlFragment)) !== null) {
    parts.push(m[1]);
  }
  return parts.join("").trim();
}

export function parseDocxProfile(buffer: Buffer): DocxParsedProfile | null {
  const xml = extractFileFromZip(buffer, "word/document.xml");
  if (!xml) return null;

  // Extract all paragraphs
  const paragraphs: string[] = [];
  const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let pMatch: RegExpExecArray | null;
  while ((pMatch = pRegex.exec(xml)) !== null) {
    const text = getCleanText(pMatch[1]);
    if (text) paragraphs.push(text);
  }

  // Extract all tables
  const tblRegex = /<w:tbl(?:\s[^>]*)?>([\s\S]*?)<\/w:tbl>/g;
  let match: RegExpExecArray | null;
  const tables: string[][][] = [];

  while ((match = tblRegex.exec(xml)) !== null) {
    const tblXml = match[1];
    const trRegex = /<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g;
    let trMatch: RegExpExecArray | null;
    const rows: string[][] = [];

    while ((trMatch = trRegex.exec(tblXml)) !== null) {
      const trXml = trMatch[1];
      const tcRegex = /<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g;
      let tcMatch: RegExpExecArray | null;
      const cells: string[] = [];

      while ((tcMatch = tcRegex.exec(trXml)) !== null) {
        cells.push(getCleanText(tcMatch[1]));
      }
      if (cells.length > 0 && cells.some((c) => c.length > 0)) {
        rows.push(cells);
      }
    }
    if (rows.length > 0) tables.push(rows);
  }

  const result: DocxParsedProfile = {
    profile: {},
    externalLinks: {},
    dossier: {
      books: [],
      consultancies: [],
      innovations: [],
      media: [],
      memberships: []
    }
  };

  const allText = paragraphs.join("\n");
  const googleScholarMatch = allText.match(/https?:\/\/scholar\.google\.com\/citations\?[^\s"<>]+/i);
  if (googleScholarMatch) result.externalLinks.googleScholar = googleScholarMatch[0];

  const amazonMatch =
    allText.match(/(?:https?:\/\/)?(?:www\.)?amazon\.com\/stores\/author\/[^\s"<>]+/i) ||
    allText.match(/(?:https?:\/\/)?(?:www\.)?amazon\.com\/author\/[^\s"<>]+/i);
  if (amazonMatch) {
    result.externalLinks.amazonAuthor = amazonMatch[0].startsWith("http")
      ? amazonMatch[0]
      : `https://${amazonMatch[0]}`;
  }

  const orcidMatch = allText.match(/0000-000[1-3]-[0-9]{4}-[0-9]{3}[0-9X]/i);
  if (orcidMatch) result.profile.orcid = orcidMatch[0];

  const rgMatch = allText.match(/https?:\/\/(?:www\.)?researchgate\.net\/profile\/[^\s"<>]+/i);
  if (rgMatch) result.externalLinks.researchGate = rgMatch[0];

  const acMatch = allText.match(/https?:\/\/[a-z0-9.-]*academia\.edu\/[^\s"<>]+/i);
  if (acMatch) result.externalLinks.academia = acMatch[0];

  const liMatch = allText.match(/https?:\/\/[a-z0-9.-]*linkedin\.com\/in\/[^\s"<>]+/i);
  if (liMatch) result.externalLinks.linkedIn = liMatch[0];

  const ssMatch = allText.match(/https?:\/\/(?:www\.)?semanticscholar\.org\/[^\s"<>]+/i);
  if (ssMatch) result.externalLinks.semanticScholar = ssMatch[0].replace(/&amp;/g, "&");

  // Process tables
  for (const tbl of tables) {
    if (tbl.length < 2) continue;
    const headerRow = tbl[0].map((c) => c.toLowerCase());
    const headerStr = headerRow.join(" ");

    // 1. Publications Table: (Year, Publication, Type, Source)
    if (
      headerStr.includes("publication") ||
      (headerStr.includes("year") && (headerStr.includes("type") || headerStr.includes("title")))
    ) {
      for (let i = 1; i < tbl.length; i++) {
        const row = tbl[i];
        if (row.length < 2) continue;
        let year = "";
        let title = "";
        let type = "Book";
        let source = "";

        if (headerRow.includes("year")) {
          const yIdx = headerRow.findIndex((h) => h.includes("year"));
          const pIdx = headerRow.findIndex((h) => h.includes("publication") || h.includes("title"));
          const tIdx = headerRow.findIndex((h) => h.includes("type"));
          const sIdx = headerRow.findIndex((h) => h.includes("source") || h.includes("publisher"));
          year = row[yIdx] || "";
          title = row[pIdx] || "";
          type = row[tIdx] || "Book";
          source = row[sIdx] || "";
        } else {
          title = row[0];
          type = row[1] || "Book";
          source = row[2] || "";
        }

        if (title && title.length > 3) {
          const urlMatch = source.match(/https?:\/\/[^\s]+/i);
          result.dossier.books.push({
            title,
            year,
            type,
            publisher: source.replace(/https?:\/\/[^\s]+/i, "").replace(/[:]/g, "").trim(),
            url: urlMatch ? urlMatch[0] : source.startsWith("http") ? source : ""
          });
        }
      }
    }

    // 2. Consultancy & Projects: (Assignment, Organisation/client, Period, Source)
    else if (
      headerStr.includes("assignment") ||
      headerStr.includes("client") ||
      headerStr.includes("consultancy")
    ) {
      for (let i = 1; i < tbl.length; i++) {
        const row = tbl[i];
        if (row.length < 2) continue;
        const title = row[0] || "";
        const client = row[1] || "";
        const period = row[2] || "";
        const source = row[3] || "";
        if (title) {
          const urlMatch = source.match(/https?:\/\/[^\s]+/i);
          result.dossier.consultancies.push({
            title,
            client,
            period,
            url: urlMatch ? urlMatch[0] : source.startsWith("http") ? source : ""
          });
        }
      }
    }

    // 3. Innovation and Patent: (Innovation, Description, Source)
    else if (headerStr.includes("innovation") || headerStr.includes("patent")) {
      for (let i = 1; i < tbl.length; i++) {
        const row = tbl[i];
        if (row.length < 2) continue;
        const title = row[0] || "";
        const description = row[1] || "";
        const source = row[2] || "";
        if (title) {
          const urlMatch = source.match(/https?:\/\/[^\s]+/i);
          result.dossier.innovations.push({
            title,
            type: title.toLowerCase().includes("patent") ? "Patent" : "Innovation",
            description,
            url: urlMatch ? urlMatch[0] : source.startsWith("http") ? source : ""
          });
        }
      }
    }

    // 4. Media appearances: (Media outlet, Programme/subject, Date, Source)
    else if (
      headerStr.includes("media") ||
      headerStr.includes("outlet") ||
      headerStr.includes("programme")
    ) {
      for (let i = 1; i < tbl.length; i++) {
        const row = tbl[i];
        if (row.length < 2) continue;
        const outlet = row[0] || "";
        const title = row[1] || "";
        const date = row[2] || "";
        const source = row[3] || "";
        if (title || outlet) {
          const urlMatch = source.match(/https?:\/\/[^\s]+/i);
          result.dossier.media.push({
            outlet,
            title,
            date,
            url: urlMatch ? urlMatch[0] : source.startsWith("http") ? source : ""
          });
        }
      }
    }

    // 5. Professional Membership
    else if (headerStr.includes("membership") || headerStr.includes("professional body")) {
      for (let i = 1; i < tbl.length; i++) {
        const row = tbl[i];
        if (row.length < 2) continue;
        const organization = row[0] || "";
        const role = row[1] || "";
        if (organization) {
          result.dossier.memberships.push({ organization, role });
        }
      }
    }
  }

  return result;
}
