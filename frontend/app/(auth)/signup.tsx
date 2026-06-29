import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Link, router } from 'expo-router';

import { Field, Panel, PrimaryButton, ResponsiveContent, SectionLabel } from '@/components/ui';
import { useAuth } from '@/stores/auth';
import { ApiError } from '@/utils/api';

export default function SignupScreen() {
  const signup = useAuth((s) => s.signup);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  async function handleSignup() {
    if (!username.trim() || !email.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      });
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
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-5 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <ResponsiveContent maxWidth={1040}>
          <View className={isWide ? 'flex-row items-center gap-8' : ''}>
            <View className={isWide ? 'flex-1 pr-6' : 'mb-8'}>
              <SectionLabel>Start tracking</SectionLabel>
              <Text
                className="text-uber-black font-bold"
                style={{
                  fontSize: isWide ? 56 : 42,
                  lineHeight: isWide ? 60 : 46,
                  letterSpacing: -0.8,
                }}
              >
                Build a clean training record.
              </Text>
              <Text className="text-uber-ink text-lg leading-7 mt-4 max-w-[430px]">
                Create a profile, start a session, and log your first set in under a minute.
              </Text>
            </View>

            <Panel className={isWide ? 'w-[440px] p-6' : 'p-5'}>
              <Text className="text-uber-black text-2xl font-semibold mb-1">
                Create account
              </Text>
              <Text className="text-uber-gray700 text-sm leading-5 mb-5">
                Keep it short. You can refine your profile later.
              </Text>

              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 mb-4">
                  <Text className="text-danger text-sm">{error}</Text>
                </View>
              ) : null}

              <Field
                label="Username"
                placeholder="alex_lifts"
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={setUsername}
              />

              <Field
                label="Email"
                placeholder="alex@example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Field
                label="Display name"
                placeholder="Optional"
                value={displayName}
                onChangeText={setDisplayName}
              />

              <Field
                label="Password"
                placeholder="Minimum 8 characters"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />

              <PrimaryButton
                className="mt-2 mb-5"
                onPress={handleSignup}
                disabled={loading || !username.trim() || !email.trim() || password.length < 8}
                loading={loading}
              >
                Create account
              </PrimaryButton>

              <View className="flex-row justify-center">
                <Text className="text-uber-gray700 text-sm">Already set up? </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable hitSlop={8}>
                    <Text className="text-uber-black text-sm font-semibold">Log in</Text>
                  </Pressable>
                </Link>
              </View>
            </Panel>
          </View>
        </ResponsiveContent>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
