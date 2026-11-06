// Helper to normalize and validate ORCID format (ISO 7064 structure)
export function normalizeOrcid(input: string): string | null {
  if (!input) return null;
  const clean = input.replace(/https?:\/\/orcid\.org\//i, "").replace(/\/+$/, "").trim();
  const regex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
  return regex.test(clean) ? clean : null;
}

// Helper to query official ORCID public API
export async function verifyOrcidWithRegistry(orcid: string) {
  const cleanOrcid = normalizeOrcid(orcid);
  if (!cleanOrcid) {
    return { 
      isValid: false, 
      exists: false, 
      error: "Invalid ORCID format. Must be 16 characters in groups of 4 separated by hyphens (e.g., 0000-0002-1825-0097)." 
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://pub.orcid.org/v3.0/${encodeURIComponent(cleanOrcid)}/person`, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "AfriJournalIndex/1.0 (mailto:afrijournalindex@gmail.com)"
      }
    });
    clearTimeout(timeout);

    if (res.status === 404) {
      return { 
        isValid: true, 
        exists: false, 
        error: `ORCID iD "${cleanOrcid}" does not exist in the official ORCID international registry (orcid.org).` 
      };
    }

    if (!res.ok) {
      return { 
        isValid: true, 
        exists: false, 
        error: `ORCID registry query failed with status ${res.status}.` 
      };
    }

    const data = await res.json();
    const givenNames = data.name?.["given-names"]?.value || "";
    const familyName = data.name?.["family-name"]?.value || "";
    const creditName = data.name?.["credit-name"]?.value || "";
    const fullName = creditName || `${givenNames} ${familyName}`.trim() || "Registered Scholar";

    return {
      isValid: true,
      exists: true,
      orcid: cleanOrcid,
      name: fullName,
      registeredName: fullName,
      givenNames,
      familyName
    };
  } catch (err: any) {
    return { 
      isValid: true, 
      exists: null, 
      error: "Network timeout connecting to ORCID public registry. Please verify connection and retry." 
    };
  }
}

export interface OrcidWorkItem {
  id: string;
  title: string;
  journalName?: string;
  publishedYear?: number;
  doi?: string;
  url?: string;
  type?: string;
  source: string;
}

/**
 * Fetches authenticated scholarly works directly from the official ORCID Public API.
 * Sourced live from pub.orcid.org/v3.0/{orcid}/works
 */
export async function fetchOrcidWorks(orcid: string): Promise<OrcidWorkItem[]> {
  const cleanOrcid = normalizeOrcid(orcid);
  if (!cleanOrcid) return [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://pub.orcid.org/v3.0/${encodeURIComponent(cleanOrcid)}/works`, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "AfriJournalIndex/1.0 (mailto:afrijournalindex@gmail.com)"
      }
    });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    const group = data?.group;
    if (!Array.isArray(group)) return [];

    const works: OrcidWorkItem[] = [];

    for (const g of group) {
      const summaries = g["work-summary"];
      if (!Array.isArray(summaries) || summaries.length === 0) continue;
      const ws = summaries[0];

      const title = ws?.title?.title?.value || "";
      if (!title) continue;

      const journalName = ws?.["journal-title"]?.value || "";
      const year = parseInt(ws?.["publication-date"]?.year?.value, 10) || undefined;
      const type = ws?.type || "journal-article";

      // Extract DOI or External ID
      let doi: string | undefined;
      let extUrl: string | undefined = ws?.url?.value || undefined;

      const externalIds = ws?.["external-ids"]?.["external-id"];
      if (Array.isArray(externalIds)) {
        for (const ext of externalIds) {
          const extType = String(ext["external-id-type"]).toLowerCase();
          const extVal = ext["external-id-value"];
          if (extType === "doi" && extVal) {
            doi = extVal.replace(/^https?:\/\/doi\.org\//i, "").trim();
            if (!extUrl) extUrl = `https://doi.org/${doi}`;
            break;
          }
        }
      }

      works.push({
        id: `orcid-${ws?.["put-code"] || Math.random().toString(36).slice(2, 9)}`,
        title,
        journalName,
        publishedYear: year,
        doi,
        url: extUrl,
        type: type.replace(/_/g, " "),
        source: "ORCID Registry"
      });
    }

    return works;
  } catch (e) {
    console.warn(`Failed to fetch works for ORCID ${orcid}:`, e);
    return [];
  }
}
