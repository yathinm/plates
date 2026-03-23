import { sql } from 'drizzle-orm';
import { db, pool, workouts, workoutSets, exercises, getRedis } from '../../database';
import { eq } from 'drizzle-orm';
import { ValidationError, NotFoundError, AppError } from '../../common/errors';

// ── Redis keys for live social feed ────────────────────────────
const LIVE_KEY = 'live:lifting';
const LIVE_TTL = 7200; // 2 hours max

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

// ── Start a workout session ────────────────────────────────────
export async function startWorkout(userId: string, input: StartWorkoutInput) {
  const now = new Date();

  const [workout] = await db
    .insert(workouts)
    .values({
      userId,
      routineId: input.routineId || null,
      name: input.name || 'Workout',
      startedAt: now,
      notes: input.notes || null,
    })
    .returning();

  // Broadcast to "Currently Lifting" feed
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

  return workout;
}

// ── Log a single set (writes to TimescaleDB hypertable) ────────
export async function logSet(userId: string, workoutId: string, input: LogSetInput) {
  if (!input.exerciseId) throw new ValidationError('exerciseId is required');
  if (!input.setNumber || input.setNumber < 1) throw new ValidationError('setNumber must be >= 1');

  // Verify the workout belongs to this user and is still in progress
  const { rows: workoutRows } = await pool.query(
    `SELECT id, user_id, finished_at FROM workouts WHERE id = $1 LIMIT 1`,
    [workoutId],
  );

  if (workoutRows.length === 0) throw new NotFoundError('Workout', workoutId);
  if (workoutRows[0].user_id !== userId) throw new AppError(403, 'Not your workout', 'FORBIDDEN');
  if (workoutRows[0].finished_at) throw new ValidationError('Workout already finished');

  const now = new Date();

  const [inserted] = await db
    .insert(workoutSets)
    .values({
      workoutId,
      exerciseId: input.exerciseId,
      setNumber: input.setNumber,
      weightKg: input.weightKg?.toString() ?? null,
      reps: input.reps ?? null,
      rpe: input.rpe?.toString() ?? null,
      rir: input.rir ?? null,
      durationSec: input.durationSec ?? null,
      restSec: input.restSec ?? null,
      performedAt: now,
    })
    .returning();

  // Compute volume for this set: weight × reps
  const setVolume = (input.weightKg ?? 0) * (input.reps ?? 0);

  // Update the live feed with the current exercise
  try {
    const redis = getRedis();
    const existing = await redis.hGet(LIVE_KEY, userId);
    if (existing) {
      const [exercise] = await db
        .select({ name: exercises.name })
        .from(exercises)
        .where(eq(exercises.id, input.exerciseId))
        .limit(1);

      const data = JSON.parse(existing);
      data.currentExercise = exercise?.name || null;
      data.lastSetAt = now.toISOString();
      await redis.hSet(LIVE_KEY, userId, JSON.stringify(data));
    }
  } catch { /* non-fatal */ }

  return {
    ...inserted,
    volume: setVolume,
  };
}

// ── Finish a workout session ───────────────────────────────────
export async function finishWorkout(userId: string, workoutId: string, notes?: string) {
  const { rows: workoutRows } = await pool.query(
    `SELECT id, user_id, finished_at, started_at FROM workouts WHERE id = $1 LIMIT 1`,
    [workoutId],
  );

  if (workoutRows.length === 0) throw new NotFoundError('Workout', workoutId);
  if (workoutRows[0].user_id !== userId) throw new AppError(403, 'Not your workout', 'FORBIDDEN');
  if (workoutRows[0].finished_at) throw new ValidationError('Workout already finished');

  const now = new Date();
  const startedAt = new Date(workoutRows[0].started_at);

  // Mark the workout as finished
  await pool.query(
    `UPDATE workouts SET finished_at = $1, notes = COALESCE($2, notes) WHERE id = $3`,
    [now, notes || null, workoutId],
  );

  // Calculate session totals from the hypertable
  const { rows: [totals] } = await pool.query(`
    SELECT
      COUNT(*)::int                                        AS total_sets,
      COALESCE(SUM(weight_kg * reps), 0)::numeric(10,2)   AS total_volume,
      COUNT(DISTINCT exercise_id)::int                     AS exercises_performed
    FROM workout_sets
    WHERE workout_id = $1
  `, [workoutId]);

  // Fetch the per-exercise breakdown
  const { rows: breakdown } = await pool.query(`
    SELECT
      e.name                                               AS exercise,
      COUNT(*)::int                                        AS sets,
      MAX(ws.weight_kg)::numeric(6,2)                      AS top_weight,
      SUM(ws.weight_kg * ws.reps)::numeric(10,2)           AS volume
    FROM workout_sets ws
    JOIN exercises e ON e.id = ws.exercise_id
    WHERE ws.workout_id = $1
    GROUP BY e.name
    ORDER BY volume DESC
  `, [workoutId]);

  const durationMin = Math.round((now.getTime() - startedAt.getTime()) / 60000);

  // Remove from "Currently Lifting" feed
  try {
    const redis = getRedis();
    await redis.hDel(LIVE_KEY, userId);
  } catch { /* non-fatal */ }

  return {
    workoutId,
    finishedAt: now,
    durationMinutes: durationMin,
    summary: {
      totalSets:          totals.total_sets,
      totalVolume:        parseFloat(totals.total_volume),
      exercisesPerformed: totals.exercises_performed,
    },
    breakdown,
  };
}
