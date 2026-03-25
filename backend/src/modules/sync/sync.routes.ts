import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../common/middleware';
import { pullChanges, pushChanges } from './sync.service';

export async function syncRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/pull', async (request, reply) => {
    const raw = (request.query as { last_pulled_at?: string }).last_pulled_at;
    let lastPulledAt: number | null = null;
    if (raw !== undefined && raw !== '') {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        reply.status(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'last_pulled_at must be a number (ms epoch)' },
        });
        return;
      }
      lastPulledAt = n;
    }

    const result = await pullChanges(request.user!.userId, lastPulledAt);
    reply.send(result);
  });

  app.post('/push', async (request, reply) => {
    const body = request.body as Parameters<typeof pushChanges>[1];
    const result = await pushChanges(request.user!.userId, body);
    reply.send(result);
  });
}
