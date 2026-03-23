import { eq, and, ilike, sql } from 'drizzle-orm';
import { db, exercises, getRedis } from '../../database';

const CACHE_KEY = 'exercises';
const CACHE_TTL = 3600; // 1 hour

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
  } catch {
    // Redis miss or down -- fall through to DB
  }

  const conditions = [];

  if (filters.muscle) {
    conditions.push(eq(exercises.primaryMuscle, filters.muscle as any));
  }
  if (filters.category) {
    conditions.push(eq(exercises.category, filters.category as any));
  }
  if (filters.search) {
    conditions.push(ilike(exercises.name, `%${filters.search}%`));
  }

  const rows = await db
    .select({
      id:                 exercises.id,
      name:               exercises.name,
      primaryMuscle:      exercises.primaryMuscle,
      secondaryMuscles:   exercises.secondaryMuscles,
      category:           exercises.category,
      defaultRestSeconds: exercises.defaultRestSeconds,
      isCustom:           exercises.isCustom,
    })
    .from(exercises)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(exercises.primaryMuscle, exercises.name);

  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(rows), { EX: CACHE_TTL });
  } catch {
    // Cache write failure is non-fatal
  }

  return rows;
}

export async function invalidateExerciseCache() {
  try {
    const redis = getRedis();
    const keys = await redis.keys(`${CACHE_KEY}*`);
    if (keys.length > 0) await redis.del(keys);
  } catch {
    // Non-fatal
  }
}
