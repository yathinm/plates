import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { gym, brand } from '@/constants/Colors';
import { useAuth } from '@/stores/auth';

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

  // Hydrate auth state from SecureStore on mount
  useEffect(() => {
    hydrate();
  }, []);

  // Hide splash once both fonts AND auth hydration are done
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

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Not signed in and not on an auth screen → redirect to login
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Signed in but still on auth screen → redirect to tabs
      router.replace('/(tabs)');
    }
  }, [token, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? PlatesDark : PlatesLight}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
