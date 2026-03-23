import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../common/middleware';
import { startWorkout, logSet, finishWorkout } from './workout.service';

export async function workoutRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.post('/start', async (request, reply) => {
    const workout = await startWorkout(request.user!.userId, request.user!.username, request.body as any);
    reply.status(201).send(workout);
  });

  app.post('/:id/sets', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await logSet(request.user!.userId, id, request.body as any);
    reply.status(201).send(result);
  });

  app.patch('/:id/finish', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { notes } = (request.body || {}) as { notes?: string };
    const result = await finishWorkout(request.user!.userId, request.user!.username, id, notes);
    reply.send(result);
  });
}
