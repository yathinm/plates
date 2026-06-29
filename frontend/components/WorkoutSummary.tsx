import React from 'react';
import { View, Text } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';

import type Workout from '@/src/db/models/workout';
import type Exercise from '@/src/db/models/exercise';
import type SetModel from '@/src/db/models/set';
import { Panel, SectionLabel } from '@/components/ui';

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
      <Panel className="p-4">
        <SectionLabel>Local database</SectionLabel>
        <Text className="text-warning text-sm leading-5">
          No workout row for this session (data may have been reset). Sets above still use the live
          session; start a new workout after finishing to sync again.
        </Text>
      </Panel>
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
    <Panel className="p-4">
      <SectionLabel>Reactive summary</SectionLabel>
      <Text className="text-uber-black text-base font-semibold" numberOfLines={1}>
        {workout.name}
      </Text>
      <Text className="text-uber-gray700 text-sm mt-1">
        {exercises.length} exercises • {totalSets} sets • {Math.round(totalVolume)} kg
      </Text>
      <Text className="text-uber-gray700 text-xs mt-2">
        Updates automatically when sets are added/deleted.
      </Text>
    </Panel>
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
