import { z } from "zod";

/**
 * Input Sanitization and Validation Utilities
 * Prevents XSS, SQL injection, and other injection attacks
 */

/**
 * Sanitize HTML string to prevent XSS
 * @param input - Raw HTML input
 * @returns Sanitized string
 */
export function sanitizeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize SQL input (use with caution - prefer parameterized queries)
 * @param input - Raw SQL input
 * @returns Sanitized string
 */
export function sanitizeSql(input: string): string {
  // Remove SQL comment indicators
  let sanitized = input.replace(/--/g, "");
  sanitized = sanitized.replace(/\/\*/g, "");
  sanitized = sanitized.replace(/\*\//g, "");

  // Escape dangerous characters
  sanitized = sanitized.replace(/'/g, "''");
  sanitized = sanitized.replace(/;/g, "");

  return sanitized;
}

/**
 * Validate and sanitize email
 * @param email - Email address
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  const emailSchema = z.string().email().max(255);

  try {
    const validated = emailSchema.parse(email.toLowerCase().trim());
    return validated;
  } catch {
    return null;
  }
}

/**
 * Sanitize filename to prevent path traversal
 * @param filename - Original filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  let sanitized = filename.replace(/[\/\\]/g, "");
  sanitized = sanitized.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop() || "";
    sanitized = sanitized.substring(0, 250 - ext.length) + "." + ext;
  }

  return sanitized || "file";
}

/**
 * Sanitize URL to prevent open redirect
 * @param url - URL to validate
 * @param allowedDomains - List of allowed domains
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(
  url: string,
  allowedDomains: string[] = []
): string | null {
  try {
    const parsedUrl = new URL(url);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    // Check allowed domains if specified
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some((domain) =>
        parsedUrl.hostname.endsWith(domain)
      );
      if (!isAllowed) return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize phone number
 * @param phone - Phone number
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Validate and sanitize alphanumeric input
 * @param input - Input string
 * @param maxLength - Maximum length
 * @returns Sanitized string
 */
export function sanitizeAlphanumeric(
  input: string,
  maxLength: number = 255
): string {
  const sanitized = input.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.substring(0, maxLength);
}

/**
 * Remove all script tags and event handlers
 * @param input - HTML string
 * @returns Cleaned HTML
 */
export function removeScripts(input: string): string {
  // Remove script tags
  let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  cleaned = cleaned.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  cleaned = cleaned.replace(/javascript:/gi, "");

  return cleaned;
}

/**
 * Validate IP address (IPv4 or IPv6)
 * @param ip - IP address
 * @returns True if valid IP
 */
export function isValidIp(ip: string): boolean {
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Sanitize object by removing null/undefined values
 * @param obj - Object to sanitize
 * @returns Cleaned object
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const cleaned: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  }

  return cleaned;
}

/**
 * Deep sanitize nested object
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function deepSanitize(obj: unknown): unknown {
  if (typeof obj === "string") {
    return sanitizeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }

  if (obj && typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value);
    }
    return sanitized;
  }

  return obj;
}
