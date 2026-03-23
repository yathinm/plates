import { FastifyInstance } from 'fastify';
import { signup, login } from './auth.service';
import { requireAuth } from '../../common/middleware';

export async function authRoutes(app: FastifyInstance) {
  app.post('/signup', async (request, reply) => {
    const result = await signup(request.body as any);
    reply.status(201).send(result);
  });

  app.post('/login', async (request, reply) => {
    const result = await login(request.body as any);
    reply.send(result);
  });

  app.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    reply.send({ user: request.user });
  });
}
