import { Pressable, Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';

import { useWorkoutStore } from '@/stores/workout';
import { brand, gym } from '@/constants/Colors';
import { TAB_BAR_HEIGHT, OVERLAY_HEIGHT } from '@/constants/Layout';

function formatCompact(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ActiveWorkoutOverlay() {
  const isActive = useWorkoutStore((s) => s.isActive);
  const isPaused = useWorkoutStore((s) => s.isPaused);
  const workout = useWorkoutStore((s) => s.activeWorkout);
  const elapsed = useWorkoutStore((s) => s.elapsedSeconds);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);

  const router = useRouter();
  const segments = useSegments();

  // Hide on the Workout tab (full card shown there) and when the logger modal is open
  const onWorkoutTab = segments[0] === '(tabs)' && segments.length === 1;
  const modalOpen = segments[0] === 'workout';
  const shouldShow = isActive && workout && !onWorkoutTab && !modalOpen;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(shouldShow ? 1 : 0, {
      damping: 20,
      stiffness: 200,
      mass: 0.8,
    });
  }, [shouldShow]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [OVERLAY_HEIGHT + 20, 0]) },
    ],
    opacity: progress.value,
    pointerEvents: progress.value > 0.1 ? 'auto' as const : 'none' as const,
  }));

  if (!workout) return null;

  const lastSet = workout.sets[workout.sets.length - 1];
  const currentExercise = lastSet?.exerciseName ?? 'No exercise yet';
  const setCount = workout.sets.length;

  function navigateToWorkout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/workout/active');
  }

  async function handleFinish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await finishWorkout();
    } catch {
      // handled by the full workout screen
    }
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: TAB_BAR_HEIGHT,
          left: 0,
          right: 0,
          height: OVERLAY_HEIGHT,
          zIndex: 100,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={navigateToWorkout}
        className="flex-1 mx-3 rounded-2xl flex-row items-center px-4 overflow-hidden"
        style={{
          backgroundColor: gym.slate,
          borderWidth: 1,
          borderColor: gym.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        {/* Pulsing dot */}
        <View
          className="w-2.5 h-2.5 rounded-full mr-3"
          style={{ backgroundColor: isPaused ? '#F59E0B' : '#22C55E' }}
        />

        {/* Info */}
        <View className="flex-1 mr-3">
          <Text className="text-zinc-100 text-sm font-semibold" numberOfLines={1}>
            {workout.name}
          </Text>
          <Text className="text-zinc-400 text-xs" numberOfLines={1}>
            {currentExercise} · {setCount} {setCount === 1 ? 'set' : 'sets'}
          </Text>
        </View>

        {/* Timer */}
        <Text
          className="font-mono text-base mr-4"
          style={{ color: isPaused ? '#F59E0B' : '#F4F4F5' }}
        >
          {formatCompact(elapsed)}
        </Text>

        {/* Finish button */}
        <Pressable
          onPress={handleFinish}
          className="bg-success/20 border border-success/40 rounded-xl px-4 py-2 active:opacity-80"
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text className="text-success text-xs font-bold">FINISH</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
