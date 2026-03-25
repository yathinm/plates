import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/stores/auth';
import { ApiError } from '@/utils/api';

export default function LoginScreen() {
  const login = useAuth((s) => s.login);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      className="flex-1 bg-gym-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 justify-center px-8">
        <Text className="text-4xl font-bold text-zinc-100 mb-1">Plates</Text>
        <Text className="text-gym-muted text-base mb-10">
          Log in to start tracking.
        </Text>

        {error ? (
          <View className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <TextInput
          className="bg-gym-slate border border-gym-border rounded-xl px-4 py-3.5 text-zinc-100 text-base mb-3"
          placeholder="Username or email"
          placeholderTextColor="#71717A"
          autoCapitalize="none"
          autoCorrect={false}
          value={identifier}
          onChangeText={setIdentifier}
        />

        <TextInput
          className="bg-gym-slate border border-gym-border rounded-xl px-4 py-3.5 text-zinc-100 text-base mb-6"
          placeholder="Password"
          placeholderTextColor="#71717A"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          className="bg-brand-electric rounded-xl py-4 items-center mb-6 active:opacity-80"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Log In</Text>
          )}
        </Pressable>

        <View className="flex-row justify-center">
          <Text className="text-gym-muted text-sm">Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text className="text-brand-electric text-sm font-semibold">
                Sign Up
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
