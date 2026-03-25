import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { brand, gym } from '@/constants/Colors';
import { useSyncUi } from '@/stores/syncUi';

const SIZE = 28;

/**
 * Weight-plate glyph that spins while {@link useSyncUi} reports sync in progress (§4.4.5).
 * Symmetric at 0°/360° so linear repeat has no visible seam.
 */
export function SyncPlateIndicator() {
  const isSyncing = useSyncUi((s) => s.isSyncing);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!isSyncing) {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      return;
    }
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [isSyncing]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!isSyncing) {
    return null;
  }

  return (
    <View className="h-9 w-9 items-center justify-center" accessibilityLabel="Syncing workouts">
      <Animated.View style={spinStyle}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 32 32">
          <Circle
            cx={16}
            cy={16}
            r={12}
            fill="none"
            stroke={brand.electric}
            strokeWidth={3}
          />
          <Circle
            cx={16}
            cy={16}
            r={4.5}
            fill={gym.black}
            stroke={brand.electric}
            strokeWidth={2}
          />
          <Circle cx={16} cy={8} r={1.4} fill={brand.electric} />
          <Circle cx={22.5} cy={20} r={1.4} fill={brand.electric} />
          <Circle cx={9.5} cy={20} r={1.4} fill={brand.electric} />
        </Svg>
      </Animated.View>
    </View>
  );
}
