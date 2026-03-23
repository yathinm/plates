import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../common/middleware';
import { createRoutine, listUserRoutines, getRoutineWithExercises } from './routine.service';

export async function routineRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.post('/', async (request, reply) => {
    const routine = await createRoutine(request.user!.userId, request.body as any);
    reply.status(201).send(routine);
  });

  app.get('/', async (request, reply) => {
    const data = await listUserRoutines(request.user!.userId);
    reply.send({ count: data.length, routines: data });
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const routine = await getRoutineWithExercises(id);
    reply.send(routine);
  });
}
