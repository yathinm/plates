import { config } from './common/config';
import { prisma, connectRedis } from './database';
import { buildApp } from './app';

async function boot() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma');
  } catch (err: any) {
    console.error('PostgreSQL connect failed:', err.message);
  }

  try {
    await connectRedis();
  } catch (err: any) {
    console.error('Redis connect failed, will retry on demand:', err.message);
  }

  const app = await buildApp();

  await app.listen({ port: config.api.port, host: '0.0.0.0' });
  console.log(`Plates API listening on port ${config.api.port}`);
}

boot();
