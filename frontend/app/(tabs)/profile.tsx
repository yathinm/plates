import { View, Text, Pressable } from 'react-native';

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      <Text className="text-3xl font-bold text-zinc-100 mb-2">Profile</Text>
      <Text className="text-gym-muted text-base mb-8">
        Your stats, settings, and account.
      </Text>

      <View className="bg-gym-dark rounded-xl p-5 border border-gym-border mb-4">
        <View className="flex-row items-center mb-4">
          <View className="w-14 h-14 rounded-full bg-brand-electric items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">P</Text>
          </View>
          <View>
            <Text className="text-zinc-100 text-lg font-semibold">Not signed in</Text>
            <Text className="text-gym-muted text-sm">Sign in to sync your data</Text>
          </View>
        </View>

        <Pressable className="bg-brand-electric rounded-xl py-3 items-center active:opacity-80">
          <Text className="text-white font-semibold">Sign In</Text>
        </Pressable>
      </View>
    </View>
  );
}
