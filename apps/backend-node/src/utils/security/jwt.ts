import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

/**
 * JWT Security Utilities for Node.js Backend
 * Provides secure JWT token generation and verification
 */

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-min-32-chars";
const JWT_ISSUER = "hakouna-matata-api";
const JWT_AUDIENCE = "hakouna-matata-users";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
  jti: string;
  iss: string;
  aud: string;
}

/**
 * Generate an access token
 * @param payload - Token payload
 * @param expiresIn - Token expiration (default: 15 minutes)
 * @returns JWT token
 */
export function generateAccessToken(
  payload: TokenPayload,
  expiresIn: string = "15m"
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    jwtid: nanoid(),
  });
}

/**
 * Generate a refresh token
 * @param payload - Token payload
 * @returns JWT refresh token (30 days)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: "refresh" }, JWT_SECRET, {
    expiresIn: "30d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    jwtid: nanoid(),
  });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 */
export function verifyToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
}

/**
 * Extract bearer token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

/**
 * Generate token pair (access + refresh)
 * @param payload - Token payload
 * @returns Object with access and refresh tokens
 */
export function generateTokenPair(payload: TokenPayload): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Decode token without verification (use cautiously)
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export function decodeTokenUnsafe(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}
