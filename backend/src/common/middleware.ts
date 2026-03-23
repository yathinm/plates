import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JwtPayload } from './jwt';
import { UnauthorizedError, ForbiddenError } from './errors';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

/**
 * Fastify preHandler hook: requires a valid Bearer token.
 * Attaches request.user with { userId, username }.
 */
export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  try {
    request.user = verifyToken(header.slice(7));
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Fastify preHandler hook: ensures the authenticated user matches :userId param.
 * Must be used after requireAuth.
 */
export async function requireOwner(request: FastifyRequest, _reply: FastifyReply) {
  const { userId } = request.params as { userId?: string };
  if (userId && request.user?.userId !== userId) {
    throw new ForbiddenError('You can only access your own resources');
  }
}
