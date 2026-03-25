import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { Database } from '@nozbe/watermelondb';

import { runSynchronize } from '@/src/sync/sync';

/**
 * Runs a best-effort sync when the app becomes active and once on mount (§4.4.5).
 */
export function useSyncOnForeground(database: Database, enabled: boolean) {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    const sync = () => {
      runSynchronize(database).catch(() => {
        /* errors logged in api / dev; UI stays calm */
      });
    };

    sync();

    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        sync();
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, [database, enabled]);
}
