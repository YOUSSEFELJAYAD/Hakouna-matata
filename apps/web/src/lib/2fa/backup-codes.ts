/**
 * Backup Codes for Two-Factor Authentication
 * Generate and verify backup codes for account recovery
 */

import { randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/security/password";

/**
 * Generate backup codes for 2FA recovery
 * @param count Number of backup codes to generate (default: 10)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = generateBackupCode();
    codes.push(code);
  }

  return codes;
}

/**
 * Generate a single backup code
 * Format: XXXX-XXXX (8 characters, uppercase alphanumeric)
 */
function generateBackupCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars (I, O, 0, 1)
  const bytes = randomBytes(8);

  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters[bytes[i] % characters.length];
  }

  // Format as XXXX-XXXX
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Hash backup codes for database storage
 */
export async function hashBackupCodes(
  codes: string[]
): Promise<{ code: string; hash: string }[]> {
  const hashedCodes = await Promise.all(
    codes.map(async (code) => ({
      code,
      hash: await hashPassword(code),
    }))
  );

  return hashedCodes;
}

/**
 * Verify a backup code against its hash
 */
export async function verifyBackupCode(
  code: string,
  hash: string
): Promise<boolean> {
  try {
    return await verifyPassword(code, hash);
  } catch (error) {
    console.error("Backup code verification error:", error);
    return false;
  }
}

/**
 * Normalize backup code (remove spaces, dashes, lowercase)
 */
export function normalizeBackupCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

/**
 * Validate backup code format
 */
export function isValidBackupCodeFormat(code: string): boolean {
  const normalized = normalizeBackupCode(code);
  return /^[A-Z2-9]{8}$/.test(normalized);
}

/**
 * Format backup code for display (XXXX-XXXX)
 */
export function formatBackupCode(code: string): string {
  const normalized = normalizeBackupCode(code);
  if (normalized.length !== 8) {
    return code;
  }
  return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
}
