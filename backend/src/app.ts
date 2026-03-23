import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { checkPostgres, checkRedis } from './database';
import { AppError } from './common/errors';
import { authRouter } from './modules/auth';
import { exerciseRouter } from './modules/exercises';
import { routineRouter } from './modules/routines';
import { workoutRouter } from './modules/workouts';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/exercises', exerciseRouter);
app.use('/routines', routineRouter);
app.use('/workouts', workoutRouter);

app.get('/health', async (_req: Request, res: Response) => {
  const [pg, rd] = await Promise.all([checkPostgres(), checkRedis()]);

  const status = {
    api:      'ok' as const,
    postgres: pg ? 'ok' as const : 'down' as const,
    redis:    rd ? 'ok' as const : 'down' as const,
  };

  const allOk = pg && rd;
  res.status(allOk ? 200 : 503).json(status);
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
});
