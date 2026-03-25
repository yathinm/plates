import { View, Text } from 'react-native';

export default function HistoryScreen() {
  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      <Text className="text-3xl font-bold text-zinc-100 mb-2">History</Text>
      <Text className="text-gym-muted text-base mb-8">
        Your training timeline, volume charts, and PRs.
      </Text>

      <View className="bg-gym-dark rounded-xl p-6 border border-gym-border items-center">
        <Text className="text-zinc-400 text-sm">
          Complete a workout to see your history here.
        </Text>
      </View>
    </View>
  );
}
