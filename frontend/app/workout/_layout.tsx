import { Stack } from 'expo-router';
import { gym } from '@/constants/Colors';

export default function WorkoutModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: gym.black },
      }}
    >
      <Stack.Screen name="active" />
    </Stack>
  );
}
