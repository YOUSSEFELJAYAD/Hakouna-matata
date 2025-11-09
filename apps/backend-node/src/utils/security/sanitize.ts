/**
 * Input Sanitization Utilities for Node.js Backend
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
 * Validate and sanitize email
 * @param email - Email address
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const sanitized = email.toLowerCase().trim();

  if (!emailRegex.test(sanitized) || sanitized.length > 255) {
    return null;
  }

  return sanitized;
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
    const parts = sanitized.split(".");
    const ext = parts.length > 1 ? parts.pop() : "";
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
  let cleaned = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

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
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Strip all HTML tags
 * @param input - HTML string
 * @returns Plain text
 */
export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Truncate string safely
 * @param input - Input string
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateString(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }
  return input.substring(0, maxLength);
}
