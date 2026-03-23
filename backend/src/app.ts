import Fastify from 'fastify';
import cors from '@fastify/cors';
import { checkPostgres, checkRedis } from './database';
import { AppError } from './common/errors';
import { authRoutes } from './modules/auth';
import { exerciseRoutes } from './modules/exercises';
import { routineRoutes } from './modules/routines';
import { workoutRoutes } from './modules/workouts';

export async function buildApp() {
  const app = Fastify({ logger: false });

  await app.register(cors);

  // ── Error handler ──────────────────────────────────────────
  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof AppError) {
      reply.status(err.statusCode).send({
        error: { code: err.code, message: err.message },
      });
      return;
    }

    console.error('Unhandled error:', err);
    reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  });

  // ── Routes ─────────────────────────────────────────────────
  app.register(authRoutes, { prefix: '/auth' });
  app.register(exerciseRoutes, { prefix: '/exercises' });
  app.register(routineRoutes, { prefix: '/routines' });
  app.register(workoutRoutes, { prefix: '/workouts' });

  app.get('/health', async (_request, reply) => {
    const [pg, rd] = await Promise.all([checkPostgres(), checkRedis()]);

    const status = {
      api:      'ok' as const,
      postgres: pg ? 'ok' as const : 'down' as const,
      redis:    rd ? 'ok' as const : 'down' as const,
    };

    const allOk = pg && rd;
    reply.status(allOk ? 200 : 503).send(status);
  });

  return app;
}
