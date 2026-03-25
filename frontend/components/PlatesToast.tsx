import { View, Text, Pressable } from 'react-native';
import Toast, { type ToastConfigParams } from 'react-native-toast-message';

import { gym, status } from '@/constants/Colors';

function SuccessToast({ text1, text2, onPress }: ToastConfigParams<object>) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 rounded-xl border border-gym-border bg-gym-dark px-4 py-3 shadow-lg"
      style={{
        borderColor: gym.border,
        backgroundColor: gym.dark,
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <View className="flex-row items-center gap-2">
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: status.success }}
        />
        <View className="flex-1">
          {text1 ? (
            <Text className="text-base font-semibold text-zinc-100">{text1}</Text>
          ) : null}
          {text2 ? <Text className="mt-0.5 text-sm text-gym-muted">{text2}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const toastConfig = {
  success: (props: ToastConfigParams<object>) => <SuccessToast {...props} />,
};

/**
 * Root toast host + Plates-styled success row (react-native-toast-message).
 */
export function PlatesToast() {
  return (
    <Toast
      config={toastConfig}
      topOffset={56}
      visibilityTime={2800}
    />
  );
}
