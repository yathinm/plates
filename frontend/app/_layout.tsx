import '../polyfills/fix-dom-event-phase-descriptors';
import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';

import { useColorScheme } from '@/components/useColorScheme';
import { gym, brand } from '@/constants/Colors';
import { useAuth } from '@/stores/auth';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import ActiveWorkoutOverlay from '@/components/ActiveWorkoutOverlay';
import { PlatesToast } from '@/components/PlatesToast';
import { useSyncOnForeground } from '@/hooks/useSyncOnForeground';
import { database } from '@/src/db';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const PlatesDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary:      brand.electric,
    background:   gym.black,
    card:         gym.dark,
    text:         '#F4F4F5',
    border:       gym.border,
    notification: brand.electric,
  },
};

const PlatesLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary:    brand.electric,
    background: '#F4F4F5',
    card:       '#FFFFFF',
    text:       '#0A0A0F',
    border:     '#E4E4E7',
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const hydrate = useAuth((s) => s.hydrate);
  const isLoading = useAuth((s) => s.isLoading);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: gym.black, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={brand.electric} />
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const token = useAuth((s) => s.token);
  const segments = useSegments();
  const router = useRouter();

  // Single timer instance for the entire app — ticks the workout store every second
  useWorkoutTimer();

  useSyncOnForeground(database, Boolean(token));

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, segments]);

  return (
    <DatabaseProvider database={database}>
      <KeyboardProvider preload={false}>
        <ThemeProvider value={colorScheme === 'dark' ? PlatesDark : PlatesLight}>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="workout"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  gestureEnabled: true,
                  gestureDirection: 'vertical',
                }}
              />
              <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
            </Stack>

            {/* Mini-player overlay — visible on all tabs except Workout when a session is active */}
            {token && <ActiveWorkoutOverlay />}
            <PlatesToast />
          </View>
          <StatusBar style="light" />
        </ThemeProvider>
      </KeyboardProvider>
    </DatabaseProvider>
  );
}
