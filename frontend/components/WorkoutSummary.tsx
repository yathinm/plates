import React from 'react';
import { View, Text } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';

import type Workout from '@/src/db/models/workout';
import type Exercise from '@/src/db/models/exercise';
import type SetModel from '@/src/db/models/set';

type BaseProps = {
  /** 0 or 1 row — query-based observe never throws if the row was wiped (e.g. DB reset while Zustand still had `localDbId`). */
  workouts: Workout[];
  exercises: Exercise[];
  sets: SetModel[];
};

type OuterProps = {
  workoutId: string;
  database: Database;
};

function WorkoutSummaryBase({ workouts, exercises, sets }: BaseProps) {
  const workout = workouts[0];
  if (!workout) {
    return (
      <View className="bg-gym-dark rounded-lg p-3 border border-gym-border">
        <Text className="text-gym-muted text-xs mb-1">Local database</Text>
        <Text className="text-warning text-sm">
          No workout row for this session (data may have been reset). Sets above still use the live
          session; start a new workout after finishing to sync again.
        </Text>
      </View>
    );
  }

  const exerciseIds = new Set(exercises.map((e) => e.id));
  const scopedSets = sets.filter((s: any) => exerciseIds.has(s._raw.exercise_id));
  const totalSets = scopedSets.length;
  const totalVolume = scopedSets.reduce(
    (sum, s: any) => sum + (s.weight ?? 0) * (s.reps ?? 0),
    0,
  );

  return (
    <View className="bg-gym-dark rounded-lg p-3 border border-gym-border">
      <Text className="text-gym-muted text-xs mb-1">Reactive Summary (WatermelonDB)</Text>
      <Text className="text-zinc-100 text-sm font-semibold" numberOfLines={1}>
        {workout.name}
      </Text>
      <Text className="text-zinc-400 text-xs mt-1">
        {exercises.length} exercises • {totalSets} sets • {Math.round(totalVolume)} kg
      </Text>
      <Text className="text-gym-muted text-[11px] mt-1">
        Updates automatically when sets are added/deleted.
      </Text>
    </View>
  );
}

const Enhanced = withDatabase(
  withObservables(['workoutId', 'database'], ({ workoutId, database }: OuterProps) => ({
    workouts: database
      .get<Workout>('workouts')
      .query(Q.where('id', workoutId))
      .observe(),
    exercises: database
      .get<Exercise>('exercises')
      .query(Q.where('workout_id', workoutId))
      .observe(),
    sets: database.get<SetModel>('sets').query().observe(),
  }))(WorkoutSummaryBase as any),
);

export default Enhanced as React.ComponentType<{ workoutId: string }>;
