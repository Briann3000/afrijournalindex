/**
 * AfriScholar ID (ASID) - Pan-African Scholar Persistent Digital Identifier
 * 
 * Standard Format: ASID-XXXX-XXXX-XXXX
 * - 12 numeric digits in 3 groups of 4 separated by hyphens (e.g. ASID-4821-9504-2946).
 * - Position 1 to 11: 11 digits (0-9).
 * - Position 12: Modulo-10 (Luhn-style weighted) checksum digit to ensure integrity.
 */

/**
 * Computes a weighted Modulo-10 checksum digit for an 11-digit numeric string.
 * Uses alternate weights 3 and 1 (standard ISBN-13 / EAN check digit algorithm adapted for 11 digits).
 */
export function computeChecksum(payload11: string): string {
  let sum = 0;
  for (let i = 0; i < payload11.length; i++) {
    const digit = parseInt(payload11[i], 10) || 0;
    // Alternate weight: odd positions 1, even positions 3
    const weight = (i % 2 === 0) ? 1 : 3;
    sum += digit * weight;
  }
  const remainder = sum % 10;
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;
  return checkDigit.toString();
}

/**
 * Generates a new formatted AfriScholar ID with 12 numbers only and a valid checksum.
 * Example output: "ASID-4821-9504-2946"
 */
export function generateAfriScholarId(): string {
  let payload = "";
  // Ensure the leading digit is non-zero (1-9) so it displays cleanly without leading zero confusion
  payload += Math.floor(Math.random() * 9 + 1).toString();
  
  // Next 10 random digits (0-9)
  for (let i = 1; i < 11; i++) {
    payload += Math.floor(Math.random() * 10).toString();
  }
  
  const checkDigit = computeChecksum(payload);
  const full12 = payload + checkDigit;
  
  // Format as ASID-XXXX-XXXX-XXXX
  return `ASID-${full12.slice(0, 4)}-${full12.slice(4, 8)}-${full12.slice(8, 12)}`;
}

/**
 * Normalizes user input into a clean canonical ASID string if valid, or null.
 * Accepts full URLs (e.g. "https://afrijournal.org/scholar/ASID-..."), raw IDs, or numbers.
 */
export function normalizeAfriScholarId(input: string | null | undefined): string | null {
  if (!input) return null;
  
  let clean = input.trim();
  // Strip URL prefixes if present
  clean = clean.replace(/^https?:\/\/[^\/]+\/(?:scholar|researcher|id)\/?/i, "");
  // Strip any leading query string param name e.g. "id="
  clean = clean.replace(/^[?&]?id=/i, "");

  // If starts with ASID-, extract parts
  if (clean.toUpperCase().startsWith("ASID-")) {
    clean = clean.slice(5);
  } else if (clean.toUpperCase().startsWith("ASID")) {
    clean = clean.slice(4);
  }

  // Remove existing hyphens
  const rawChars = clean.replace(/-/g, "").trim();

  // Pure 12-digit numeric match
  if (/^\d{12}$/.test(rawChars)) {
    return `ASID-${rawChars.slice(0, 4)}-${rawChars.slice(4, 8)}-${rawChars.slice(8, 12)}`;
  }

  // Legacy fallback: if old alphanumeric 12-char ID is passed during transition, format it consistently
  if (/^[0-9A-Za-z]{12}$/.test(rawChars)) {
    const upper = rawChars.toUpperCase();
    return `ASID-${upper.slice(0, 4)}-${upper.slice(4, 8)}-${upper.slice(8, 12)}`;
  }

  return null;
}

/**
 * Validates an AfriScholar ID format and verifies its Modulo-10 checksum.
 * Supports legacy alphanumeric validation during migration window.
 */
export function isValidAfriScholarId(input: string | null | undefined): boolean {
  const normalized = normalizeAfriScholarId(input);
  if (!normalized) return false;

  const parts = normalized.slice(5).split("-");
  if (parts.length !== 3 || parts.some(p => p.length !== 4)) {
    return false;
  }

  const digitsOnly = parts.join("");
  // If pure numbers, verify Modulo-10 checksum
  if (/^\d{12}$/.test(digitsOnly)) {
    const payload11 = digitsOnly.slice(0, 11);
    const checkDigit = digitsOnly[11];
    return computeChecksum(payload11) === checkDigit;
  }

  // Allow legacy 12-char alphanumeric during transition
  return /^[0-9A-Z]{12}$/.test(digitsOnly);
}

/**
 * Returns canonical public resolver URL for an AfriScholar ID.
 */
export function getAfriScholarUrl(asid: string): string {
  const normalized = normalizeAfriScholarId(asid) || asid;
  return `/scholar/${encodeURIComponent(normalized)}`;
}
