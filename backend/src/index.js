const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

const redis = createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
});

redis.on('error', (err) => console.error('Redis connection error:', err));

async function boot() {
  try {
    await redis.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Redis connect failed, retrying in 3s...', err.message);
    setTimeout(() => redis.connect(), 3000);
  }

  try {
    const { rows } = await pool.query('SELECT version()');
    console.log('Connected to PostgreSQL:', rows[0].version);
  } catch (err) {
    console.error('PostgreSQL connect failed:', err.message);
  }

  const port = process.env.API_PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Plates API listening on port ${port}`);
  });
}

app.get('/health', async (_req, res) => {
  const status = { api: 'ok', postgres: 'down', redis: 'down' };

  try {
    await pool.query('SELECT 1');
    status.postgres = 'ok';
  } catch { /* leave as down */ }

  try {
    await redis.ping();
    status.redis = 'ok';
  } catch { /* leave as down */ }

  const allOk = Object.values(status).every((v) => v === 'ok');
  res.status(allOk ? 200 : 503).json(status);
});

boot();
