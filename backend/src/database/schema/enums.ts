import { pgEnum } from 'drizzle-orm/pg-core';

export const muscleGroupEnum = pgEnum('muscle_group', [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'quads', 'hamstrings', 'glutes', 'calves',
  'abs', 'traps', 'lats', 'full_body',
]);

export const exerciseCategoryEnum = pgEnum('exercise_category', [
  'compound', 'isolation', 'cardio', 'bodyweight',
]);
