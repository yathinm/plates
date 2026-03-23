import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  api: {
    port: parseInt(process.env.API_PORT || '3000', 10),
  },

  postgres: {
    host: process.env.POSTGRES_HOST || 'db',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: required('POSTGRES_USER'),
    password: required('POSTGRES_PASSWORD'),
    database: required('POSTGRES_DB'),
  },

  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: required('REDIS_PASSWORD'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: '7d',
  },
} as const;
