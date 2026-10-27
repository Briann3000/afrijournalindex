/**
 * Lightweight, robust parser for BibTeX exports from Google Scholar, Crossref, and Zotero.
 */

export interface ParsedBibEntry {
  id: string;
  type: string; // "Book", "Book Chapter", "Research Report", "Article", "Conference Paper"
  title: string;
  authors: string;
  year?: string;
  publisher?: string;
  journal?: string;
  url?: string;
  doi?: string;
  rawType: string;
}

export function parseBibTeX(bibtexString: string): ParsedBibEntry[] {
  if (!bibtexString || typeof bibtexString !== "string") return [];

  const entries: ParsedBibEntry[] = [];
  // Regex to match BibTeX entries: @type{key, fields...}
  const entryRegex = /@([a-zA-Z]+)\s*\{\s*([^,]+),([\s\S]*?)(?=\n@|\n\s*$|$)/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(bibtexString)) !== null) {
    const rawType = match[1].toLowerCase();
    const key = match[2].trim();
    const body = match[3];

    const fields: Record<string, string> = {};
    // Regex for field = {value} or field = "value" or field = number
    const fieldRegex = /([a-zA-Z_]+)\s*=\s*(?:\{([^}]*)\}|"([^"]*)"|([0-9a-zA-Z_]+))/g;
    let fieldMatch: RegExpExecArray | null;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const fName = fieldMatch[1].toLowerCase();
      const fVal = (fieldMatch[2] !== undefined ? fieldMatch[2] : fieldMatch[3] !== undefined ? fieldMatch[3] : fieldMatch[4] || "").trim();
      // Clean up common LaTeX braces/escapes: {A}frica -> Africa, \"o -> o
      const cleanedVal = fVal.replace(/[{}]/g, "").replace(/\\['"`^~]/g, "");
      fields[fName] = cleanedVal;
    }

    let typeLabel = "Publication";
    if (rawType === "book") typeLabel = "Book";
    else if (rawType === "incollection" || rawType === "inbook") typeLabel = "Book Chapter";
    else if (rawType === "article") typeLabel = "Journal Article";
    else if (rawType === "techreport" || rawType === "report") typeLabel = "Research Report";
    else if (rawType === "inproceedings" || rawType === "conference") typeLabel = "Conference Paper";
    else if (rawType === "phdthesis" || rawType === "mastersthesis") typeLabel = "Dissertation / Thesis";
    else if (rawType === "misc") typeLabel = "Working Paper / Monograph";

    const title = fields.title || "Untitled Work";
    const authors = fields.author ? fields.author.replace(/\s+and\s+/g, ", ") : "";
    const year = fields.year || "";
    const publisher = fields.publisher || fields.journal || fields.booktitle || fields.institution || fields.school || "";
    const url = fields.url || (fields.doi ? `https://doi.org/${fields.doi}` : undefined);
    const doi = fields.doi || undefined;

    entries.push({
      id: key || `bib-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: typeLabel,
      title,
      authors,
      year,
      publisher,
      journal: fields.journal,
      url,
      doi,
      rawType
    });
  }

  return entries;
}
