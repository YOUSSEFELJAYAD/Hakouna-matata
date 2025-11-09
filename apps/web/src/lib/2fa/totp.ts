/**
 * TOTP (Time-based One-Time Password) Utilities
 * For authenticator apps like Google Authenticator, Authy, etc.
 */

import * as OTPAuth from "otpauth";
import { nanoid } from "nanoid";
import { hashPassword, verifyPassword } from "@/lib/security/password";

/**
 * Generate a new TOTP secret for a user
 */
export function generateTOTPSecret(params: {
  userEmail: string;
  issuer?: string;
}): {
  secret: string;
  uri: string;
} {
  const { userEmail, issuer = "Hakouna Matata" } = params;

  // Generate a random secret (base32 encoded, 20 bytes = 160 bits)
  const secret = new OTPAuth.Secret({ size: 20 });

  // Create TOTP instance
  const totp = new OTPAuth.TOTP({
    issuer,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Verify a TOTP code against a secret
 * @param token The 6-digit code from authenticator app
 * @param secret The user's TOTP secret (base32 encoded)
 * @param window Number of time windows to check (default 1 = ±30 seconds)
 */
export function verifyTOTPToken(
  token: string,
  secret: string,
  window: number = 1
): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    // Validate the token within the time window
    const delta = totp.validate({
      token,
      window,
    });

    // delta is null if invalid, or a number indicating time window offset
    return delta !== null;
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
}

/**
 * Generate current TOTP token for testing/display
 */
export function generateCurrentTOTPToken(secret: string): string {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  return totp.generate();
}

/**
 * Get time remaining until current token expires (in seconds)
 */
export function getTOTPTimeRemaining(): number {
  const period = 30;
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

/**
 * Validate TOTP token format
 */
export function isValidTOTPToken(token: string): boolean {
  return /^\d{6}$/.test(token);
}

/**
 * Encrypt TOTP secret for database storage
 * In production, use a proper encryption key from environment
 */
export async function encryptTOTPSecret(secret: string): Promise<string> {
  // For demonstration, we use bcrypt hashing
  // In production, use symmetric encryption (AES-256-GCM)
  // This should NOT use bcrypt - using it here for simplicity
  // TODO: Replace with proper encryption
  return secret; // Store as-is for now, should be encrypted
}

/**
 * Decrypt TOTP secret from database
 */
export async function decryptTOTPSecret(
  encryptedSecret: string
): Promise<string> {
  // TODO: Implement proper decryption
  return encryptedSecret;
}
