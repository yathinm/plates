import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Link, router } from 'expo-router';

import { Field, Panel, PrimaryButton, ResponsiveContent, SectionLabel } from '@/components/ui';
import { useAuth } from '@/stores/auth';
import { ApiError } from '@/utils/api';

export default function LoginScreen() {
  const login = useAuth((s) => s.login);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  async function handleLogin() {
    if (!identifier.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-uber-gray050"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ResponsiveContent className="flex-1 justify-center px-5 py-8" maxWidth={1040}>
        <View className={isWide ? 'flex-row items-center gap-8' : ''}>
          <View className={isWide ? 'flex-1 pr-6' : 'mb-8'}>
            <SectionLabel>Training operations</SectionLabel>
            <Text
              className="text-uber-black font-bold"
              style={{
                fontSize: isWide ? 64 : 48,
                lineHeight: isWide ? 66 : 50,
                letterSpacing: -1,
              }}
            >
              Plates
            </Text>
            <Text className="text-uber-ink text-lg leading-7 mt-4 max-w-[430px]">
              Log workouts fast, keep every set organized, and stay focused on the next lift.
            </Text>
            <View className="flex-row flex-wrap gap-3 mt-7">
              {['Offline-first', 'Fast logging', 'Live sync'].map((item) => (
                <View key={item} className="bg-uber-white border border-uber-gray200 rounded-[10px] px-3 py-2">
                  <Text className="text-uber-gray700 text-xs font-semibold">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <Panel className={isWide ? 'w-[420px] p-6' : 'p-5'}>
            <Text className="text-uber-black text-2xl font-semibold mb-1">Sign in</Text>
            <Text className="text-uber-gray700 text-sm leading-5 mb-5">
              Use your username or email to continue.
            </Text>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 mb-4">
                <Text className="text-danger text-sm">{error}</Text>
              </View>
            ) : null}

            <Field
              label="Account"
              placeholder="Username or email"
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
            />

            <Field
              label="Password"
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <PrimaryButton
              className="mt-2 mb-5"
              onPress={handleLogin}
              disabled={loading || !identifier.trim() || !password}
              loading={loading}
            >
              Log in
            </PrimaryButton>

            <View className="flex-row justify-center">
              <Text className="text-uber-gray700 text-sm">New to Plates? </Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable hitSlop={8}>
                  <Text className="text-uber-black text-sm font-semibold">Create account</Text>
                </Pressable>
              </Link>
            </View>
            <Text className="text-uber-gray700 text-xs text-center mt-5">
              Local demo: alex_lifts / password123
            </Text>
          </Panel>
        </View>
      </ResponsiveContent>
    </KeyboardAvoidingView>
  );
}
