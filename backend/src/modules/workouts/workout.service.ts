import { Prisma } from '@prisma/client';
import { prisma, getRedis } from '../../database';
import { ValidationError, NotFoundError, AppError } from '../../common/errors';
import { publishEvent, CHANNELS, SocialEvent } from '../social';

const LIVE_KEY = 'live:lifting';
const LIVE_TTL = 7200;

interface StartWorkoutInput {
  routineId?: string;
  name?: string;
  notes?: string;
}

interface LogSetInput {
  exerciseId: string;
  setNumber: number;
  weightKg?: number;
  reps?: number;
  rpe?: number;
  rir?: number;
  durationSec?: number;
  restSec?: number;
}

export async function startWorkout(userId: string, username: string, input: StartWorkoutInput) {
  const now = new Date();

  const workout = await prisma.workout.create({
    data: {
      userId,
      routineId: input.routineId || null,
      name: input.name || 'Workout',
      startedAt: now,
      notes: input.notes || null,
    },
  });

  try {
    const redis = getRedis();
    await redis.hSet(LIVE_KEY, userId, JSON.stringify({
      workoutId: workout.id,
      name: workout.name,
      startedAt: now.toISOString(),
      currentExercise: null,
    }));
    await redis.expire(LIVE_KEY, LIVE_TTL);
  } catch { /* non-fatal */ }

  // Broadcast to social feed via Pub/Sub
  await publishEvent(CHANNELS.WORKOUT_START, {
    type: 'workout_start',
    fromUserId: userId,
    fromUsername: username,
    payload: { workoutId: workout.id, name: workout.name },
    timestamp: now.toISOString(),
  });

  return workout;
}

export async function logSet(userId: string, workoutId: string, input: LogSetInput) {
  if (!input.exerciseId) throw new ValidationError('exerciseId is required');
  if (!input.setNumber || input.setNumber < 1) throw new ValidationError('setNumber must be >= 1');

  // Raw query needed: workouts has composite PK, findFirst by just id
  const rows = await prisma.$queryRaw<Array<{ id: string; user_id: string; finished_at: Date | null }>>`
    SELECT id, user_id, finished_at FROM workouts WHERE id = ${workoutId}::uuid LIMIT 1
  `;

  if (rows.length === 0) throw new NotFoundError('Workout', workoutId);
  if (rows[0].user_id !== userId) throw new AppError(403, 'Not your workout', 'FORBIDDEN');
  if (rows[0].finished_at) throw new ValidationError('Workout already finished');

  const now = new Date();

  const inserted = await prisma.workoutSet.create({
    data: {
      workoutId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      weightKg: input.weightKg ?? null,
      reps: input.reps ?? null,
      rpe: input.rpe ?? null,
      rir: input.rir ?? null,
      durationSec: input.durationSec ?? null,
      restSec: input.restSec ?? null,
      performedAt: now,
    },
  });

  const setVolume = (input.weightKg ?? 0) * (input.reps ?? 0);

  try {
    const redis = getRedis();
    const existing = await redis.hGet(LIVE_KEY, userId);
    if (existing) {
      const exercise = await prisma.exercise.findUnique({
        where: { id: input.exerciseId },
        select: { name: true },
      });
      const data = JSON.parse(existing);
      data.currentExercise = exercise?.name || null;
      data.lastSetAt = now.toISOString();
      await redis.hSet(LIVE_KEY, userId, JSON.stringify(data));
    }
  } catch { /* non-fatal */ }

  return { ...inserted, volume: setVolume };
}

export async function finishWorkout(userId: string, username: string, workoutId: string, notes?: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string; user_id: string; finished_at: Date | null; started_at: Date }>>`
    SELECT id, user_id, finished_at, started_at FROM workouts WHERE id = ${workoutId}::uuid LIMIT 1
  `;

  if (rows.length === 0) throw new NotFoundError('Workout', workoutId);
  if (rows[0].user_id !== userId) throw new AppError(403, 'Not your workout', 'FORBIDDEN');
  if (rows[0].finished_at) throw new ValidationError('Workout already finished');

  const now = new Date();
  const startedAt = new Date(rows[0].started_at);

  await prisma.$executeRaw`
    UPDATE workouts SET finished_at = ${now}, notes = COALESCE(${notes || null}, notes)
    WHERE id = ${workoutId}::uuid
  `;

  const [totals] = await prisma.$queryRaw<Array<{
    total_sets: number;
    total_volume: number;
    exercises_performed: number;
  }>>`
    SELECT
      COUNT(*)::int                                      AS total_sets,
      COALESCE(SUM(weight_kg * reps), 0)::numeric(10,2) AS total_volume,
      COUNT(DISTINCT exercise_id)::int                   AS exercises_performed
    FROM workout_sets
    WHERE workout_id = ${workoutId}::uuid
  `;

  const breakdown = await prisma.$queryRaw<Array<{
    exercise: string;
    sets: number;
    top_weight: string;
    volume: string;
  }>>`
    SELECT
      e.name                                             AS exercise,
      COUNT(*)::int                                      AS sets,
      MAX(ws.weight_kg)::numeric(6,2)                    AS top_weight,
      SUM(ws.weight_kg * ws.reps)::numeric(10,2)         AS volume
    FROM workout_sets ws
    JOIN exercises e ON e.id = ws.exercise_id
    WHERE ws.workout_id = ${workoutId}::uuid
    GROUP BY e.name
    ORDER BY volume DESC
  `;

  const durationMin = Math.round((now.getTime() - startedAt.getTime()) / 60000);

  try {
    const redis = getRedis();
    await redis.hDel(LIVE_KEY, userId);
  } catch { /* non-fatal */ }

  // Broadcast workout completion via Pub/Sub
  await publishEvent(CHANNELS.WORKOUT_FINISH, {
    type: 'workout_finish',
    fromUserId: userId,
    fromUsername: username,
    payload: {
      workoutId,
      durationMinutes: durationMin,
      totalVolume: parseFloat(String(totals.total_volume)),
      totalSets: totals.total_sets,
    },
    timestamp: now.toISOString(),
  });

  return {
    workoutId,
    finishedAt: now,
    durationMinutes: durationMin,
    summary: {
      totalSets:          totals.total_sets,
      totalVolume:        parseFloat(String(totals.total_volume)),
      exercisesPerformed: totals.exercises_performed,
    },
    breakdown,
  };
}
