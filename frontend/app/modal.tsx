import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

export default function ModalScreen() {
  return (
    <View className="flex-1 bg-gym-dark items-center justify-center px-6">
      <Text className="text-zinc-100 text-xl font-bold mb-2">Settings</Text>
      <Text className="text-gym-muted text-sm text-center">
        App settings, notifications, and preferences will live here.
      </Text>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
