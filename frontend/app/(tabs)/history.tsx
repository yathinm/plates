import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SyncPlateIndicator } from '@/components/SyncPlateIndicator';
import WorkoutHistoryList from '@/components/WorkoutHistoryList';

export default function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gym-black" edges={['top']}>
      <View className="flex-row items-start justify-between gap-3 px-5 pt-2">
        <View className="flex-1 min-w-0">
          <Text className="text-3xl font-bold text-zinc-100 mb-2">History</Text>
          <Text className="text-gym-muted text-base mb-4">
            Your training timeline, volume charts, and PRs.
          </Text>
        </View>
        <SyncPlateIndicator />
      </View>

      <View className="flex-1 min-h-0">
        <WorkoutHistoryList />
      </View>
    </SafeAreaView>
  );
}
