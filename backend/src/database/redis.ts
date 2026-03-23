import { createClient, RedisClientType } from 'redis';
import { config } from '../common/config';

let client: RedisClientType;

function getRedisUrl(): string {
  return `redis://:${config.redis.password}@${config.redis.host}:${config.redis.port}`;
}

export async function connectRedis(): Promise<RedisClientType> {
  if (client?.isOpen) return client;

  client = createClient({ url: getRedisUrl() }) as RedisClientType;

  client.on('error', (err) => console.error('Redis error:', err));
  client.on('reconnecting', () => console.log('Redis reconnecting...'));

  await client.connect();
  console.log('Connected to Redis');
  return client;
}

export function getRedis(): RedisClientType {
  if (!client?.isOpen) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return client;
}

export async function checkRedis(): Promise<boolean> {
  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client?.isOpen) {
    await client.quit();
  }
}
