import { pgTable, uuid, varchar, text, boolean, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { exercises } from './exercises';

export const routines = pgTable('routines', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:         varchar('name', { length: 100 }).notNull(),
  description:  text('description'),
  isPublic:     boolean('is_public').notNull().default(false),
  forkedFromId: uuid('forked_from_id').references((): any => routines.id, { onDelete: 'set null' }),
  forkCount:    integer('fork_count').notNull().default(0),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_routines_user').on(table.userId),
  index('idx_routines_public').on(table.isPublic),
]);

export const routineExercises = pgTable('routine_exercises', {
  id:         uuid('id').primaryKey().defaultRandom(),
  routineId:  uuid('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  position:   integer('position').notNull(),
  targetSets: integer('target_sets').notNull().default(3),
  targetReps: integer('target_reps').notNull().default(10),
  notes:      text('notes'),
}, (table) => [
  unique().on(table.routineId, table.position),
  index('idx_routine_ex_routine').on(table.routineId),
]);
