import { Prisma } from '@prisma/client';
import { prisma, getRedis } from '../../database';

const CACHE_KEY = 'exercises';
const CACHE_TTL = 3600;

interface ExerciseFilters {
  muscle?: string;
  category?: string;
  search?: string;
}

function cacheKeyFor(filters: ExerciseFilters): string {
  const parts = [CACHE_KEY];
  if (filters.muscle) parts.push(`m:${filters.muscle}`);
  if (filters.category) parts.push(`c:${filters.category}`);
  if (filters.search) parts.push(`q:${filters.search.toLowerCase()}`);
  return parts.join(':');
}

export async function listExercises(filters: ExerciseFilters = {}) {
  const key = cacheKeyFor(filters);

  try {
    const redis = getRedis();
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch { /* fall through */ }

  const where: Prisma.ExerciseWhereInput = {};

  if (filters.muscle) {
    where.primaryMuscle = filters.muscle as any;
  }
  if (filters.category) {
    where.category = filters.category as any;
  }
  if (filters.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  const rows = await prisma.exercise.findMany({
    where,
    select: {
      id: true,
      name: true,
      primaryMuscle: true,
      secondaryMuscles: true,
      category: true,
      defaultRestSeconds: true,
      isCustom: true,
    },
    orderBy: [{ primaryMuscle: 'asc' }, { name: 'asc' }],
  });

  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(rows), { EX: CACHE_TTL });
  } catch { /* non-fatal */ }

  return rows;
}

export async function invalidateExerciseCache() {
  try {
    const redis = getRedis();
    const keys = await redis.keys(`${CACHE_KEY}*`);
    if (keys.length > 0) await redis.del(keys);
  } catch { /* non-fatal */ }
}
