import { NativeModules, Platform } from 'react-native';
import Database from '@nozbe/watermelondb/Database';
import { Q } from '@nozbe/watermelondb';

import type { DirtyRaw } from '@nozbe/watermelondb/RawRecord';

import { newClientUuid } from './clientUuid';
import { migrations } from './migrations';
import { schema } from './schema';
import { models } from './models';

const migrationSpec = migrations as { maxVersion: number; minVersion: number };
if (__DEV__ && migrationSpec.maxVersion !== schema.version) {
  throw new Error(
    `[WatermelonDB] app schema is v${schema.version} but migrations only reach v${migrationSpec.maxVersion}. ` +
      'If src/db/migrations.ts already has that migration, clear caches: `npx expo start -c` and `rm -rf node_modules/.cache`.',
  );
}
import type Workout from './models/workout';
import type Exercise from './models/exercise';
import type SetModel from './models/set';
import type ExerciseDefinition from './models/exerciseDefinition';

/**
 * True when the WatermelonDB native module is linked (custom dev build).
 * Expo Go does not ship it — SQLite + JSI would crash (e.g. initializeJSI on null).
 */
function watermelondbNativeAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  const g = globalThis as typeof globalThis & {
    nativeWatermelonCreateAdapter?: unknown;
  };
  return (
    NativeModules.WMDatabaseBridge != null ||
    typeof g.nativeWatermelonCreateAdapter === 'function'
  );
}

function createLokiAdapter() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
  return new LokiJSAdapter({
    dbName: 'plates',
    schema,
    migrations,
    useWebWorker: false,
    // Required by WatermelonDB 0.28+ (Loki / IndexedDB)
    useIncrementalIndexedDB: true,
    onSetUpError: (error: Error) => {
      console.error('WatermelonDB setup failed:', error);
    },
  });
}

/**
 * One module = one `Database` class identity (fixes `instanceof` in DatabaseProvider).
 * Web + Expo Go use Loki; a dev client with native WatermelonDB uses SQLite.
 */
function createAdapter() {
  if (Platform.OS === 'web' || !watermelondbNativeAvailable()) {
    if (Platform.OS !== 'web' && __DEV__) {
      console.warn(
        '[db] WatermelonDB native module not found — using Loki (e.g. Expo Go). Use a dev build for SQLite persistence.',
      );
    }
    return createLokiAdapter();
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  return new SQLiteAdapter({
    dbName: 'plates',
    schema,
    migrations,
    jsi: true,
    onSetUpError: (error: Error) => {
      console.error('WatermelonDB setup failed:', error);
    },
  });
}

const adapter = createAdapter();

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
    const now = Date.now();
    const workout = await workoutsCollection.create((w) => {
      (w._raw as DirtyRaw).id = newClientUuid();
      w.name = name;
      w.startTime = now;
      w.endTime = null;
      w.status = 'active';
      w.dirty = true;
      w.updatedAt = now;
    });
    return workout;
  });
}

async function findOrCreateExerciseDefinitionByNameInWrite(name: string) {
  const normalized = name.trim();
  const existing = await exerciseDefinitionsCollection
    .query(Q.where('name', normalized))
    .fetch();
  if (existing.length > 0) return existing[0];

  const created = await exerciseDefinitionsCollection.create((d) => {
    (d._raw as DirtyRaw).id = newClientUuid();
    d.name = normalized;
    d.primaryMuscle = null;
    d.equipment = null;
  });
  return created;
}

export async function findOrCreateExerciseDefinitionByNameAction(name: string) {
  return database.write(async () => {
    return findOrCreateExerciseDefinitionByNameInWrite(name);
  });
}

export async function findOrCreateExerciseForWorkoutAction(input: {
  workoutId: string;
  exerciseName: string;
}) {
  return database.write(async () => {
    const definition = await findOrCreateExerciseDefinitionByNameInWrite(
      input.exerciseName,
    );

    const existing = await exercisesCollection
      .query(
        Q.where('workout_id', input.workoutId),
        Q.where('exercise_definition_id', definition.id),
      )
      .fetch();
    if (existing.length > 0) return existing[0];

    const exercise = await exercisesCollection.create((e) => {
      (e._raw as DirtyRaw).id = newClientUuid();
      e.workoutId = input.workoutId;
      (e._raw as any).exercise_definition_id = definition.id;
      // We keep a display label in note because schema has no `name` column on exercises
      e.note = input.exerciseName;
    });
    return exercise;
  });
}

