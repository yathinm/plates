import { View, Text, Pressable } from 'react-native';
import { useAuth } from '@/stores/auth';

export default function ProfileScreen() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const initials = (user?.displayName ?? user?.username ?? 'P')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View className="flex-1 bg-gym-black px-5 pt-14">
      <Text className="text-3xl font-bold text-zinc-100 mb-2">Profile</Text>
      <Text className="text-gym-muted text-base mb-8">
        Your stats, settings, and account.
      </Text>

      <View className="bg-gym-dark rounded-xl p-5 border border-gym-border mb-4">
        <View className="flex-row items-center mb-4">
          <View className="w-14 h-14 rounded-full bg-brand-electric items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-zinc-100 text-lg font-semibold">
              {user?.displayName ?? user?.username ?? 'Unknown'}
            </Text>
            <Text className="text-gym-muted text-sm">@{user?.username}</Text>
          </View>
        </View>

        <View className="h-px bg-gym-border mb-4" />

        <Pressable
          className="bg-gym-slate rounded-xl py-3 items-center border border-gym-border active:opacity-80"
          onPress={logout}
        >
          <Text className="text-danger font-semibold">Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}
