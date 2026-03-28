import { View, Text, Pressable, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as Haptics from 'expo-haptics';
import { brand, gym } from '@/constants/Colors';

/** Font Awesome 6 solid icon names (same glyphs as Font Awesome / react-icons FA set; RN uses Expo’s font bundle). */
const TAB_ICONS: Record<string, string> = {
  feed: 'users',
  history: 'clock-rotate-left',
  index: 'dumbbell',
  analytics: 'chart-column',
};

const LABEL_MAP: Record<string, string> = {
  feed: 'Feed',
  history: 'History',
  index: 'Workout',
  analytics: 'Analytics',
};

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View
      className="flex-row items-end bg-gym-dark border-t border-gym-border"
      style={{ paddingBottom: Platform.OS === 'ios' ? 24 : 8 }}
    >
      {state.routes.map((route, idx) => {
        const isFocused = state.index === idx;
        const label = LABEL_MAP[route.name] ?? route.name;
        const iconName = TAB_ICONS[route.name] ?? 'circle';
        const iconColor = isFocused ? brand.electric : gym.muted;

        function onPress() {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }

        function onLongPress() {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.emit({ type: 'tabLongPress', target: route.key });
        }

        return (
          <Pressable
            key={route.key}
            className="flex-1 items-center pt-2 pb-1"
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={label}
          >
            <FontAwesome6
              name={iconName as React.ComponentProps<typeof FontAwesome6>['name']}
              solid
              size={22}
              color={iconColor}
              style={{ marginBottom: 4 }}
            />
            <Text className="text-xs" style={{ color: iconColor }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
