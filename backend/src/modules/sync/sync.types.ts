/**
 * Wire shapes for GET /sync/pull and POST /sync/push (snake_case JSON).
 * Align with frontend/src/sync/protocol.ts and docs/sync-protocol.md.
 */

export type ChangeBucket<T> = {
  created: T[];
  updated: T[];
  deleted: string[];
};

export type WorkoutWire = {
  id: string;
  user_id?: string;
  routine_id?: string | null;
  name?: string | null;
  started_at: number;
  finished_at?: number | null;
  notes?: string | null;
  /** Server `updated_at` on pull; ignored on push (Prisma @updatedAt). */
  updated_at?: number;
};

export type SetWire = {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg?: number | null;
  reps?: number | null;
  rpe?: number | null;
  performed_at?: number;
  updated_at?: number;
};

/** Catalog exercise (global library + user custom). */
export type ExerciseWire = {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  category: string;
  default_rest_seconds: number;
  is_custom: boolean;
  created_by: string | null;
  created_at: number;
  updated_at: number;
};

export type SyncChanges = {
  workouts: ChangeBucket<WorkoutWire>;
  sets: ChangeBucket<SetWire>;
  exercises: ChangeBucket<ExerciseWire>;
};

export type PullResponse = {
  changes: SyncChanges;
  /** T₂ — ms since Unix epoch (UTC). */
  timestamp: number;
};

/** Push may omit empty buckets. */
export type PushBody = {
  last_pulled_at?: number | null;
  changes: {
    workouts?: ChangeBucket<WorkoutWire>;
    sets?: ChangeBucket<SetWire>;
    exercises?: ChangeBucket<ExerciseWire>;
  };
};

export type PushResponse = {
  id_map?: Record<string, string>;
};
