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
  workout: Workout;
  exercises: Exercise[];
  sets: SetModel[];
};

type OuterProps = {
  workoutId: string;
  database: Database;
};

function WorkoutSummaryBase({ workout, exercises, sets }: BaseProps) {
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
    workout: database.get<Workout>('workouts').findAndObserve(workoutId),
    exercises: database
      .get<Exercise>('exercises')
      .query(Q.where('workout_id', workoutId))
      .observe(),
    // Simple global sets observation; filtered client-side by exercise_id
    sets: database.get<SetModel>('sets').query().observe(),
  }))(WorkoutSummaryBase as any),
);

export default Enhanced as React.ComponentType<{ workoutId: string }>;
