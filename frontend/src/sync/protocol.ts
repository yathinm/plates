/**
 * Plates sync wire types — must stay aligned with docs/sync-protocol.md
 * and with backend handlers when they are added.
 */

/** Server clock cursor persisted on device after each successful pull (T₂). */
export type SyncTimestamp = number;

/** Last successful pull cursor sent on the next pull (T₁). Null = first sync. */
export type LastPulledAt = SyncTimestamp | null;

export type ChangeBucket<TCreated, TUpdated> = {
  created: TCreated[];
  updated: TUpdated[];
  /** Stable server UUIDs (strings). */
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
};

export type SetWire = {
  id: string;
  workout_id: string;
  /** Catalog Exercise.id on the server. */
  exercise_id: string;
  set_number: number;
  weight_kg?: number | null;
  reps?: number | null;
  rpe?: number | null;
  performed_at?: number;
};

/** Server catalog exercise (global + optional user custom). */
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

/**
 * Standard change envelope for both Push and Pull (workouts / sets match Watermelon; exercises = catalog).
 */
export type SyncChanges = {
  workouts: ChangeBucket<WorkoutWire, WorkoutWire>;
  sets: ChangeBucket<SetWire, SetWire>;
  exercises: ChangeBucket<ExerciseWire, ExerciseWire>;
};

export type PullRequest = {
  last_pulled_at: LastPulledAt;
};

export type PullResponse = {
  changes: SyncChanges;
  /** T₂ — persist as next last_pulled_at after applying changes. */
  timestamp: SyncTimestamp;
};

export type PushRequest = {
  last_pulled_at: LastPulledAt;
  /** Push may omit empty buckets. */
  changes: Partial<SyncChanges>;
};

/** Alias for POST /sync/push body. */
export type PushBody = PushRequest;

export type PushResponse = {
  /** Optional per-row id map for first-time creates (local temp id → server id). */
  id_map?: Record<string, string>;
};
