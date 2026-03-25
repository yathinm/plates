import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/utils/api';
import {
  createWorkoutAction,
  addSetToWorkoutByExerciseNameAction,
  finishWorkoutAction,
  discardWorkoutAction,
  removeSetAction,
} from '@/src/db';

// ── Data types ──────────────────────────────────────────────────

export interface WorkoutSet {
  localId: string;
  dbSetId?: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
  syncedAt: string | null;
}

export interface ActiveWorkout {
  localDbId: string | null;
  serverId: string | null;
  name: string;
  routineId: string | null;
  startedAt: string;
  sets: WorkoutSet[];
  notes: string;
}

// ── Store interface ─────────────────────────────────────────────

interface WorkoutState {
  isActive: boolean;
  isPaused: boolean;
  activeWorkout: ActiveWorkout | null;

  /** Wall-clock timestamps for crash-resilient elapsed time */
  pausedAt: number | null;
  totalPausedMs: number;
  elapsedSeconds: number;

  startWorkout: (name?: string, routineId?: string) => Promise<void>;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  addSet: (set: Omit<WorkoutSet, 'localId' | 'syncedAt'>) => Promise<void>;
  removeSet: (localId: string) => void;
  updateNotes: (notes: string) => void;
  finishWorkout: (notes?: string) => Promise<FinishResult>;
  discardWorkout: () => void;

  /** Called every second by the timer hook */
  tick: () => void;
}

interface FinishResult {
  workoutId: string;
  durationMinutes: number;
  summary: { totalSets: number; totalVolume: number; exercisesPerformed: number };
}

// ── Helpers ─────────────────────────────────────────────────────

let idCounter = 0;
function localId(): string {
  return `local_${Date.now()}_${++idCounter}`;
}

function computeElapsed(startedAt: string, totalPausedMs: number, pausedAt: number | null): number {
  const now = Date.now();
  const base = now - new Date(startedAt).getTime() - totalPausedMs;
  const paused = pausedAt ? now - pausedAt : 0;
  return Math.max(0, Math.floor((base - paused) / 1000));
}