export async function addExerciseToWorkoutAction(input: {
  workoutId: string;
  exerciseDefinitionId: string;
  note?: string;
}) {
  return database.write(async () => {
    const exercise = await exercisesCollection.create((e) => {
      (e._raw as DirtyRaw).id = newClientUuid();
      e.workoutId = input.workoutId;
      (e._raw as any).exercise_definition_id = input.exerciseDefinitionId;
      e.note = input.note ?? '';
    });
    return exercise;
  });
}

async function nextSetNumberForExerciseInWrite(exerciseId: string): Promise<number> {
  const list = await setsCollection.query(Q.where('exercise_id', exerciseId)).fetch();
  const max = Math.max(0, ...list.map((s) => s.setNumber ?? 0));
  return max + 1;
}

export async function addSetToExerciseAction(input: {
  exerciseId: string;
  weight: number;
  reps: number;
  rpe: number;
  isCompleted?: boolean;
  setNumber?: number;
  performedAt?: number;
}) {
  return database.write(async () => {
    const setNumber =
      input.setNumber ?? (await nextSetNumberForExerciseInWrite(input.exerciseId));
    const performedAt = input.performedAt ?? Date.now();
    const now = Date.now();
    const set = await setsCollection.create((s) => {
      (s._raw as DirtyRaw).id = newClientUuid();
      s.exerciseId = input.exerciseId;
      s.weight = input.weight;
      s.reps = input.reps;
      s.rpe = input.rpe;
      s.isCompleted = input.isCompleted ?? true;
      s.setNumber = setNumber;
      s.performedAt = performedAt;
      s.dirty = true;
      s.updatedAt = now;
    });
    const exercise = await exercisesCollection.find(input.exerciseId);
    const workout = await workoutsCollection.find(exercise.workoutId);
    await workout.update((w) => {
      w.dirty = true;
      w.updatedAt = now;
    });
    return set;
  });
}

export async function addSetToWorkoutByExerciseNameAction(input: {
  workoutId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  rpe: number;
  isCompleted?: boolean;
  setNumber?: number;
  performedAt?: number;
}) {
  return database.write(async () => {
    const exercise = await findOrCreateExerciseForWorkoutAction({
      workoutId: input.workoutId,
      exerciseName: input.exerciseName,
    });

    const setNumber =
      input.setNumber ?? (await nextSetNumberForExerciseInWrite(exercise.id));
    const performedAt = input.performedAt ?? Date.now();
    const now = Date.now();

    const set = await setsCollection.create((s) => {
      (s._raw as DirtyRaw).id = newClientUuid();
      s.exerciseId = exercise.id;
      s.weight = input.weight;
      s.reps = input.reps;
      s.rpe = input.rpe;
      s.isCompleted = input.isCompleted ?? true;
      s.setNumber = setNumber;
      s.performedAt = performedAt;
      s.dirty = true;
      s.updatedAt = now;
    });
    const workout = await workoutsCollection.find(input.workoutId);
    await workout.update((w) => {
      w.dirty = true;
      w.updatedAt = now;
    });
    return set;
  });
}

export async function removeSetAction(setId: string) {
  return database.write(async () => {
    const set = await setsCollection.find(setId);
    const exercise = await exercisesCollection.find(set.exerciseId);
    const workout = await workoutsCollection.find(exercise.workoutId);
    await workout.update((w) => {
      w.dirty = true;
      w.updatedAt = Date.now();
    });
    await set.destroyPermanently();
  });
}

export async function finishWorkoutAction(workoutId: string) {
  return database.write(async () => {
    const workout = await workoutsCollection.find(workoutId);
    const now = Date.now();
    await workout.update((w) => {
      w.endTime = now;
      w.status = 'completed';
      w.dirty = true;
      w.updatedAt = now;
    });
    return workout;
  });
}

export async function discardWorkoutAction(workoutId: string) {
  return database.write(async () => {
    const workout = await workoutsCollection.find(workoutId);
    const now = Date.now();
    await workout.update((w) => {
      w.endTime = now;
      w.status = 'discarded';
      w.dirty = true;
      w.updatedAt = now;
    });
    return workout;
  });
}
