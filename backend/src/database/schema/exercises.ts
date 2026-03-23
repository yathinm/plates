import { pgTable, uuid, varchar, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { muscleGroupEnum, exerciseCategoryEnum } from './enums';
import { users } from './users';

export const exercises = pgTable('exercises', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  name:               varchar('name', { length: 100 }).unique().notNull(),
  primaryMuscle:      muscleGroupEnum('primary_muscle').notNull(),
  secondaryMuscles:   muscleGroupEnum('secondary_muscles').array().default([]),
  category:           exerciseCategoryEnum('category').notNull(),
  defaultRestSeconds: integer('default_rest_seconds').notNull().default(90),
  createdBy:          uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  isCustom:           boolean('is_custom').notNull().default(false),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('idx_exercises_muscle').on(table.primaryMuscle),
  index('idx_exercises_category').on(table.category),
]);
