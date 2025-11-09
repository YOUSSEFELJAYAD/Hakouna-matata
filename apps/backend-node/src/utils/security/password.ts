import bcrypt from "bcryptjs";

/**
 * Password Security Utilities for Node.js Backend
 * Provides secure password hashing, validation, and strength checking
 */

const BCRYPT_ROUNDS = 12; // OWASP recommended

export interface PasswordStrength {
  score: number;
  feedback: string[];
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password first
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(validation.errors.join(", "));
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    return false;
  }
}

/**
 * Validate password requirements
 * @param password - Password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength
 * @param password - Password to check
 * @returns Strength score and feedback
 */
export function calculatePasswordStrength(
  password: string
): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  // Length checks
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character diversity
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add lowercase letters");
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add uppercase letters");
  }

  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add numbers");
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 15;
  } else {
    feedback.push("Add special characters");
  }

  // Common password check
  const commonPasswords = ["password", "12345678", "qwerty", "admin"];
  if (commonPasswords.some((p) => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 30);
    feedback.push("Avoid common passwords");
  }

  return {
    score: Math.min(100, score),
    feedback,
  };
}
