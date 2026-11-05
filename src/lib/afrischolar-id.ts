/**
 * AfriScholar ID (ASID) - Pan-African Scholar Persistent Digital Identifier
 * 
 * Standard Format: ASID-XXXX-XXXX-XXXX
 * - 12 alphanumeric characters in 3 groups of 4 separated by hyphens.
 * - Uses Crockford Base32 alphabet (excludes ambiguous characters: I, L, O, U).
 * - Position 12 is a Modulo-32 check character to validate manual entry integrity.
 */

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CHAR_TO_VAL: Record<string, number> = {};
for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
  CHAR_TO_VAL[CROCKFORD_ALPHABET[i]] = i;
}

// Map common visual confusions
const CONFUSION_MAP: Record<string, string> = {
  "I": "1",
  "L": "1",
  "O": "0",
  "U": "V"
};

/**
 * Computes a weighted Modulo-32 checksum character for an 11-character string.
 */
function computeChecksum(payload11: string): string {
  let sum = 0;
  for (let i = 0; i < payload11.length; i++) {
    const char = payload11[i].toUpperCase();
    const val = CHAR_TO_VAL[char] ?? 0;
    sum += val * (i + 1);
  }
  const checkVal = sum % 32;
  return CROCKFORD_ALPHABET[checkVal];
}

/**
 * Generates a new formatted AfriScholar ID with a valid checksum.
 * Example output: "ASID-4821-9K04-294H"
 */
export function generateAfriScholarId(): string {
  let payload = "";
  // Generate 11 random Crockford Base32 characters
  for (let i = 0; i < 11; i++) {
    const randIdx = Math.floor(Math.random() * CROCKFORD_ALPHABET.length);
    payload += CROCKFORD_ALPHABET[randIdx];
  }
  
  const checkChar = computeChecksum(payload);
  const full12 = payload + checkChar;
  
  // Format as ASID-XXXX-XXXX-XXXX
  return `ASID-${full12.slice(0, 4)}-${full12.slice(4, 8)}-${full12.slice(8, 12)}`;
}

/**
 * Normalizes user input into a clean canonical ASID string if valid, or null.
 * Accepts full URLs (e.g. "https://afrijournal.org/scholar/ASID-..."), raw IDs, or lowercase.
 */
export function normalizeAfriScholarId(input: string | null | undefined): string | null {
  if (!input) return null;
  
  let clean = input.trim();
  // Strip URL prefixes if present
  clean = clean.replace(/^https?:\/\/[^\/]+\/(?:scholar|researcher|id)\/?/i, "");
  // Strip any leading query string param name e.g. "id="
  clean = clean.replace(/^[?&]?id=/i, "");
  // Remove non-alphanumeric except hyphen
  clean = clean.toUpperCase().replace(/[^0-9A-Z-]/g, "");

  // If starts with ASID-, extract parts
  if (clean.startsWith("ASID-")) {
    clean = clean.slice(5);
  } else if (clean.startsWith("ASID")) {
    clean = clean.slice(4);
  }

  // Remove existing hyphens from the 12-char body
  const rawChars = clean.replace(/-/g, "");
  if (rawChars.length !== 12) {
    return null;
  }

  // Map any confused characters
  let normalized12 = "";
  for (let i = 0; i < 12; i++) {
    const ch = rawChars[i];
    const mapped = CONFUSION_MAP[ch] || ch;
    if (CHAR_TO_VAL[mapped] === undefined) {
      return null;
    }
    normalized12 += mapped;
  }

  return `ASID-${normalized12.slice(0, 4)}-${normalized12.slice(4, 8)}-${normalized12.slice(8, 12)}`;
}

/**
 * Validates an AfriScholar ID format and verifies its Modulo-32 checksum.
 */
export function isValidAfriScholarId(input: string | null | undefined): boolean {
  const normalized = normalizeAfriScholarId(input);
  if (!normalized) return false;

  const parts = normalized.slice(5).split("-");
  if (parts.length !== 3 || parts.some(p => p.length !== 4)) {
    return false;
  }

  const payload11 = (parts[0] + parts[1] + parts[2]).slice(0, 11);
  const checkChar = parts[2][3];

  return computeChecksum(payload11) === checkChar;
}

/**
 * Returns canonical public resolver URL for an AfriScholar ID.
 */
export function getAfriScholarUrl(asid: string): string {
  const normalized = normalizeAfriScholarId(asid) || asid;
  return `/scholar/${encodeURIComponent(normalized)}`;
}
