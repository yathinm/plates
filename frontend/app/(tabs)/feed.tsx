import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { PageHeader, Panel, ResponsiveContent, Screen, SectionLabel } from '@/components/ui';
import { useAuth } from '@/stores/auth';

export default function FeedScreen() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  const initials = (user?.displayName ?? user?.username ?? 'P')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Screen>
      <ResponsiveContent className="flex-1" maxWidth={1040}>
        <PageHeader
          eyebrow="Feed"
          title="Your lifting network"
          subtitle="A simple social surface for active sessions, completed lifts, and encouragement."
          right={
            <Pressable
              className="w-11 h-11 rounded-full bg-uber-black items-center justify-center active:opacity-80"
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Text className="text-uber-white text-sm font-bold">{initials}</Text>
            </Pressable>
          }
        />

        <View className={isWide ? 'flex-row gap-5' : ''}>
          <Panel className={isWide ? 'flex-1 p-5' : 'p-5 mb-5'}>
            <SectionLabel>Currently lifting</SectionLabel>
            <View className="bg-uber-gray050 rounded-[10px] border border-uber-gray200 px-5 py-8 items-center">
              <Text className="text-uber-black text-lg font-semibold mb-2">Quiet right now</Text>
              <Text className="text-uber-gray700 text-sm text-center leading-5">
                Active friends will appear here with live exercise and set counts.
              </Text>
            </View>
          </Panel>

          <Panel className={isWide ? 'flex-1 p-5' : 'p-5'}>
            <SectionLabel>Recent activity</SectionLabel>
            {['Follow athletes', 'Share completed workouts', 'React to personal records'].map((item) => (
              <View key={item} className="flex-row items-center border-t border-uber-gray200 py-4">
                <View className="w-2 h-2 rounded-full bg-uber-black mr-3" />
                <Text className="text-uber-ink text-base flex-1">{item}</Text>
              </View>
            ))}
          </Panel>
        </View>
      </ResponsiveContent>
    </Screen>
  );
}
