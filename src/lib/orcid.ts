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
        "User-Agent": "AfriJournalIndex/1.0 (mailto:indexing@afrijournal.org)"
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
