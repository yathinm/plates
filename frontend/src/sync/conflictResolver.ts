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

function pickSetWinner(local: DirtyRaw, remote: DirtyRaw): 'local' | 'remote' {
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

function pickWorkoutWinner(local: DirtyRaw, remote: DirtyRaw): 'local' | 'remote' {
  const lt = workoutAnchorMs(local);
  const rt = workoutAnchorMs(remote);
  if (lt > rt) return 'local';
  if (rt > lt) return 'remote';
  return 'local';
}

/**
 * Last-write-wins when the same row was changed locally and on the server:
 * - **sets**: higher `performed_at` wins; ties → local.
 * - **workouts**: higher `end_time` (else `start_time`) wins; ties → local.
 * - **exercises** / **exercise_definitions**: remote wins (server catalog / join consistency).
 */
export const syncConflictResolver: SyncConflictResolver = (
  table: TableName<any>,
  local: DirtyRaw,
  remote: DirtyRaw,
  resolved: DirtyRaw,
): DirtyRaw => {
  if (table === 'sets') {
    return mergeWinner(resolved, local, remote, pickSetWinner(local, remote));
  }
  if (table === 'workouts') {
    return mergeWinner(resolved, local, remote, pickWorkoutWinner(local, remote));
  }
  if (table === 'exercises' || table === 'exercise_definitions') {
    return Object.assign(resolved, local, remote);
  }
  return resolved;
};
