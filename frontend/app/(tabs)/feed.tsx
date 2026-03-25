import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/stores/auth';

export default function FeedScreen() {
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
      {/* Header row with avatar */}
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text className="text-3xl font-bold text-zinc-100">Feed</Text>
          <Text className="text-gym-muted text-sm">
            See who's lifting right now.
          </Text>
        </View>
        <Pressable
          className="w-10 h-10 rounded-full bg-brand-electric items-center justify-center active:opacity-80"
          onPress={logout}
        >
          <Text className="text-white text-sm font-bold">{initials}</Text>
        </Pressable>
      </View>

      {/* Currently lifting */}
      <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
        Currently Lifting
      </Text>
      <View className="bg-gym-dark rounded-xl p-6 border border-gym-border items-center mb-6">
        <Text className="text-zinc-500 text-sm">
          None of your friends are lifting right now.
        </Text>
      </View>

      {/* Recent activity */}
      <Text className="text-zinc-400 text-xs uppercase tracking-widest mb-3">
        Recent Activity
      </Text>
      <View className="bg-gym-dark rounded-xl p-6 border border-gym-border items-center">
        <Text className="text-zinc-500 text-sm">
          Activity from friends will appear here.
        </Text>
      </View>
    </View>
  );
}
