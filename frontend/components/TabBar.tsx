import { View, Text, Pressable, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as Haptics from 'expo-haptics';

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
      className="bg-uber-white border-t border-uber-gray200 px-2"
      style={{
        paddingBottom: Platform.OS === 'ios' ? 22 : 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 12,
      }}
    >
      <View className="flex-row items-center pt-2">
        {state.routes.map((route, idx) => {
          const isFocused = state.index === idx;
          const label = LABEL_MAP[route.name] ?? route.name;
          const iconName = TAB_ICONS[route.name] ?? 'circle';
          const iconColor = isFocused ? '#FFFFFF' : '#545454';

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
              className="flex-1 items-center justify-center py-2"
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
            >
              <View
                className={`items-center justify-center rounded-[10px] px-3 py-2 min-w-[64px] ${
                  isFocused ? 'bg-uber-black' : 'bg-uber-white'
                }`}
              >
                <FontAwesome6
                  name={iconName as React.ComponentProps<typeof FontAwesome6>['name']}
                  solid
                  size={18}
                  color={iconColor}
                  style={{ marginBottom: 3 }}
                />
                <Text
                  className={`text-[11px] font-semibold ${isFocused ? 'text-uber-white' : 'text-uber-gray700'}`}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
