import { prisma } from '../../database';
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
  const { name, description, isPublic, exercises } = input;

  if (!name || name.length < 1 || name.length > 100) {
    throw new ValidationError('Routine name must be 1-100 characters');
  }
  if (!exercises || exercises.length === 0) {
    throw new ValidationError('A routine must have at least one exercise');
  }

  const routine = await prisma.routine.create({
    data: {
      userId,
      name,
      description: description || null,
      isPublic: isPublic ?? false,
      exercises: {
        create: exercises.map((e) => ({
          exerciseId: e.exerciseId,
          position:   e.position,
          targetSets: e.targetSets ?? 3,
          targetReps: e.targetReps ?? 10,
          notes:      e.notes || null,
        })),
      },
    },
  });

  return getRoutineWithExercises(routine.id);
}

export async function listUserRoutines(userId: string) {
  return prisma.routine.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      forkCount: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getRoutineWithExercises(routineId: string) {
  const routine = await prisma.routine.findUnique({
    where: { id: routineId },
    include: {
      exercises: {
        orderBy: { position: 'asc' },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              primaryMuscle: true,
              category: true,
              defaultRestSeconds: true,
            },
          },
        },
      },
    },
  });

  if (!routine) throw new NotFoundError('Routine', routineId);

  return {
    id:          routine.id,
    name:        routine.name,
    description: routine.description,
    isPublic:    routine.isPublic,
    forkCount:   routine.forkCount,
    createdAt:   routine.createdAt,
    updatedAt:   routine.updatedAt,
    exercises: routine.exercises.map((re) => ({
      position:   re.position,
      targetSets: re.targetSets,
      targetReps: re.targetReps,
      notes:      re.notes,
      exercise:   re.exercise,
    })),
  };
}
