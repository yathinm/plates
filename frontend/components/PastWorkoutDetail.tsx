import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import withObservables from '@nozbe/with-observables';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type Workout from '@/src/db/models/workout';
import type Exercise from '@/src/db/models/exercise';
import type SetModel from '@/src/db/models/set';

function formatFinishedAt(endTime: number | null): string {
  if (endTime == null) return '—';
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
  if (end == null) return '';
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
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
      <View className="flex-1 bg-gym-black px-5" style={{ paddingTop: insets.top }}>
        <Pressable onPress={() => router.back()} className="py-3" hitSlop={12}>
          <Text className="text-brand-electric text-base">← Back</Text>
        </Pressable>
        <Text className="text-zinc-400 mt-6 text-base">This workout could not be found.</Text>
      </View>
    );
  }

  const exerciseIds = new Set(exercises.map((e) => e.id));
  const scopedSets = sets.filter((s) => exerciseIds.has(s.exerciseId));

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
    <View key={workoutId} className="flex-1 bg-gym-black" style={{ paddingTop: insets.top }}>
      <Pressable onPress={() => router.back()} className="px-5 py-3" hitSlop={12}>
        <Text className="text-brand-electric text-base">← Back</Text>
      </Pressable>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-zinc-100 mb-1">{workout.name}</Text>
        <Text className="text-gym-muted text-sm mb-6">
          {formatFinishedAt(workout.endTime)}
          {workout.endTime != null
            ? ` · ${formatDurationMs(workout.startTime, workout.endTime)}`
            : ''}
        </Text>

        {sortedExercises.length === 0 ? (
          <Text className="text-zinc-500 text-sm">No exercises logged for this workout.</Text>
        ) : (
          sortedExercises.map((exercise) => {
            const exSets = scopedSets
              .filter((s) => s.exerciseId === exercise.id)
              .sort((a, b) => (a.setNumber ?? 0) - (b.setNumber ?? 0));
            return (
              <View key={exercise.id} className="mb-6">
                <Text className="text-zinc-300 text-sm font-semibold mb-2">
                  {displayName(exercise)}
                </Text>
                <View className="bg-gym-dark rounded-xl border border-gym-border overflow-hidden">
                  <View className="flex-row px-4 py-2 border-b border-gym-border">
                    <Text className="text-gym-muted text-xs w-10">SET</Text>
                    <Text className="text-gym-muted text-xs flex-1 text-center">KG</Text>
                    <Text className="text-gym-muted text-xs flex-1 text-center">REPS</Text>
                  </View>
                  {exSets.length === 0 ? (
                    <Text className="text-zinc-500 text-sm px-4 py-3">No sets</Text>
                  ) : (
                    exSets.map((s) => (
                      <View
                        key={s.id}
                        className="flex-row items-center px-4 py-3 border-b border-gym-border/50"
                      >
                        <Text className="text-zinc-400 text-sm w-10">{s.setNumber ?? '—'}</Text>
                        <Text className="text-zinc-100 text-sm flex-1 text-center font-mono">
                          {s.weight}
                        </Text>
                        <Text className="text-zinc-100 text-sm flex-1 text-center font-mono">
                          {s.reps}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
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
