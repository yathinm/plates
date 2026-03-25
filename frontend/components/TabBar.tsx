import { View, Text, Pressable, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { brand, gym } from '@/constants/Colors';

const ICON_MAP: Record<string, string> = {
  feed:      '👥',
  history:   '🕒',
  index:     '🏋️',
  analytics: '📊',
};

const LABEL_MAP: Record<string, string> = {
  feed:      'Feed',
  history:   'History',
  index:     'Workout',
  analytics: 'Analytics',
};

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View
      className="flex-row items-end bg-gym-dark border-t border-gym-border"
      style={{ paddingBottom: Platform.OS === 'ios' ? 24 : 8 }}
    >
      {state.routes.map((route, idx) => {
        const isFocused = state.index === idx;
        const isCenter = route.name === 'index';
        const label = LABEL_MAP[route.name] ?? route.name;
        const icon = ICON_MAP[route.name] ?? '•';

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

        if (isCenter) {
          return (
            <Pressable
              key={route.key}
              className="flex-1 items-center"
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
            >
              <View
                className="items-center justify-center rounded-full -mt-5 mb-1"
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: isFocused ? brand.electric : gym.slate,
                  shadowColor: brand.electric,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isFocused ? 0.5 : 0,
                  shadowRadius: 12,
                  elevation: isFocused ? 8 : 0,
                }}
              >
                <Text style={{ fontSize: 24 }}>{icon}</Text>
              </View>
              <Text
                className="text-xs"
                style={{ color: isFocused ? brand.electric : gym.muted }}
              >
                {label}
              </Text>
            </Pressable>
          );
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
            <Text style={{ fontSize: 20, marginBottom: 2 }}>{icon}</Text>
            <Text
              className="text-xs"
              style={{ color: isFocused ? brand.electric : gym.muted }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
