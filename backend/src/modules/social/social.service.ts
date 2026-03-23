import { prisma, getRedis } from '../../database';
import { NotFoundError, ValidationError } from '../../common/errors';

const LIVE_KEY = 'live:lifting';

// ── Redis Pub/Sub channels ─────────────────────────────────────
export const CHANNELS = {
  WORKOUT_START: 'social:workout_start',
  WORKOUT_FINISH: 'social:workout_finish',
  HYPE: 'social:hype',
} as const;

export interface SocialEvent {
  type: 'workout_start' | 'workout_finish' | 'hype';
  fromUserId: string;
  fromUsername: string;
  targetUserId?: string;
  payload: Record<string, any>;
  timestamp: string;
}

// ── Publish an event to Redis Pub/Sub ──────────────────────────
export async function publishEvent(channel: string, event: SocialEvent) {
  try {
    const redis = getRedis();
    await redis.publish(channel, JSON.stringify(event));
  } catch { /* non-fatal */ }
}

// ── Get "Currently Lifting" feed for a user's friends ──────────
export async function getActiveFriends(userId: string) {
  const redis = getRedis();

  // Get the list of users this person follows
  const following = await prisma.follower.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const friendIds = following.map((f) => f.followingId);
  if (friendIds.length === 0) return [];

  // Batch-fetch all active entries from the live hash
  const entries = await redis.hGetAll(LIVE_KEY);

  const active = [];
  for (const friendId of friendIds) {
    const raw = entries[friendId];
    if (!raw) continue;

    const data = JSON.parse(raw);

    // Look up the friend's display info
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { username: true, displayName: true, avatarUrl: true },
    });

    active.push({
      userId: friendId,
      username: friend?.username,
      displayName: friend?.displayName,
      avatarUrl: friend?.avatarUrl,
      workoutName: data.name,
      currentExercise: data.currentExercise,
      startedAt: data.startedAt,
      lastSetAt: data.lastSetAt || null,
    });
  }

  return active;
}

// ── Send a "Hype" to a friend who is mid-workout ───────────────
export async function sendHype(fromUserId: string, fromUsername: string, targetUserId: string) {
  if (fromUserId === targetUserId) {
    throw new ValidationError("You can't hype yourself");
  }

  // Verify the target is actually lifting right now
  const redis = getRedis();
  const targetData = await redis.hGet(LIVE_KEY, targetUserId);
  if (!targetData) {
    throw new NotFoundError('Active workout for this user');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { username: true },
  });

  const event: SocialEvent = {
    type: 'hype',
    fromUserId,
    fromUsername,
    targetUserId,
    payload: {
      message: `${fromUsername} sent you a hype!`,
      targetUsername: targetUser?.username,
    },
    timestamp: new Date().toISOString(),
  };

  await publishEvent(CHANNELS.HYPE, event);

  return { sent: true, to: targetUserId };
}