// ── Store ───────────────────────────────────────────────────────

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      isActive: false,
      isPaused: false,
      activeWorkout: null,
      pausedAt: null,
      totalPausedMs: 0,
      elapsedSeconds: 0,

      startWorkout: async (name = 'Workout', routineId) => {
        const now = new Date().toISOString();
        let localDbId: string | null = null;

        // Offline-first local write to WatermelonDB
        try {
          const localWorkout = await createWorkoutAction(name);
          localDbId = localWorkout.id;
        } catch {
          // If local DB setup fails, we still keep app flow alive in Zustand
        }

        const workout: ActiveWorkout = {
          localDbId,
          serverId: null,
          name,
          routineId: routineId ?? null,
          startedAt: now,
          sets: [],
          notes: '',
        };

        set({
          isActive: true,
          isPaused: false,
          activeWorkout: workout,
          pausedAt: null,
          totalPausedMs: 0,
          elapsedSeconds: 0,
        });

        // Sync with backend (non-blocking — the workout is already active locally)
        try {
          const res = await api<{ id: string }>('/workouts/start', {
            method: 'POST',
            body: { name, routineId },
          });
          set((s) => ({
            activeWorkout: s.activeWorkout
              ? { ...s.activeWorkout, serverId: res.id }
              : null,
          }));
        } catch {
          // Offline — we'll sync later
        }
      },

      pauseWorkout: () => {
        if (!get().isActive || get().isPaused) return;
        set({ isPaused: true, pausedAt: Date.now() });
      },

      resumeWorkout: () => {
        const { isPaused, pausedAt, totalPausedMs } = get();
        if (!isPaused || !pausedAt) return;
        const additionalPause = Date.now() - pausedAt;
        set({
          isPaused: false,
          pausedAt: null,
          totalPausedMs: totalPausedMs + additionalPause,
        });
      },

      addSet: async (input) => {
        const state = get();
        if (!state.isActive || !state.activeWorkout) return;

        const newSet: WorkoutSet = {
          localId: localId(),
          ...input,
          syncedAt: null,
        };

        // Persist set in local WatermelonDB first (reactive source of truth)
        const localWorkoutId = state.activeWorkout.localDbId;
        if (localWorkoutId) {
          try {
            const localSet = await addSetToWorkoutByExerciseNameAction({
              workoutId: localWorkoutId,
              exerciseName: input.exerciseName,
              weight: input.weightKg ?? 0,
              reps: input.reps ?? 0,
              rpe: input.rpe ?? 0,
              isCompleted: input.completed,
            });
            newSet.dbSetId = localSet.id;
          } catch {
            // non-fatal, keep local Zustand row
          }
        }

        set((s) => ({
          activeWorkout: s.activeWorkout
            ? { ...s.activeWorkout, sets: [...s.activeWorkout.sets, newSet] }
            : null,
        }));

        // Sync to backend if we have a server ID
        const serverId = get().activeWorkout?.serverId;
        if (serverId) {
          try {
            await api(`/workouts/${serverId}/sets`, {
              method: 'POST',
              body: {
                exerciseId: input.exerciseId,
                setNumber: input.setNumber,
                weightKg: input.weightKg,
                reps: input.reps,
                rpe: input.rpe,
              },
            });
            set((s) => ({
              activeWorkout: s.activeWorkout
                ? {
                    ...s.activeWorkout,
                    sets: s.activeWorkout.sets.map((st) =>
                      st.localId === newSet.localId
                        ? { ...st, syncedAt: new Date().toISOString() }
                        : st,
                    ),
                  }
                : null,
            }));
          } catch {
            // Offline — set is saved locally, will sync later
          }
        }
      },

      removeSet: (lid) => {
        const setToRemove = get().activeWorkout?.sets.find((st) => st.localId === lid);
        if (setToRemove?.dbSetId) {
          removeSetAction(setToRemove.dbSetId).catch(() => {
            // keep UI responsive even if DB delete fails
          });
        }
        set((s) => ({
          activeWorkout: s.activeWorkout
            ? {
                ...s.activeWorkout,
                sets: s.activeWorkout.sets.filter((st) => st.localId !== lid),
              }
            : null,
        }));
      },

      updateNotes: (notes) => {
        set((s) => ({
          activeWorkout: s.activeWorkout
            ? { ...s.activeWorkout, notes }
            : null,
        }));
      },

      finishWorkout: async (notes) => {
        const state = get();
        if (!state.activeWorkout) throw new Error('No active workout');

        // Mark local workout as completed in WatermelonDB
        if (state.activeWorkout.localDbId) {
          await finishWorkoutAction(state.activeWorkout.localDbId).catch(() => {});
        }

        const serverId = state.activeWorkout.serverId;
        if (!serverId) throw new Error('Workout not synced to server');

        const result = await api<FinishResult>(`/workouts/${serverId}/finish`, {
          method: 'PATCH',
          body: { notes: notes ?? (state.activeWorkout.notes || undefined) },
        });

        set({
          isActive: false,
          isPaused: false,
          activeWorkout: null,
          pausedAt: null,
          totalPausedMs: 0,
          elapsedSeconds: 0,
        });

        return result;
      },

      discardWorkout: () => {
        const localDbId = get().activeWorkout?.localDbId;
        if (localDbId) {
          discardWorkoutAction(localDbId).catch(() => {});
        }
        set({
          isActive: false,
          isPaused: false,
          activeWorkout: null,
          pausedAt: null,
          totalPausedMs: 0,
          elapsedSeconds: 0,
        });
      },

      tick: () => {
        const { isActive, isPaused, activeWorkout, totalPausedMs, pausedAt } = get();
        if (!isActive || isPaused || !activeWorkout) return;
        set({ elapsedSeconds: computeElapsed(activeWorkout.startedAt, totalPausedMs, pausedAt) });
      },
    }),
    {
      name: 'plates-workout',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isActive: state.isActive,
        isPaused: state.isPaused,
        activeWorkout: state.activeWorkout,
        pausedAt: state.pausedAt,
        totalPausedMs: state.totalPausedMs,
      }),
    },
  ),
);
