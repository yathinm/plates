import { Prisma, MuscleGroup, ExerciseCategory } from '@prisma/client';
import { prisma } from '../../database';
import { AppError, ValidationError } from '../../common/errors';
import type {
  ChangeBucket,
  ExerciseWire,
  PullResponse,
  PushBody,
  PushResponse,
  SetWire,
  SyncChanges,
  WorkoutWire,
} from './sync.types';

function ms(d: Date): number {
  return d.getTime();
}

function decToNum(v: Prisma.Decimal | null | undefined): number | null {
  if (v == null) return null;
  return parseFloat(v.toString());
}

function workoutToWire(w: {
  id: string;
  userId: string;
  routineId: string | null;
  name: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  notes: string | null;
}): WorkoutWire {
  return {
    id: w.id,
    user_id: w.userId,
    routine_id: w.routineId,
    name: w.name,
    started_at: ms(w.startedAt),
    finished_at: w.finishedAt ? ms(w.finishedAt) : null,
    notes: w.notes,
  };
}

function setToWire(s: {
  id: string;
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: Prisma.Decimal | null;
  reps: number | null;
  rpe: Prisma.Decimal | null;
  performedAt: Date;
}): SetWire {
  return {
    id: s.id,
    workout_id: s.workoutId,
    exercise_id: s.exerciseId,
    set_number: s.setNumber,
    weight_kg: decToNum(s.weightKg),
    reps: s.reps,
    rpe: decToNum(s.rpe),
    performed_at: ms(s.performedAt),
  };
}

function exerciseToWire(e: {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  category: ExerciseCategory;
  defaultRestSeconds: number;
  isCustom: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ExerciseWire {
  return {
    id: e.id,
    name: e.name,
    primary_muscle: e.primaryMuscle,
    secondary_muscles: [...e.secondaryMuscles],
    category: e.category,
    default_rest_seconds: e.defaultRestSeconds,
    is_custom: e.isCustom,
    created_by: e.createdBy,
    created_at: ms(e.createdAt),
    updated_at: ms(e.updatedAt),
  };
}

function splitWorkouts(
  rows: Awaited<ReturnType<typeof prisma.workout.findMany>>,
  since: Date,
): ChangeBucket<WorkoutWire> {
  const created: WorkoutWire[] = [];
  const updated: WorkoutWire[] = [];
  for (const w of rows) {
    const wire = workoutToWire(w);
    if (w.startedAt > since) {
      created.push(wire);
    } else {
      updated.push(wire);
    }
  }
  return { created, updated, deleted: [] };
}

function splitSets(
  rows: Awaited<ReturnType<typeof prisma.workoutSet.findMany>>,
  since: Date,
): ChangeBucket<SetWire> {
  const created: SetWire[] = [];
  const updated: SetWire[] = [];
  for (const s of rows) {
    const wire = setToWire(s);
    if (s.performedAt > since) {
      created.push(wire);
    } else {
      updated.push(wire);
    }
  }
  return { created, updated, deleted: [] };
}

function splitExercises(
  rows: Awaited<ReturnType<typeof prisma.exercise.findMany>>,
  since: Date,
): ChangeBucket<ExerciseWire> {
  const created: ExerciseWire[] = [];
  const updated: ExerciseWire[] = [];
  for (const e of rows) {
    const wire = exerciseToWire(e);
    if (e.createdAt > since) {
      created.push(wire);
    } else {
      updated.push(wire);
    }
  }
  return { created, updated, deleted: [] };
}

/**
 * GET /sync/pull — rows changed after last_pulled_at (exclusive of cursor).
 */
export async function pullChanges(userId: string, lastPulledAtMs: number | null): Promise<PullResponse> {
  const since =
    lastPulledAtMs != null && Number.isFinite(lastPulledAtMs)
      ? new Date(lastPulledAtMs)
      : new Date(0);

  const [workoutRows, setRows, exerciseRows] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, updatedAt: { gt: since } },
    }),
    prisma.workoutSet.findMany({
      where: {
        updatedAt: { gt: since },
        workout: { userId },
      },
    }),
    prisma.exercise.findMany({
      where: { updatedAt: { gt: since } },
    }),
  ]);

  const changes: SyncChanges = {
    workouts: splitWorkouts(workoutRows, since),
    sets: splitSets(setRows, since),
    exercises: splitExercises(exerciseRows, since),
  };

  return {
    changes,
    timestamp: Date.now(),
  };
}

async function assertWorkoutOwned(tx: Prisma.TransactionClient, userId: string, workoutId: string) {
  const row = await tx.workout.findFirst({
    where: { id: workoutId, userId },
    select: { id: true, startedAt: true },
  });
  if (!row) {
    throw new ValidationError(`Workout ${workoutId} not found or not yours`);
  }
  return row;
}

function parseWorkoutWire(w: WorkoutWire, userId: string) {
  const startedAt = new Date(w.started_at);
  if (Number.isNaN(startedAt.getTime())) {
    throw new ValidationError('Invalid workout started_at');
  }
  return {
    id: w.id,
    startedAt,
    userId,
    routineId: w.routine_id ?? null,
    name: w.name ?? null,
    finishedAt: w.finished_at != null ? new Date(w.finished_at) : null,
    notes: w.notes ?? null,
  };
}

