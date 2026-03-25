import { View, Text, Pressable } from 'react-native';
import { useWorkoutStore } from '@/stores/workout';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function WorkoutScreen() {
  const isActive = useWorkoutStore((s) => s.isActive);
  const isPaused = useWorkoutStore((s) => s.isPaused);
  const workout = useWorkoutStore((s) => s.activeWorkout);
  const elapsed = useWorkoutStore((s) => s.elapsedSeconds);

  const start = useWorkoutStore((s) => s.startWorkout);
  const pause = useWorkoutStore((s) => s.pauseWorkout);
  const resume = useWorkoutStore((s) => s.resumeWorkout);
  const finish = useWorkoutStore((s) => s.finishWorkout);
  const discard = useWorkoutStore((s) => s.discardWorkout);

  useWorkoutTimer();

  if (isActive && workout) {
    return <ActiveView
      workout={workout}
      elapsed={elapsed}
      isPaused={isPaused}
      onPause={pause}
      onResume={resume}
      onFinish={finish}
      onDiscard={discard}
    />;
  }

  return <LauncherView onStart={start} />;
}

// ── Launcher (no active workout) ────────────────────────────────

function LauncherView({ onStart }: { onStart: (name?: string) => Promise<void> }) {
  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      <Text className="text-3xl font-bold text-zinc-100 mb-2">Plates</Text>
      <Text className="text-gym-muted text-base mb-10">
        Ready to lift? Start a new session or pick a routine.
      </Text>

      <Pressable
        className="bg-brand-electric rounded-2xl py-4 px-6 items-center mb-4 active:opacity-80"
        onPress={() => onStart()}
      >
        <Text className="text-white text-lg font-semibold">Start Empty Workout</Text>
      </Pressable>

      <Pressable className="bg-gym-slate rounded-2xl py-4 px-6 items-center border border-gym-border active:opacity-80">
        <Text className="text-zinc-300 text-lg font-semibold">Choose a Routine</Text>
      </Pressable>

      <View className="mt-10">
        <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
          Recent Sessions
        </Text>
        <View className="bg-gym-dark rounded-xl p-4 border border-gym-border">
          <Text className="text-gym-muted text-sm text-center">
            No workouts yet — hit the button above!
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Active workout view ─────────────────────────────────────────

interface ActiveViewProps {
  workout: NonNullable<ReturnType<typeof useWorkoutStore.getState>['activeWorkout']>;
  elapsed: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => Promise<any>;
  onDiscard: () => void;
}

function ActiveView({ workout, elapsed, isPaused, onPause, onResume, onFinish, onDiscard }: ActiveViewProps) {
  const setCount = workout.sets.filter((s) => s.completed).length;
  const totalVolume = workout.sets
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);

  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-3xl font-bold text-zinc-100">{workout.name}</Text>
        {isPaused && (
          <View className="bg-warning/20 rounded-full px-3 py-1">
            <Text className="text-warning text-xs font-semibold">PAUSED</Text>
          </View>
        )}
      </View>

      {/* Timer */}
      <Text
        className="font-mono text-5xl mb-6"
        style={{ color: isPaused ? '#F59E0B' : '#F4F4F5' }}
      >
        {formatTime(elapsed)}
      </Text>

      {/* Live stats */}
      <View className="flex-row mb-6">
        <View className="flex-1 bg-gym-dark rounded-xl p-4 mr-2 border border-gym-border">
          <Text className="text-gym-muted text-xs uppercase mb-1">Sets</Text>
          <Text className="text-zinc-100 text-2xl font-bold">{setCount}</Text>
        </View>
        <View className="flex-1 bg-gym-dark rounded-xl p-4 ml-2 border border-gym-border">
          <Text className="text-gym-muted text-xs uppercase mb-1">Volume</Text>
          <Text className="text-zinc-100 text-2xl font-bold">
            {totalVolume > 0 ? `${totalVolume.toLocaleString()} kg` : '—'}
          </Text>
        </View>
      </View>

      {/* Set list */}
      <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
        Sets logged
      </Text>
      {workout.sets.length === 0 ? (
        <View className="bg-gym-dark rounded-xl p-4 border border-gym-border mb-6">
          <Text className="text-gym-muted text-sm text-center">
            Add an exercise and log your first set.
          </Text>
        </View>
      ) : (
        <View className="bg-gym-dark rounded-xl border border-gym-border mb-6 overflow-hidden">
          {workout.sets.map((s, i) => (
            <View
              key={s.localId}
              className={`flex-row items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-gym-border' : ''}`}
            >
              <View className="flex-1">
                <Text className="text-zinc-200 text-sm font-medium">{s.exerciseName}</Text>
                <Text className="text-gym-muted text-xs">Set {s.setNumber}</Text>
              </View>
              <Text className="text-zinc-300 text-sm font-mono">
                {s.weightKg ?? 0}kg × {s.reps ?? 0}
              </Text>
              {s.syncedAt ? (
                <Text className="text-success text-xs ml-3">✓</Text>
              ) : (
                <Text className="text-warning text-xs ml-3">↑</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Controls */}
      <View className="flex-row mb-4">
        {isPaused ? (
          <Pressable
            className="flex-1 bg-brand-electric rounded-xl py-3.5 items-center mr-2 active:opacity-80"
            onPress={onResume}
          >
            <Text className="text-white font-semibold">Resume</Text>
          </Pressable>
        ) : (
          <Pressable
            className="flex-1 bg-warning/20 border border-warning/40 rounded-xl py-3.5 items-center mr-2 active:opacity-80"
            onPress={onPause}
          >
            <Text className="text-warning font-semibold">Pause</Text>
          </Pressable>
        )}
        <Pressable
          className="flex-1 bg-success/20 border border-success/40 rounded-xl py-3.5 items-center ml-2 active:opacity-80"
          onPress={() => onFinish()}
        >
          <Text className="text-success font-semibold">Finish</Text>
        </Pressable>
      </View>

      <Pressable
        className="py-3 items-center active:opacity-80"
        onPress={onDiscard}
      >
        <Text className="text-danger/60 text-sm">Discard Workout</Text>
      </Pressable>
    </View>
  );
}
