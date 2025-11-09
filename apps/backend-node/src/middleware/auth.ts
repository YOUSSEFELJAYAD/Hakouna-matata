import { Request, Response, NextFunction } from "express";
import { verifyToken, extractBearerToken } from "../utils/security/jwt";
import { AppError } from "./errorHandler";

/**
 * Authentication Middleware
 * Verifies JWT tokens and adds user to request
 */

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

/**
 * Authenticate requests using JWT
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const decoded = verifyToken(token);

    // Add user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    next(new AppError("Invalid or expired token", 401));
  }
};

/**
 * Require specific role
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Insufficient permissions", 403)
      );
    }

    next();
  };
};

/**
 * Require admin role
 */
export const requireAdmin = requireRole("ADMIN", "SUPERADMIN");

/**
 * Require superadmin role
 */
export const requireSuperAdmin = requireRole("SUPERADMIN");

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
