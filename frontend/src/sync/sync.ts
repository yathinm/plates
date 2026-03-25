import { synchronize } from '@nozbe/watermelondb/sync';
import type { Database } from '@nozbe/watermelondb';
import type { SyncPullArgs, SyncPushArgs } from '@nozbe/watermelondb/sync';
import Toast from 'react-native-toast-message';

import { api } from '@/utils/api';
import { useSyncUi } from '@/stores/syncUi';

import { syncConflictResolver } from './conflictResolver';
import { buildPushBody, mapPullResponseToWatermelonChanges } from './mappers';
import type { PullResponse } from './protocol';

/** Default wait between failed sync attempts (e.g. flaky gym Wi‑Fi). */
export const SYNC_RETRY_DELAY_MS = 30_000;

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Pull: GET /sync/pull with `last_pulled_at` (ms). Maps server JSON → Watermelon change set.
 */
export function createPullChanges() {
  return async (args: SyncPullArgs) => {
    const q =
      args.lastPulledAt != null
        ? `?last_pulled_at=${encodeURIComponent(String(args.lastPulledAt))}`
        : '?last_pulled_at=0';
    const res = await api<PullResponse>(`/sync/pull${q}`);
    if (typeof res.timestamp !== 'number' || res.timestamp <= 0) {
      throw new Error('[sync] pull: invalid timestamp from server');
    }
    return {
      changes: mapPullResponseToWatermelonChanges(res),
      timestamp: res.timestamp,
    };
  };
}

/**
 * Push: POST /sync/push with local changes + last pulled cursor.
 */
export function createPushChanges(database: Database) {
  return async (args: SyncPushArgs) => {
    const body = await buildPushBody(database, args.changes, args.lastPulledAt);
    await api('/sync/push', { method: 'POST', body });
  };
}

/**
 * One full WatermelonDB sync (pull then push). Uses `synchronize()` from the library.
 * Sets {@link useSyncUi} `isSyncing` for the UI plate; shows a success toast when the round completes.
 */
export async function runSynchronize(database: Database): Promise<void> {
  const { setSyncing } = useSyncUi.getState();
  setSyncing(true);
  try {
    await synchronize({
      database,
      pullChanges: createPullChanges(),
      pushChanges: createPushChanges(database),
      conflictResolver: syncConflictResolver,
    });
    Toast.show({
      type: 'success',
      text1: 'Workout Synced!',
      text2: 'Your data is safe and up to date.',
      position: 'top',
      visibilityTime: 2800,
    });
  } finally {
    setSyncing(false);
  }
}

/**
 * Runs `runSynchronize` and on failure waits {@link SYNC_RETRY_DELAY_MS} then retries forever.
 */
export async function runSynchronizeWithRetry(database: Database): Promise<void> {
  for (;;) {
    try {
      await runSynchronize(database);
      return;
    } catch (e) {
      if (__DEV__) {
        console.warn(`[sync] failed; retrying in ${SYNC_RETRY_DELAY_MS / 1000}s`, e);
      }
      await sleep(SYNC_RETRY_DELAY_MS);
    }
  }
}
