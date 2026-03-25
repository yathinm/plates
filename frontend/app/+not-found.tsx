import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 bg-gym-black items-center justify-center px-6">
        <Text className="text-zinc-100 text-xl font-bold mb-4">
          This screen doesn't exist.
        </Text>
        <Link href="/">
          <Text className="text-brand-electric text-sm">Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}
