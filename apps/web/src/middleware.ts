import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyRateLimit, RateLimitConfigs } from "@/lib/security/rate-limit";
import { verifyCsrfToken, initializeCsrf } from "@/lib/security/csrf";

/**
 * Next.js Middleware for Security
 * Applies security measures to all requests
 */

// Define protected routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/admin", "/profile"];

// Define auth routes
const AUTH_ROUTES = ["/login", "/register"];

// Define routes that require CSRF protection
const CSRF_PROTECTED_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // 1. Security Headers
  addSecurityHeaders(response);

  // 2. Rate Limiting
  const rateLimitResult = await applyRateLimiting(request, pathname);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // 3. CSRF Protection for state-changing operations
  if (CSRF_PROTECTED_METHODS.includes(request.method)) {
    const csrfResult = await applyCsrfProtection(request);
    if (csrfResult) {
      return csrfResult;
    }
  }

  // 4. Authentication Check for Protected Routes
  const authResult = await checkAuthentication(request, pathname);
  if (authResult) {
    return authResult;
  }

  // 5. Initialize CSRF token for new sessions
  if (request.method === "GET") {
    await initializeCsrf();
  }

  return response;
}

/**
 * Add comprehensive security headers
 */
function addSecurityHeaders(response: NextResponse): void {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // DNS Prefetch Control
  response.headers.set("X-DNS-Prefetch-Control", "on");

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // HSTS (HTTP Strict Transport Security)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content Security Policy (CSP)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://firebaseinstallations.googleapis.com https://*.google-analytics.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);
}

/**
 * Apply rate limiting based on route
 */
async function applyRateLimiting(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  let config = RateLimitConfigs.api;

  // Select appropriate rate limit config
  if (pathname.startsWith("/api/auth")) {
    config = RateLimitConfigs.auth;
  } else if (pathname.startsWith("/api/admin")) {
    config = RateLimitConfigs.admin;
  } else if (pathname.startsWith("/api/upload")) {
    config = RateLimitConfigs.upload;
  }

  const result = applyRateLimit(request, config);

  if (result.limited) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": result.retryAfter?.toString() || "60",
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetTime.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Apply CSRF protection
 */
async function applyCsrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF for certain API routes if needed
  const skipCsrf = request.nextUrl.pathname.startsWith("/api/auth/callback");
  if (skipCsrf) {
    return null;
  }

  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken) {
    return new NextResponse(
      JSON.stringify({
        error: "CSRF token missing",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const isValid = await verifyCsrfToken(csrfToken);
  if (!isValid) {
    return new NextResponse(
      JSON.stringify({
        error: "Invalid CSRF token",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return null;
}

/**
 * Check authentication for protected routes
 */
async function checkAuthentication(
  request: NextRequest,
  pathname: string
): Promise<NextResponse | null> {
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return null;
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("hakouna-session");

  if (!sessionCookie) {
    // Redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // TODO: Validate session token here
  // For now, just check if cookie exists

  return null;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
