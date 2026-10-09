import crypto from "crypto";

const SECRET_KEY = process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || "afrijournalindex-production-secret-key-2026-kenpro";

/**
 * Hashes a plain-text password using native Node.js crypto scrypt.
 * Format: scrypt$salt$derivedKey
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifies a plain-text password against a stored password hash.
 * Supports modern scrypt hashes and legacy simulated hashes for seamless backward-compatibility.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  // Modern scrypt format
  if (storedHash.startsWith("scrypt$")) {
    const [, salt, originalKey] = storedHash.split("$");
    if (!salt || !originalKey) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derivedKey, "hex"), Buffer.from(originalKey, "hex"));
  }

  // Legacy simulated format fallback (for existing test accounts)
  if (storedHash.startsWith("sim_hash_")) {
    return storedHash === `sim_hash_${password}`;
  }

  return false;
}

/**
 * Generates an HMAC-SHA256 signed session token for a given user ID.
 * Format: userId.timestamp.signature
 */
export function createSessionToken(userId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${userId}.${timestamp}`;
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Validates a signed session token and returns the userId if valid and not expired (default: 30 days).
 */
export function verifySessionToken(token: string, maxAgeMs = 30 * 24 * 60 * 60 * 1000): string | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  // Backward compatibility for raw UUIDs during migration transition
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (parts.length === 1 && UUID_REGEX.test(parts[0])) {
    return parts[0];
  }

  if (parts.length !== 3) return null;

  const [userId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) return null;

  // Check expiration
  if (Date.now() - timestamp > maxAgeMs) {
    return null;
  }

  // Verify HMAC signature
  const expectedPayload = `${userId}.${timestampStr}`;
  const expectedSignature = crypto.createHmac("sha256", SECRET_KEY).update(expectedPayload).digest("hex");

  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return userId;
    }
  } catch {
    return null;
  }

  return null;
}
