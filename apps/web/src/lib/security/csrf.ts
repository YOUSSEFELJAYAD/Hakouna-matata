import { nanoid } from "nanoid";
import { cookies } from "next/headers";

/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Implements double-submit cookie pattern for CSRF protection
 */

const CSRF_TOKEN_COOKIE = "hakouna-csrf-token";
const CSRF_TOKEN_HEADER = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token
 * @returns CSRF token
 */
export function generateCsrfToken(): string {
  return nanoid(CSRF_TOKEN_LENGTH);
}

/**
 * Set CSRF token in cookie
 * @param token - CSRF token
 */
export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

/**
 * Get CSRF token from cookie
 * @returns CSRF token or null
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_TOKEN_COOKIE);
  return token?.value || null;
}

/**
 * Verify CSRF token from request
 * @param headerToken - Token from request header
 * @returns True if valid
 */
export async function verifyCsrfToken(headerToken: string): Promise<boolean> {
  const cookieToken = await getCsrfToken();

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Timing-safe string comparison
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Initialize CSRF protection for a session
 * @returns CSRF token
 */
export async function initializeCsrf(): Promise<string> {
  let token = await getCsrfToken();

  if (!token) {
    token = generateCsrfToken();
    await setCsrfCookie(token);
  }

  return token;
}

/**
 * Clear CSRF token
 */
export async function clearCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_COOKIE);
}

/**
 * CSRF token header name
 */
export const CSRF_HEADER_NAME = CSRF_TOKEN_HEADER;
