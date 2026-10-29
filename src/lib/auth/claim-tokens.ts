import crypto from "node:crypto";

/**
 * Token generation result containing the raw token (sent only to student via email)
 * and the cryptographic SHA-256 hash (stored in database).
 */
export interface GeneratedClaimToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Generates a cryptographically secure, unpredictable 32-byte token (256 bits entropy)
 * and its SHA-256 digest for database storage.
 */
export function generateClaimToken(): GeneratedClaimToken {
  // 32 random bytes = 64 hex characters of cryptographic randomness
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashClaimToken(rawToken);

  // Exactly 72 hours from issuance
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
}

/**
 * Computes the SHA-256 hex digest of a raw claim token.
 */
export function hashClaimToken(rawToken: string): string {
  if (!rawToken || typeof rawToken !== "string") {
    throw new Error("Invalid token format for hashing.");
  }
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

/**
 * Formats the public account claim URL for email transmission.
 */
export function buildClaimUrl(rawToken: string, baseUrl?: string): string {
  const origin =
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  const cleanOrigin = origin.replace(/\/+$/, "");
  return `${cleanOrigin}/claim-account?token=${encodeURIComponent(rawToken.trim())}`;
}

/**
 * Inspects whether a given expiration timestamp is in the past.
 */
export function isClaimTokenExpired(expiresAt: string | Date): boolean {
  const expiryTime = new Date(expiresAt).getTime();
  return Date.now() >= expiryTime;
}
