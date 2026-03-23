import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { verifyToken, JwtPayload } from '../../common/jwt';
import { getSubscriber } from '../../database';
import { CHANNELS, SocialEvent } from './social.service';

// userId → Set of connected WebSocket clients
const connections = new Map<string, Set<WebSocket>>();

function addConnection(userId: string, socket: WebSocket) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(socket);
}

function removeConnection(userId: string, socket: WebSocket) {
  const sockets = connections.get(userId);
  if (sockets) {
    sockets.delete(socket);
    if (sockets.size === 0) connections.delete(userId);
  }
}

function sendToUser(userId: string, data: any) {
  const sockets = connections.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify(data);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

/**
 * Register the /ws WebSocket endpoint and the Redis Pub/Sub listener.
 * Clients connect with: ws://host:port/ws?token=<JWT>
 */
export async function registerWebSocket(app: FastifyInstance) {
  // Subscribe to all social channels and fan out to connected clients
  const sub = getSubscriber();

  await sub.subscribe(CHANNELS.HYPE, (message) => {
    try {
      const event: SocialEvent = JSON.parse(message);
      if (event.targetUserId) {
        sendToUser(event.targetUserId, event);
      }
    } catch { /* malformed message */ }
  });

  await sub.subscribe(CHANNELS.WORKOUT_START, (message) => {
    try {
      const event: SocialEvent = JSON.parse(message);
      // Fan out to all connected users (friends filter happens client-side
      // or we could iterate friend lists here for efficiency at scale)
      for (const [userId] of connections) {
        if (userId !== event.fromUserId) {
          sendToUser(userId, event);
        }
      }
    } catch { /* malformed message */ }
  });

  await sub.subscribe(CHANNELS.WORKOUT_FINISH, (message) => {
    try {
      const event: SocialEvent = JSON.parse(message);
      for (const [userId] of connections) {
        if (userId !== event.fromUserId) {
          sendToUser(userId, event);
        }
      }
    } catch { /* malformed message */ }
  });

  console.log('Subscribed to social Pub/Sub channels');

  // WebSocket upgrade endpoint
  app.get('/ws', { websocket: true }, (socket, request) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    let user: JwtPayload;
    try {
      if (!token) throw new Error('No token');
      user = verifyToken(token);
    } catch {
      socket.close(4001, 'Unauthorized');
      return;
    }

    addConnection(user.userId, socket);
    socket.send(JSON.stringify({ type: 'connected', userId: user.userId }));

    socket.on('close', () => {
      removeConnection(user.userId, socket);
    });

    // Keep-alive pong (clients should send pings)
    socket.on('ping', () => socket.pong());
  });
}
