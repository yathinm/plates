import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useWorkoutStore } from '@/stores/workout';

/**
 * Drives the workout clock.
 *
 * - Ticks the store every second while a workout is active and not paused.
 * - Immediately re-computes elapsed time when the app returns to foreground
 *   (covers the case where the OS suspended the JS timer while backgrounded).
 */
export function useWorkoutTimer() {
  const isActive = useWorkoutStore((s) => s.isActive);
  const isPaused = useWorkoutStore((s) => s.isPaused);
  const tick = useWorkoutStore((s) => s.tick);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      tick();
      intervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused, tick]);

  // Re-sync elapsed time when the app comes back to foreground
  useEffect(() => {
    function handleAppState(next: AppStateStatus) {
      if (next === 'active') tick();
    }

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [tick]);
}
