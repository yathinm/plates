import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '@/stores/workout';

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
  const router = useRouter();

  function openLogger() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/workout/active');
  }

  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      <Text className="text-3xl font-bold text-zinc-100 mb-2">Plates</Text>
      <Text className="text-gym-muted text-base mb-10">
        {isActive ? 'You have an active session.' : 'Ready to lift? Start a new session or pick a routine.'}
      </Text>

      {/* Active workout card */}
      {isActive && workout ? (
        <Pressable
          onPress={openLogger}
          className="bg-gym-dark rounded-2xl border border-gym-border p-5 mb-6 active:opacity-90"
          style={{
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 4,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View
                className="w-2.5 h-2.5 rounded-full mr-2.5"
                style={{ backgroundColor: isPaused ? '#F59E0B' : '#22C55E' }}
              />
              <Text className="text-zinc-100 text-lg font-bold">{workout.name}</Text>
            </View>
            <Text
              className="font-mono text-lg"
              style={{ color: isPaused ? '#F59E0B' : '#F4F4F5' }}
            >
              {formatTime(elapsed)}
            </Text>
          </View>

          {/* Mini stats */}
          <View className="flex-row mb-4">
            <View className="flex-1">
              <Text className="text-gym-muted text-xs">Sets</Text>
              <Text className="text-zinc-200 text-base font-semibold">{workout.sets.length}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gym-muted text-xs">Volume</Text>
              <Text className="text-zinc-200 text-base font-semibold">
                {workout.sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0) > 0
                  ? `${Math.round(workout.sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0))} kg`
                  : '—'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gym-muted text-xs">Last</Text>
              <Text className="text-zinc-200 text-base font-semibold" numberOfLines={1}>
                {workout.sets.length > 0
                  ? workout.sets[workout.sets.length - 1].exerciseName
                  : '—'}
              </Text>
            </View>
          </View>

          <View className="bg-brand-electric rounded-xl py-3 items-center">
            <Text className="text-white font-semibold">Continue Workout</Text>
          </View>
        </Pressable>
      ) : (
        <>
          <Pressable
            className="bg-brand-electric rounded-2xl py-4 px-6 items-center mb-4 active:opacity-80"
            onPress={() => start()}
          >
            <Text className="text-white text-lg font-semibold">Start Empty Workout</Text>
          </Pressable>

          <Pressable className="bg-gym-slate rounded-2xl py-4 px-6 items-center border border-gym-border active:opacity-80">
            <Text className="text-zinc-300 text-lg font-semibold">Choose a Routine</Text>
          </Pressable>
        </>
      )}

      {/* Recent sessions */}
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
