/**
 * Rate Limiting Utilities
 * Implements token bucket algorithm for rate limiting
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime && (!record.blocked || (record.blockUntil && now > record.blockUntil))) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Object with limited status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  limited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Initialize or reset if window expired
  if (!record || now > record.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime,
      blocked: false,
    });

    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Check if currently blocked
  if (record.blocked && record.blockUntil && now < record.blockUntil) {
    return {
      limited: true,
      remaining: 0,
      resetTime: record.blockUntil,
      retryAfter: Math.ceil((record.blockUntil - now) / 1000),
    };
  }

  // Increment request count
  record.count++;

  // Check if limit exceeded
  if (record.count > config.maxRequests) {
    // Block for increasingly longer periods based on violations
    const blockDuration = Math.min(
      60000 * Math.pow(2, Math.floor(record.count / config.maxRequests) - 1),
      3600000 // Max 1 hour
    );

    record.blocked = true;
    record.blockUntil = now + blockDuration;

    return {
      limited: true,
      remaining: 0,
      resetTime: record.blockUntil,
      retryAfter: Math.ceil(blockDuration / 1000),
    };
  }

  return {
    limited: false,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitConfigs = {
  // Authentication endpoints (stricter)
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Public API endpoints
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Admin endpoints
  admin: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // File uploads
  upload: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Email sending
  email: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Password reset
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Get client identifier from request
 * @param req - Request object
 * @returns Client identifier (IP address or user ID)
 */
export function getClientIdentifier(req: Request): string {
  // Try to get real IP behind proxies
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier
  return "unknown";
}

/**
 * Apply rate limit to a request
 * @param req - Request object
 * @param config - Rate limit configuration
 * @param customIdentifier - Optional custom identifier
 * @returns Rate limit check result
 */
export function applyRateLimit(
  req: Request,
  config: RateLimitConfig,
  customIdentifier?: string
) {
  const identifier = customIdentifier || getClientIdentifier(req);
  return checkRateLimit(identifier, config);
}

/**
 * Reset rate limit for an identifier
 * @param identifier - Identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status
 * @param identifier - Identifier to check
 * @returns Current rate limit record or null
 */
export function getRateLimitStatus(
  identifier: string
): RateLimitRecord | null {
  return rateLimitStore.get(identifier) || null;
}

/**
 * Clear all rate limits (use cautiously)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
