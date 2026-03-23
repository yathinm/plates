import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../common/middleware';
import { getActiveFriends, sendHype } from './social.service';

export async function socialRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/active', async (request, reply) => {
    const friends = await getActiveFriends(request.user!.userId);
    reply.send({ count: friends.length, active: friends });
  });

  app.post('/hype/:friendId', async (request, reply) => {
    const { friendId } = request.params as { friendId: string };
    const result = await sendHype(
      request.user!.userId,
      request.user!.username,
      friendId,
    );
    reply.send(result);
  });
}
