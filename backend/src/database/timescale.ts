import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type BucketInterval = '1 hour' | '1 day' | '1 week' | '1 month';

/**
 * Query helpers for TimescaleDB-specific functions.
 * Uses Prisma's $queryRawUnsafe since time_bucket needs dynamic interval strings.
 */
export const timescale = {
  async volumeByPeriod(userId: string, interval: BucketInterval, exerciseId?: string) {
    const exerciseFilter = exerciseId ? Prisma.sql`AND ws.exercise_id = ${exerciseId}::uuid` : Prisma.empty;

    return prisma.$queryRaw`
      SELECT
        time_bucket(${interval}, ws.performed_at) AS bucket,
        e.primary_muscle,
        SUM(ws.weight_kg * ws.reps)              AS total_volume,
        COUNT(*)::int                             AS total_sets
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      JOIN exercises e ON e.id = ws.exercise_id
      WHERE w.user_id = ${userId}::uuid
        ${exerciseFilter}
      GROUP BY bucket, e.primary_muscle
      ORDER BY bucket DESC
    `;
  },

  async rpeTrend(userId: string, exerciseId: string, interval: BucketInterval) {
    return prisma.$queryRaw`
      SELECT
        time_bucket(${interval}, ws.performed_at) AS bucket,
        AVG(ws.rpe)        AS avg_rpe,
        AVG(ws.weight_kg)  AS avg_weight,
        MAX(ws.weight_kg)  AS max_weight
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      WHERE w.user_id = ${userId}::uuid
        AND ws.exercise_id = ${exerciseId}::uuid
        AND ws.rpe IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket DESC
    `;
  },

  async estimated1rmHistory(userId: string, exerciseId: string, interval: BucketInterval) {
    return prisma.$queryRaw`
      SELECT
        time_bucket(${interval}, ws.performed_at) AS bucket,
        MAX(ws.weight_kg * (1 + ws.reps::numeric / 30)) AS estimated_1rm,
        MAX(ws.weight_kg) AS max_weight,
        MAX(ws.reps)      AS best_reps
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      WHERE w.user_id = ${userId}::uuid
        AND ws.exercise_id = ${exerciseId}::uuid
        AND ws.reps > 0
        AND ws.weight_kg IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
  },
};
