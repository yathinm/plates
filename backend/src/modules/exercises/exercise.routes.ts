import { FastifyInstance } from 'fastify';
import { listExercises } from './exercise.service';

export async function exerciseRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const { muscle, category, search } = request.query as Record<string, string | undefined>;
    const data = await listExercises({ muscle, category, search });
    reply.send({ count: data.length, exercises: data });
  });
}
