import { eq, and, desc } from 'drizzle-orm';
import { db, routines, routineExercises, exercises } from '../../database';
import { ValidationError, NotFoundError } from '../../common/errors';

interface RoutineExerciseInput {
  exerciseId: string;
  position: number;
  targetSets?: number;
  targetReps?: number;
  notes?: string;
}

interface CreateRoutineInput {
  name: string;
  description?: string;
  isPublic?: boolean;
  exercises: RoutineExerciseInput[];
}

export async function createRoutine(userId: string, input: CreateRoutineInput) {
  const { name, description, isPublic, exercises: exerciseInputs } = input;

  if (!name || name.length < 1 || name.length > 100) {
    throw new ValidationError('Routine name must be 1-100 characters');
  }
  if (!exerciseInputs || exerciseInputs.length === 0) {
    throw new ValidationError('A routine must have at least one exercise');
  }

  const [routine] = await db
    .insert(routines)
    .values({
      userId,
      name,
      description: description || null,
      isPublic: isPublic ?? false,
    })
    .returning();

  const exerciseRows = exerciseInputs.map((e) => ({
    routineId:  routine.id,
    exerciseId: e.exerciseId,
    position:   e.position,
    targetSets: e.targetSets ?? 3,
    targetReps: e.targetReps ?? 10,
    notes:      e.notes || null,
  }));

  await db.insert(routineExercises).values(exerciseRows);

  return getRoutineWithExercises(routine.id);
}

export async function listUserRoutines(userId: string) {
  const rows = await db
    .select({
      id:          routines.id,
      name:        routines.name,
      description: routines.description,
      isPublic:    routines.isPublic,
      forkCount:   routines.forkCount,
      createdAt:   routines.createdAt,
      updatedAt:   routines.updatedAt,
    })
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.updatedAt));

  return rows;
}

export async function getRoutineWithExercises(routineId: string) {
  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.id, routineId))
    .limit(1);

  if (!routine) throw new NotFoundError('Routine', routineId);

  const items = await db
    .select({
      position:   routineExercises.position,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
      notes:      routineExercises.notes,
      exercise: {
        id:                 exercises.id,
        name:               exercises.name,
        primaryMuscle:      exercises.primaryMuscle,
        category:           exercises.category,
        defaultRestSeconds: exercises.defaultRestSeconds,
      },
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(routineExercises.position);

  return {
    id:          routine.id,
    name:        routine.name,
    description: routine.description,
    isPublic:    routine.isPublic,
    forkCount:   routine.forkCount,
    createdAt:   routine.createdAt,
    updatedAt:   routine.updatedAt,
    exercises:   items,
  };
}
