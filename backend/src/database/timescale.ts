import { sql } from 'drizzle-orm';
import { db } from './postgres';

export type BucketInterval = '1 hour' | '1 day' | '1 week' | '1 month';

/**
 * Query helpers for TimescaleDB-specific functions.
 * These use raw SQL since Drizzle doesn't have native hypertable support.
 */
export const timescale = {
  /**
   * Volume over time: SUM(weight * reps) bucketed by interval.
   * Useful for progressive overload heatmaps.
   */
  async volumeByPeriod(userId: string, interval: BucketInterval, exerciseId?: string) {
    const exerciseFilter = exerciseId
      ? sql`AND ws.exercise_id = ${exerciseId}`
      : sql``;

    const result = await db.execute(sql`
      SELECT
        time_bucket(${interval}, ws.performed_at) AS bucket,
        e.primary_muscle,
        SUM(ws.weight_kg::numeric * ws.reps) AS total_volume,
        COUNT(*) AS total_sets
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      JOIN exercises e ON e.id = ws.exercise_id
      WHERE w.user_id = ${userId}
        ${exerciseFilter}
      GROUP BY bucket, e.primary_muscle
      ORDER BY bucket DESC
    `);
    return result.rows;
  },

  /**
   * RPE trend over time for a specific exercise.
   * Detects overtraining when RPE climbs at the same weight.
   */
  async rpeTrend(userId: string, exerciseId: string, interval: BucketInterval) {
    const result = await db.execute(sql`
      SELECT
        time_bucket(${interval}, ws.performed_at) AS bucket,
        AVG(ws.rpe::numeric)      AS avg_rpe,
        AVG(ws.weight_kg::numeric) AS avg_weight,
        MAX(ws.weight_kg::numeric) AS max_weight
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      WHERE w.user_id = ${userId}
        AND ws.exercise_id = ${exerciseId}
        AND ws.rpe IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket DESC
    `);
    return result.rows;
  },

  /**
   * Estimated 1RM history using the Epley formula: weight * (1 + reps/30).
   * Bucketed over time for "Time-to-1RM" prediction charts.
   */
  async estimated1rmHistory(userId: string, exerciseId: string, interval: BucketInterval) {
    const result = await db.execute(sql`
      SELECT
        time_bucket(${interval}, ws.performed_at) AS bucket,
        MAX(ws.weight_kg::numeric * (1 + ws.reps::numeric / 30)) AS estimated_1rm,
        MAX(ws.weight_kg::numeric) AS max_weight,
        MAX(ws.reps) AS best_reps
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      WHERE w.user_id = ${userId}
        AND ws.exercise_id = ${exerciseId}
        AND ws.reps > 0
        AND ws.weight_kg IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket ASC
    `);
    return result.rows;
  },
};
