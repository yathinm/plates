import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { config } from '../common/config';
import * as schema from './schema';

const pool = new Pool({
  host:     config.postgres.host,
  port:     config.postgres.port,
  user:     config.postgres.user,
  password: config.postgres.password,
  database: config.postgres.database,
  max:      20,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export { pool };

export async function checkPostgres(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
