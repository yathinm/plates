import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { MetricTile, PageHeader, Panel, PrimaryButton, ResponsiveContent, Screen, SecondaryButton, SectionLabel } from '@/components/ui';
import { useWorkoutStore } from '@/stores/workout';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function totalVolume(sets: { weightKg: number | null; reps: number | null }[]) {
  return sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
}

export default function WorkoutScreen() {
  const isActive = useWorkoutStore((s) => s.isActive);
  const isPaused = useWorkoutStore((s) => s.isPaused);
  const workout = useWorkoutStore((s) => s.activeWorkout);
  const elapsed = useWorkoutStore((s) => s.elapsedSeconds);
  const start = useWorkoutStore((s) => s.startWorkout);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  function openLogger() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/workout/active');
  }

  async function startEmpty() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await start('Strength Session');
    router.push('/workout/active');
  }

  const sets = workout?.sets ?? [];
  const volume = Math.round(totalVolume(sets));
  const lastSet = sets[sets.length - 1];

  return (
    <Screen>
      <ResponsiveContent className="flex-1" maxWidth={1120}>
        <PageHeader
          eyebrow="Workout"
          title="Start with the next set."
          subtitle={isActive ? 'You have a live training session. Continue logging without losing momentum.' : 'Launch a session, keep the form simple, and capture every useful rep.'}
        />

        <View className={isWide ? 'flex-row gap-5' : ''}>
          <Panel className={isWide ? 'flex-1 p-5' : 'p-5 mb-5'}>
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <SectionLabel>{isActive ? 'Live session' : 'Quick start'}</SectionLabel>
                <Text className="text-uber-black text-2xl font-semibold">
                  {isActive && workout ? workout.name : 'Empty workout'}
                </Text>
              </View>
              {isActive ? (
                <View className="bg-uber-successSoft rounded-full px-3 py-1">
                  <Text className="text-uber-success text-xs font-semibold">
                    {isPaused ? 'Paused' : 'Active'}
                  </Text>
                </View>
              ) : null}
            </View>

            {isActive && workout ? (
              <>
                <View className="bg-uber-black rounded-2xl px-5 py-5 mb-5">
                  <Text className="text-uber-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
                    Elapsed
                  </Text>
                  <Text className="text-uber-white font-mono text-5xl">{formatTime(elapsed)}</Text>
                </View>
                <View className="flex-row gap-3 mb-5">
                  <MetricTile label="Sets" value={sets.length} />
                  <MetricTile label="Volume" value={volume > 0 ? volume : '—'} suffix={volume > 0 ? 'kg' : undefined} />
                  <MetricTile label="Last" value={lastSet?.exerciseName ?? '—'} />
                </View>
                <PrimaryButton onPress={openLogger}>Continue workout</PrimaryButton>
              </>
            ) : (
              <>
                <Text className="text-uber-gray700 text-base leading-6 mb-5">
                  No templates required. Start clean, add exercises as you lift, and keep the flow moving.
                </Text>
                <PrimaryButton className="mb-3" onPress={startEmpty}>
                  Start empty workout
                </PrimaryButton>
                <SecondaryButton disabled>Choose a routine</SecondaryButton>
              </>
            )}
          </Panel>

          <View className={isWide ? 'w-[360px]' : ''}>
            <Panel className="p-5 mb-5">
              <SectionLabel>Today</SectionLabel>
              <Text className="text-uber-black text-xl font-semibold mb-4">Session checklist</Text>
              {['Warm up deliberately', 'Log working sets only', 'Finish with notes'].map((item, index) => (
                <View key={item} className="flex-row items-center py-3 border-t border-uber-gray200">
                  <View className="w-7 h-7 rounded-full bg-uber-gray050 border border-uber-gray200 items-center justify-center mr-3">
                    <Text className="text-uber-black text-xs font-semibold">{index + 1}</Text>
                  </View>
                  <Text className="text-uber-ink text-sm flex-1">{item}</Text>
                </View>
              ))}
            </Panel>

            <Panel className="p-5">
              <SectionLabel>Recent sessions</SectionLabel>
              <Text className="text-uber-gray700 text-sm leading-5">
                Completed workouts will appear here with duration, volume, and set counts.
              </Text>
              <Pressable
                onPress={() => router.push('/history')}
                className="mt-4 bg-uber-gray050 rounded-[10px] border border-uber-gray200 px-4 py-3 active:opacity-80"
              >
                <Text className="text-uber-black text-sm font-semibold">Open history</Text>
              </Pressable>
            </Panel>
          </View>
        </View>
      </ResponsiveContent>
    </Screen>
  );
}
