import { View } from 'react-native';

import { PageHeader, ResponsiveContent, Screen } from '@/components/ui';
import { SyncPlateIndicator } from '@/components/SyncPlateIndicator';
import WorkoutHistoryList from '@/components/WorkoutHistoryList';

export default function HistoryScreen() {
  return (
    <Screen padded={false}>
      <ResponsiveContent className="flex-1 px-5" maxWidth={1040}>
        <PageHeader
          eyebrow="History"
          title="Training timeline"
          subtitle="Review completed sessions, spot consistency, and reopen details without digging."
          right={
            <View className="pt-2">
              <SyncPlateIndicator />
            </View>
          }
        />

        <View className="flex-1 min-h-0">
          <WorkoutHistoryList />
        </View>
      </ResponsiveContent>
    </Screen>
  );
}
