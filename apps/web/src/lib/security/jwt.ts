import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { nanoid } from "nanoid";

/**
 * JWT Security Utilities
 * Provides secure JWT token generation and verification
 */

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-min-32-chars-long"
);

const JWT_ISSUER = "hakouna-matata";
const JWT_AUDIENCE = "hakouna-matata-users";

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

/**
 * Generate an access token
 * @param payload - Token payload
 * @param expiresIn - Token expiration (default: 15 minutes)
 * @returns JWT token
 */
export async function generateAccessToken(
  payload: Omit<TokenPayload, "iat" | "exp" | "jti" | "iss" | "aud">,
  expiresIn: string = "15m"
): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .setJti(nanoid()) // Unique token ID for revocation
    .sign(JWT_SECRET);

  return token;
}

/**
 * Generate a refresh token
 * @param payload - Token payload
 * @returns JWT refresh token (30 days expiration)
 */
export async function generateRefreshToken(
  payload: Omit<TokenPayload, "iat" | "exp" | "jti" | "iss" | "aud">
): Promise<string> {
  const token = await new SignJWT({ ...payload, type: "refresh" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime("30d")
    .setJti(nanoid())
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return payload as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export function extractBearerToken(authHeader: string | null): string | null {
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
export async function generateTokenPair(
  payload: Omit<TokenPayload, "iat" | "exp" | "jti" | "iss" | "aud">
): Promise<{ accessToken: string; refreshToken: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Decode token without verification (use cautiously)
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export function decodeTokenUnsafe(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    return payload as TokenPayload;
  } catch {
    return null;
  }
}
