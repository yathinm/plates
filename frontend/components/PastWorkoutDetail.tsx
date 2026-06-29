import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import withObservables from '@nozbe/with-observables';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MetricTile, Panel, SectionLabel } from '@/components/ui';
import type Workout from '@/src/db/models/workout';
import type Exercise from '@/src/db/models/exercise';
import type SetModel from '@/src/db/models/set';

function formatFinishedAt(endTime: number | null): string {
  if (endTime == null) return 'In progress';
  try {
    return new Date(endTime).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatDurationMs(start: number, end: number | null): string {
  if (end == null) return '—';
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  const m = Math.floor(sec / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return m === 0 ? `${sec % 60}s` : `${m}m`;
}

type BaseProps = {
  workoutId: string;
  workouts: Workout[];
  exercises: Exercise[];
  sets: SetModel[];
};

function PastWorkoutDetailBase({ workoutId, workouts, exercises, sets }: BaseProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const workout = workouts[0];

  if (!workout) {
    return (
      <View className="flex-1 bg-uber-white px-5" style={{ paddingTop: insets.top }}>
        <Pressable onPress={() => router.back()} className="py-4" hitSlop={12}>
          <Text className="text-uber-black text-base font-semibold">Back</Text>
        </Pressable>
        <Text className="text-uber-gray700 mt-6 text-base">This workout could not be found.</Text>
      </View>
    );
  }

  const exerciseIds = new Set(exercises.map((e) => e.id));
  const scopedSets = sets.filter((s) => exerciseIds.has(s.exerciseId));
  const totalVolume = scopedSets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);

  const sortedExercises = [...exercises].sort((a, b) => {
    const minT = (exId: string) =>
      Math.min(
        ...scopedSets.filter((x) => x.exerciseId === exId).map((x) => x.performedAt ?? Infinity),
        Infinity,
      );
    const diff = minT(a.id) - minT(b.id);
    if (diff !== 0 && Number.isFinite(diff)) return diff;
    return (a.note || '').localeCompare(b.note || '');
  });

  const displayName = (ex: Exercise) => ex.note?.trim() || 'Exercise';

  return (
    <View key={workoutId} className="flex-1 bg-uber-white" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, maxWidth: 1040, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} className="py-4" hitSlop={12}>
          <Text className="text-uber-black text-base font-semibold">Back</Text>
        </Pressable>

        <SectionLabel>{formatFinishedAt(workout.endTime)}</SectionLabel>
        <Text className="text-uber-black text-4xl font-bold mb-4">{workout.name}</Text>

        <View className="flex-row gap-3 mb-6">
          <MetricTile label="Duration" value={formatDurationMs(workout.startTime, workout.endTime)} />
          <MetricTile label="Sets" value={scopedSets.length} />
          <MetricTile label="Volume" value={Math.round(totalVolume)} suffix="kg" />
        </View>

        {sortedExercises.length === 0 ? (
          <Panel className="p-6 items-center">
            <Text className="text-uber-gray700 text-sm">No exercises logged for this workout.</Text>
          </Panel>
        ) : (
          sortedExercises.map((exercise) => {
            const exSets = scopedSets
              .filter((s) => s.exerciseId === exercise.id)
              .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0));
            return (
              <View key={exercise.id} className="mb-6">
                <Text className="text-uber-black text-xl font-semibold mb-2">
                  {displayName(exercise)}
                </Text>
                <Panel className="overflow-hidden">
                  <View className="flex-row px-4 py-3 bg-uber-gray050 border-b border-uber-gray200">
                    <Text className="text-uber-gray700 text-xs font-semibold w-12">SET</Text>
                    <Text className="text-uber-gray700 text-xs font-semibold flex-1 text-center">KG</Text>
                    <Text className="text-uber-gray700 text-xs font-semibold flex-1 text-center">REPS</Text>
                  </View>
                  {exSets.length === 0 ? (
                    <Text className="text-uber-gray700 text-sm px-4 py-4">No sets</Text>
                  ) : (
                    exSets.map((s) => (
                      <View
                        key={s.id}
                        className="flex-row items-center px-4 py-4 border-b border-uber-gray200"
                      >
                        <Text className="text-uber-gray700 text-sm w-12">{s.setNumber ?? '—'}</Text>
                        <Text className="text-uber-black text-base flex-1 text-center font-mono">
                          {s.weight}
                        </Text>
                        <Text className="text-uber-black text-base flex-1 text-center font-mono">
                          {s.reps}
                        </Text>
                      </View>
                    ))
                  )}
                </Panel>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const Enhanced = withDatabase(
  withObservables(
    ['workoutId', 'database'],
    ({ workoutId, database }: { workoutId: string; database: Database }) => ({
      workouts: database.get<Workout>('workouts').query(Q.where('id', workoutId)).observe(),
      exercises: database
        .get<Exercise>('exercises')
        .query(Q.where('workout_id', workoutId))
        .observe(),
      sets: database.get<SetModel>('sets').query().observe(),
    }),
  )(PastWorkoutDetailBase as any),
);

export default Enhanced as React.ComponentType<{ workoutId: string }>;
