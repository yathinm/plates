import { Q } from '@nozbe/watermelondb';

/**
 * `dirty === false` means the row is in sync with the last successful push.
 * `true` or `null` (legacy / pre-migration) means pending upload.
 */
export function isPendingSyncDirty(dirty: boolean | null | undefined): boolean {
  return dirty !== false;
}

/** Query clause: workouts that still need to be pushed. */
export function pendingDirtyWorkoutsWhere() {
  return Q.or(Q.where('dirty', true), Q.where('dirty', Q.eq(null)));
}

/** Query clause: sets that still need to be pushed. */
export function pendingDirtySetsWhere() {
  return Q.or(Q.where('dirty', true), Q.where('dirty', Q.eq(null)));
}
