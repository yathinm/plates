import type { Database } from '@nozbe/watermelondb';
import type { DirtyRaw } from '@nozbe/watermelondb/RawRecord';
import type { SyncDatabaseChangeSet, SyncTableChangeSet } from '@nozbe/watermelondb/sync';

import type Exercise from '../db/models/exercise';
import type { PullResponse, PushBody, SetWire, SyncChanges, WorkoutWire } from './protocol';

function emptyTable(): SyncTableChangeSet {
  return { created: [], updated: [], deleted: [] };
}

/** Deterministic local id for the workout × exercise_definition join row. */
export function exerciseJoinId(workoutId: string, exerciseDefinitionId: string): string {
  return `ej_${workoutId}__${exerciseDefinitionId}`;
}

/**
 * Maps GET /sync/pull JSON into Watermelon `SyncDatabaseChangeSet` (snake_case column names).
 * Order of tables: exercise_definitions → workouts → exercises → sets (FK-friendly).
 */
export function mapPullResponseToWatermelonChanges(res: PullResponse): SyncDatabaseChangeSet {
  const w = res.changes.workouts ?? { created: [], updated: [], deleted: [] };
  const s = res.changes.sets ?? { created: [], updated: [], deleted: [] };
  const ex = res.changes.exercises ?? { created: [], updated: [], deleted: [] };

  const exercise_definitions: SyncTableChangeSet = emptyTable();
  const workouts: SyncTableChangeSet = emptyTable();
  const exercises: SyncTableChangeSet = emptyTable();
  const sets: SyncTableChangeSet = emptyTable();

  const pushDef = (wire: (typeof ex.created)[0], bucket: 'created' | 'updated') => {
    const raw: DirtyRaw = {
      id: wire.id,
      name: wire.name,
      primary_muscle: wire.primary_muscle || null,
      equipment: null,
    };
    exercise_definitions[bucket].push(raw);
  };

  for (const wire of ex.created) pushDef(wire, 'created');
  for (const wire of ex.updated) pushDef(wire, 'updated');
  exercise_definitions.deleted.push(...ex.deleted);

  const pushWorkout = (wire: (typeof w.created)[0], bucket: 'created' | 'updated') => {
    const raw: DirtyRaw = {
      id: wire.id,
      name: wire.name ?? 'Workout',
      start_time: wire.started_at,
      end_time: wire.finished_at ?? null,
      status: wire.finished_at != null ? 'completed' : 'active',
      server_id: wire.id,
      dirty: false,
    };
    workouts[bucket].push(raw);
  };

  for (const wire of w.created) pushWorkout(wire, 'created');
  for (const wire of w.updated) pushWorkout(wire, 'updated');
  workouts.deleted.push(...w.deleted);

  const allSets = [...s.created, ...s.updated];
  const joinKeys = new Set<string>();
  for (const set of allSets) {
    joinKeys.add(exerciseJoinId(set.workout_id, set.exercise_id));
  }

  const pushJoin = (workoutId: string, exerciseDefId: string) => {
    const id = exerciseJoinId(workoutId, exerciseDefId);
    const raw: DirtyRaw = {
      id,
      workout_id: workoutId,
      exercise_definition_id: exerciseDefId,
      note: '',
    };
    exercises.created.push(raw);
  };

  for (const key of joinKeys) {
    const parsed = parseJoinKey(key);
    if (parsed) pushJoin(parsed.workoutId, parsed.exerciseDefId);
  }

  const setInCreated = new Set(s.created.map((x) => x.id));
  for (const set of allSets) {
    const exId = exerciseJoinId(set.workout_id, set.exercise_id);
    const raw: DirtyRaw = {
      id: set.id,
      exercise_id: exId,
      weight: set.weight_kg ?? 0,
      reps: set.reps ?? 0,
      rpe: set.rpe ?? 0,
      is_completed: true,
      server_id: set.id,
      dirty: false,
    };
    const bucket = setInCreated.has(set.id) ? 'created' : 'updated';
    sets[bucket].push(raw);
  }

  sets.deleted.push(...s.deleted);

  return {
    exercise_definitions,
    workouts,
    exercises,
    sets,
  };
}

function parseJoinKey(key: string): { workoutId: string; exerciseDefId: string } | null {
  if (!key.startsWith('ej_')) return null;
  const rest = key.slice(3);
  const sep = '__';
  const i = rest.indexOf(sep);
  if (i <= 0) return null;
  return {
    workoutId: rest.slice(0, i),
    exerciseDefId: rest.slice(i + sep.length),
  };
}

function workoutRawToWire(raw: DirtyRaw): WorkoutWire {
  return {
    id: String(raw.id),
    started_at: Number(raw.start_time),
    finished_at: raw.end_time != null ? Number(raw.end_time) : null,
    name: (raw.name as string) ?? null,
    notes: null,
    routine_id: null,
  };
}

async function setRawToWire(database: Database, raw: DirtyRaw): Promise<SetWire | null> {
  try {
    const exercise = await database
      .get<Exercise>('exercises')
      .find(String(raw.exercise_id));
    return {
      id: String(raw.id),
      workout_id: exercise.workoutId,
      exercise_id: exercise.exerciseDefinitionId,
      set_number: 1,
      weight_kg: raw.weight != null ? Number(raw.weight) : null,
      reps: raw.reps != null ? Number(raw.reps) : null,
      rpe: raw.rpe != null ? Number(raw.rpe) : null,
      performed_at: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Maps Watermelon local `SyncDatabaseChangeSet` to POST /sync/push JSON.
 */
export async function buildPushBody(
  database: Database,
  changes: SyncDatabaseChangeSet,
  lastPulledAt: number,
): Promise<PushBody> {
  const byTable = changes as Record<string, SyncTableChangeSet | undefined>;
  const cw = byTable.workouts;
  const cs = byTable.sets;

  const workouts = {
    created: (cw?.created ?? []).map(workoutRawToWire),
    updated: (cw?.updated ?? []).map(workoutRawToWire),
    deleted: [...(cw?.deleted ?? [])],
  };

  const setCreated: SetWire[] = [];
  const setUpdated: SetWire[] = [];

  for (const raw of cs?.created ?? []) {
    const w = await setRawToWire(database, raw);
    if (w) setCreated.push(w);
  }
  for (const raw of cs?.updated ?? []) {
    const w = await setRawToWire(database, raw);
    if (w) setUpdated.push(w);
  }

  const sets = {
    created: setCreated,
    updated: setUpdated,
    deleted: [...(cs?.deleted ?? [])],
  };

  const out: Partial<SyncChanges> = {};
  if (workouts.created.length || workouts.updated.length || workouts.deleted.length) {
    out.workouts = workouts;
  }
  if (sets.created.length || sets.updated.length || sets.deleted.length) {
    out.sets = sets;
  }

  return {
    last_pulled_at: lastPulledAt,
    changes: out,
  };
}
