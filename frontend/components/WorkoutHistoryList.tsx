import React from 'react';
import { View, Text, FlatList } from 'react-native';
import withObservables from '@nozbe/with-observables';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';

import type Workout from '@/src/db/models/workout';

type Props = {
  workouts: Workout[];
};

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

function WorkoutHistoryListBase({ workouts }: Props) {
  if (workouts.length === 0) {
    return (
      <View className="mx-5 bg-gym-dark rounded-xl p-6 border border-gym-border items-center">
        <Text className="text-zinc-400 text-sm">
          Complete a workout to see your history here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={workouts}
      keyExtractor={(w) => w.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: w }) => (
        <View className="bg-gym-dark rounded-xl p-4 border border-gym-border mb-3">
          <Text className="text-zinc-100 text-base font-semibold" numberOfLines={1}>
            {w.name}
          </Text>
          <Text className="text-gym-muted text-xs mt-1">
            {formatFinishedAt(w.endTime)}
            {w.endTime != null ? ` · ${formatDurationMs(w.startTime, w.endTime)}` : ''}
          </Text>
        </View>
      )}
    />
  );
}

const Enhanced = withDatabase(
  withObservables(['database'], ({ database }: { database: Database }) => ({
    workouts: database
      .get<Workout>('workouts')
      .query(Q.where('status', 'completed'), Q.sortBy('end_time', Q.desc))
      .observe(),
  }))(WorkoutHistoryListBase as any),
);

export default Enhanced as React.ComponentType<Record<string, never>>;
