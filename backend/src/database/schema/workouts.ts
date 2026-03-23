import { pgTable, uuid, varchar, text, timestamp, smallint, numeric, integer, index, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';
import { routines } from './routines';
import { exercises } from './exercises';

export const workouts = pgTable('workouts', {
  id:         uuid('id').notNull().defaultRandom(),
  userId:     uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId:  uuid('routine_id').references(() => routines.id, { onDelete: 'set null' }),
  name:       varchar('name', { length: 100 }),
  startedAt:  timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  notes:      text('notes'),
}, (table) => [
  primaryKey({ columns: [table.id, table.startedAt] }),
  index('idx_workouts_user').on(table.userId, table.startedAt),
]);

export const workoutSets = pgTable('workout_sets', {
  id:          uuid('id').notNull().defaultRandom(),
  workoutId:   uuid('workout_id').notNull(),
  exerciseId:  uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  setNumber:   smallint('set_number').notNull(),
  weightKg:    numeric('weight_kg', { precision: 6, scale: 2 }),
  reps:        smallint('reps'),
  rpe:         numeric('rpe', { precision: 3, scale: 1 }),
  rir:         smallint('rir'),
  durationSec: integer('duration_sec'),
  restSec:     integer('rest_sec'),
  videoUrl:    text('video_url'),
  performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.id, table.performedAt] }),
  index('idx_sets_workout').on(table.workoutId, table.performedAt),
  index('idx_sets_exercise').on(table.exerciseId, table.performedAt),
]);
