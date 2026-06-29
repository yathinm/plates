import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import withObservables from '@nozbe/with-observables';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';

import { Panel, SectionLabel } from '@/components/ui';
import type Workout from '@/src/db/models/workout';

type Props = {
  workouts: Workout[];
};

function formatFinishedAt(endTime: number | null): string {
  if (endTime == null) return 'In progress';
  try {
    return new Date(endTime).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
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
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return m === 0 ? `${sec % 60}s` : `${m}m`;
}

function WorkoutHistoryListBase({ workouts }: Props) {
  const router = useRouter();

  if (workouts.length === 0) {
    return (
      <Panel className="p-6 items-center">
        <View className="w-12 h-12 rounded-full bg-uber-gray050 border border-uber-gray200 items-center justify-center mb-4">
          <Text className="text-uber-black text-xl font-bold">0</Text>
        </View>
        <Text className="text-uber-black text-lg font-semibold mb-2">No completed sessions</Text>
        <Text className="text-uber-gray700 text-sm text-center leading-5">
          Finish a workout and it will land here with timing and session details.
        </Text>
      </Panel>
    );
  }

  return (
    <FlatList
      data={workouts}
      keyExtractor={(w) => w.id}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: w }) => (
        <Pressable
          onPress={() => router.push(`/workout/${w.id}`)}
          className="bg-uber-white rounded-2xl p-4 border border-uber-gray200 mb-3 active:opacity-80"
        >
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 min-w-0">
              <SectionLabel>{formatFinishedAt(w.endTime)}</SectionLabel>
              <Text className="text-uber-black text-lg font-semibold" numberOfLines={1}>
                {w.name}
              </Text>
            </View>
            {w.endTime != null ? (
              <View className="bg-uber-gray050 border border-uber-gray200 rounded-[10px] px-3 py-2">
                <Text className="text-uber-ink text-sm font-semibold">
                  {formatDurationMs(w.startTime, w.endTime)}
                </Text>
              </View>
            ) : null}
          </View>
        </Pressable>
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
