import { View, Text } from 'react-native';

export default function SocialScreen() {
  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      <Text className="text-3xl font-bold text-zinc-100 mb-2">Social</Text>
      <Text className="text-gym-muted text-base mb-8">
        See who's lifting right now and send them hype.
      </Text>

      <View className="mb-6">
        <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
          Currently Lifting
        </Text>
        <View className="bg-gym-dark rounded-xl p-6 border border-gym-border items-center">
          <Text className="text-zinc-500 text-sm">
            None of your friends are lifting right now.
          </Text>
        </View>
      </View>
    </View>
  );
}
