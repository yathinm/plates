import type { TableName } from '@nozbe/watermelondb';
import type { DirtyRaw } from '@nozbe/watermelondb/RawRecord';
import type { SyncConflictResolver } from '@nozbe/watermelondb/sync';

function mergeWinner(
  resolved: DirtyRaw,
  local: DirtyRaw,
  remote: DirtyRaw,
  winner: 'local' | 'remote',
): DirtyRaw {
  if (winner === 'local') {
    return Object.assign(resolved, remote, local);
  }
  return Object.assign(resolved, local, remote);
}

/** Treat missing, NaN, and `0` as “no LWW timestamp” (migration / legacy). */
function lwwUpdatedAtMs(raw: DirtyRaw): number | null {
  const v = raw.updated_at != null ? Number(raw.updated_at) : NaN;
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

/** Prefer server `updated_at` when both sides have it; otherwise use tie-breaker. */
function pickByUpdatedAt(
  local: DirtyRaw,
  remote: DirtyRaw,
  tieBreak: () => 'local' | 'remote',
): 'local' | 'remote' {
  const lu = lwwUpdatedAtMs(local);
  const ru = lwwUpdatedAtMs(remote);
  if (lu != null && ru != null) {
    if (lu > ru) return 'local';
    if (ru > lu) return 'remote';
    return 'local';
  }
  if (ru != null && lu == null) return 'remote';
  if (lu != null && ru == null) return 'local';
  return tieBreak();
}

function pickSetWinnerFallback(local: DirtyRaw, remote: DirtyRaw): 'local' | 'remote' {
  const lp = local.performed_at != null ? Number(local.performed_at) : null;
  const rp = remote.performed_at != null ? Number(remote.performed_at) : null;
  if (lp != null && rp != null) {
    if (lp > rp) return 'local';
    if (rp > lp) return 'remote';
    return 'local';
  }
  if (lp != null) return 'local';
  if (rp != null) return 'remote';
  return 'local';
}

function workoutAnchorMs(raw: DirtyRaw): number {
  const end = raw.end_time != null ? Number(raw.end_time) : null;
  const start = raw.start_time != null ? Number(raw.start_time) : 0;
  return end ?? start;
}

function pickWorkoutWinnerFallback(local: DirtyRaw, remote: DirtyRaw): 'local' | 'remote' {
  const lt = workoutAnchorMs(local);
  const rt = workoutAnchorMs(remote);
  if (lt > rt) return 'local';
  if (rt > lt) return 'remote';
  return 'local';
}

/**
 * Last-write-wins (§4.4.4): compare **`updated_at`** when present (server time on pull;
 * local edits bump device time). If either side lacks it (legacy row), fall back to
 * **`performed_at`** (sets) or workout time anchor (**`end_time`** / **`start_time`**).
 * **exercises** / **exercise_definitions**: remote wins (catalog / join consistency).
 */
export const syncConflictResolver: SyncConflictResolver = (
  table: TableName<any>,
  local: DirtyRaw,
  remote: DirtyRaw,
  resolved: DirtyRaw,
): DirtyRaw => {
  if (table === 'sets') {
    return mergeWinner(
      resolved,
      local,
      remote,
      pickByUpdatedAt(local, remote, () => pickSetWinnerFallback(local, remote)),
    );
  }
  if (table === 'workouts') {
    return mergeWinner(
      resolved,
      local,
      remote,
      pickByUpdatedAt(local, remote, () => pickWorkoutWinnerFallback(local, remote)),
    );
  }
  if (table === 'exercises' || table === 'exercise_definitions') {
    return Object.assign(resolved, local, remote);
  }
  return resolved;
};