function parseSetWire(s: SetWire) {
  const performedAt =
    s.performed_at != null ? new Date(s.performed_at) : new Date();
  if (Number.isNaN(performedAt.getTime())) {
    throw new ValidationError('Invalid set performed_at');
  }
  return {
    id: s.id,
    workoutId: s.workout_id,
    exerciseId: s.exercise_id,
    setNumber: s.set_number,
    weightKg: s.weight_kg,
    reps: s.reps,
    rpe: s.rpe,
    performedAt,
  };
}

/**
 * POST /sync/push — transactional upsert/delete for the authenticated user.
 */
export async function pushChanges(userId: string, body: PushBody): Promise<PushResponse> {
  const changes = body?.changes;
  if (!changes || typeof changes !== 'object') {
    throw new ValidationError('changes is required');
  }

  await prisma.$transaction(async (tx) => {
    const workoutBuckets = [
      ...(changes.workouts?.created ?? []),
      ...(changes.workouts?.updated ?? []),
    ];
    const setBuckets = [...(changes.sets?.created ?? []), ...(changes.sets?.updated ?? [])];
    const exerciseBuckets = [
      ...(changes.exercises?.created ?? []),
      ...(changes.exercises?.updated ?? []),
    ];

    // ── Deletes (sets before workouts) ─────────────────────────
    for (const sid of changes.sets?.deleted ?? []) {
      if (!sid) continue;
      const deleted = await tx.workoutSet.deleteMany({
        where: {
          id: sid,
          workout: { userId },
        },
      });
      if (deleted.count === 0) {
        // May be already gone; ignore or strict — ignore for idempotent sync
      }
    }

    for (const wid of changes.workouts?.deleted ?? []) {
      if (!wid) continue;
      await tx.workoutSet.deleteMany({
        where: { workoutId: wid, workout: { userId } },
      });
      await tx.workout.deleteMany({
        where: { id: wid, userId },
      });
    }

    // ── Workouts upsert ────────────────────────────────────────
    for (const w of workoutBuckets) {
      const data = parseWorkoutWire(w, userId);
      await tx.workout.upsert({
        where: {
          id_startedAt: { id: data.id, startedAt: data.startedAt },
        },
        create: {
          id: data.id,
          startedAt: data.startedAt,
          userId: data.userId,
          routineId: data.routineId,
          name: data.name,
          finishedAt: data.finishedAt,
          notes: data.notes,
        },
        update: {
          routineId: data.routineId,
          name: data.name,
          finishedAt: data.finishedAt,
          notes: data.notes,
        },
      });
    }

    // ── Sets upsert (workout must belong to user) ─────────────
    for (const s of setBuckets) {
      const data = parseSetWire(s);
      await assertWorkoutOwned(tx, userId, data.workoutId);

      await tx.workoutSet.upsert({
        where: {
          id_performedAt: {
            id: data.id,
            performedAt: data.performedAt,
          },
        },
        create: {
          id: data.id,
          workoutId: data.workoutId,
          exerciseId: data.exerciseId,
          setNumber: data.setNumber,
          weightKg: data.weightKg ?? null,
          reps: data.reps ?? null,
          rpe: data.rpe ?? null,
          performedAt: data.performedAt,
        },
        update: {
          workoutId: data.workoutId,
          exerciseId: data.exerciseId,
          setNumber: data.setNumber,
          weightKg: data.weightKg ?? null,
          reps: data.reps ?? null,
          rpe: data.rpe ?? null,
        },
      });
    }

    // ── Custom exercises only (catalog is mostly server-owned) ─
    for (const ex of exerciseBuckets) {
      if (!ex.is_custom) {
        continue;
      }
      if (ex.created_by && ex.created_by !== userId) {
        throw new AppError(403, 'Cannot sync exercise owned by another user', 'FORBIDDEN');
      }

      const primaryMuscle = ex.primary_muscle as MuscleGroup;
      const category = ex.category as ExerciseCategory;
      const secondary = (ex.secondary_muscles ?? []) as MuscleGroup[];

      await tx.exercise.upsert({
        where: { id: ex.id },
        create: {
          id: ex.id,
          name: ex.name,
          primaryMuscle,
          secondaryMuscles: secondary,
          category,
          defaultRestSeconds: ex.default_rest_seconds ?? 90,
          isCustom: true,
          createdBy: userId,
        },
        update: {
          name: ex.name,
          primaryMuscle,
          secondaryMuscles: secondary,
          category,
          defaultRestSeconds: ex.default_rest_seconds ?? 90,
        },
      });
    }

    for (const eid of changes.exercises?.deleted ?? []) {
      if (!eid) continue;
      const n = await tx.exercise.deleteMany({
        where: { id: eid, isCustom: true, createdBy: userId },
      });
      if (n.count === 0) {
        // non-custom or not ours — skip
      }
    }
  });

  return {};
}
