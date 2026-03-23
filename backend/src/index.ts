import { config } from './common/config';
import { connectRedis, pool } from './database';
import { app } from './app';

async function boot() {
  try {
    const { rows } = await pool.query('SELECT version()');
    console.log('Connected to PostgreSQL:', rows[0].version);
  } catch (err: any) {
    console.error('PostgreSQL connect failed:', err.message);
  }

  try {
    await connectRedis();
  } catch (err: any) {
    console.error('Redis connect failed, will retry on demand:', err.message);
  }

  app.listen(config.api.port, '0.0.0.0', () => {
    console.log(`Plates API listening on port ${config.api.port}`);
  });
}

boot();
