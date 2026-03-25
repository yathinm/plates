import { View, Text } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      <Text className="text-3xl font-bold text-zinc-100 mb-2">Analytics</Text>
      <Text className="text-gym-muted text-base mb-8">
        Volume trends, PR tracker, and muscle balance.
      </Text>

      {/* Volume chart placeholder */}
      <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
        Weekly Volume
      </Text>
      <View className="bg-gym-dark rounded-xl p-6 border border-gym-border items-center mb-6">
        <View className="flex-row items-end justify-between w-full h-24 px-2">
          {[0.3, 0.5, 0.8, 0.45, 0.9, 0.6, 0.2].map((h, i) => (
            <View
              key={i}
              className="bg-brand-electric/30 rounded-t"
              style={{ width: 28, height: `${h * 100}%` }}
            />
          ))}
        </View>
        <View className="flex-row justify-between w-full mt-2 px-1">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <Text key={i} className="text-zinc-500 text-xs w-7 text-center">
              {d}
            </Text>
          ))}
        </View>
      </View>

      {/* PR tracker placeholder */}
      <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
        Personal Records
      </Text>
      <View className="bg-gym-dark rounded-xl p-6 border border-gym-border items-center">
        <Text className="text-zinc-500 text-sm">
          Finish some workouts to track your PRs here.
        </Text>
      </View>
    </View>
  );
}
