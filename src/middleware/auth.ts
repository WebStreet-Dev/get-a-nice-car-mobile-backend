import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types/index.js';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';
import authService from '../services/auth.service.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new UnauthorizedError('No token provided');
      return next(error);
    }

    const token = authHeader.split(' ')[1];
    const payload = authService.verifyAccessToken(token);

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    // Ensure error is passed to error handler, not treated as route not found
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = authService.verifyAccessToken(token);

      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}

/**
 * Admin-only middleware (allows ADMIN and SUPER_ADMIN)
 */
export function adminOnly(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (req.user.role !== Role.ADMIN && req.user.role !== Role.SUPER_ADMIN) {
    throw new ForbiddenError('Admin access required');
  }

  next();
}

/**
 * Super Admin-only middleware
 */
export function superAdminOnly(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (req.user.role !== Role.SUPER_ADMIN) {
    throw new ForbiddenError('Super Admin access required');
  }

  next();
}




