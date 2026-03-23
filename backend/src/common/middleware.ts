import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from './jwt';
import { UnauthorizedError, ForbiddenError } from './errors';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Requires a valid Bearer token. Attaches req.user with { userId, username }.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/**
 * Ensures the authenticated user matches the :userId route param.
 * Must be used after requireAuth.
 */
export function requireOwner(req: Request, _res: Response, next: NextFunction) {
  const paramId = req.params.userId;
  if (paramId && req.user?.userId !== paramId) {
    return next(new ForbiddenError('You can only access your own resources'));
  }
  next();
}
