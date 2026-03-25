import { Platform } from 'react-native';
import Database from '@nozbe/watermelondb/Database';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { models } from './models';
import type Workout from './models/workout';
import type Exercise from './models/exercise';
import type SetModel from './models/set';
import type ExerciseDefinition from './models/exerciseDefinition';

const adapter = new SQLiteAdapter({
  dbName: 'plates',
  schema,
  // JSI gives near-native performance on iOS/Android dev builds
  jsi: Platform.OS !== 'web',
  onSetUpError: (error) => {
    console.error('WatermelonDB setup failed:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: models,
});

export const workoutsCollection = database.get<Workout>('workouts');
export const exercisesCollection = database.get<Exercise>('exercises');
export const setsCollection = database.get<SetModel>('sets');
export const exerciseDefinitionsCollection =
  database.get<ExerciseDefinition>('exercise_definitions');

// ---------------------------------------------------------------------------
// First write actions (must run inside database.write)
// ---------------------------------------------------------------------------

export async function createWorkoutAction(name: string) {
  return database.write(async () => {
    const workout = await workoutsCollection.create((w) => {
      w.name = name;
      w.startTime = Date.now();
      w.endTime = null;
      w.status = 'active';
    });
    return workout;
  });
}

export async function addExerciseToWorkoutAction(input: {
  workoutId: string;
  exerciseDefinitionId: string;
  note?: string;
}) {
  return database.write(async () => {
    const exercise = await exercisesCollection.create((e) => {
      // Raw FK fields are set through _raw for Watermelon relations
      (e._raw as any).workout_id = input.workoutId;
      (e._raw as any).exercise_definition_id = input.exerciseDefinitionId;
      e.note = input.note ?? '';
    });
    return exercise;
  });
}

export async function addSetToExerciseAction(input: {
  exerciseId: string;
  weight: number;
  reps: number;
  rpe: number;
  isCompleted?: boolean;
}) {
  return database.write(async () => {
    const set = await setsCollection.create((s) => {
      (s._raw as any).exercise_id = input.exerciseId;
      s.weight = input.weight;
      s.reps = input.reps;
      s.rpe = input.rpe;
      s.isCompleted = input.isCompleted ?? true;
    });
    return set;
  });
}

export async function finishWorkoutAction(workoutId: string) {
  return database.write(async () => {
    const workout = await workoutsCollection.find(workoutId);
    await workout.update((w) => {
      w.endTime = Date.now();
      w.status = 'completed';
    });
    return workout;
  });
}
