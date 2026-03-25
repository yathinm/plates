import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
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
      className="flex-1 bg-gym-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-8 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-4xl font-bold text-zinc-100 mb-1">
          Join Plates
        </Text>
        <Text className="text-gym-muted text-base mb-10">
          Create your account and start lifting.
        </Text>

        {error ? (
          <View className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        <TextInput
          className="bg-gym-slate border border-gym-border rounded-xl px-4 py-3.5 text-zinc-100 text-base mb-3"
          placeholder="Username"
          placeholderTextColor="#71717A"
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          className="bg-gym-slate border border-gym-border rounded-xl px-4 py-3.5 text-zinc-100 text-base mb-3"
          placeholder="Email"
          placeholderTextColor="#71717A"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          className="bg-gym-slate border border-gym-border rounded-xl px-4 py-3.5 text-zinc-100 text-base mb-3"
          placeholder="Display name (optional)"
          placeholderTextColor="#71717A"
          value={displayName}
          onChangeText={setDisplayName}
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
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Create Account
            </Text>
          )}
        </Pressable>

        <View className="flex-row justify-center">
          <Text className="text-gym-muted text-sm">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-brand-electric text-sm font-semibold">
                Log In
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
