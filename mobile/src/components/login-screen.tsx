import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient } from '@/client/auth';

/**
 * Sign-in against web's better-auth server. Email/password works out of the box;
 * Google uses the social flow (needs a native OAuth client id configured — see
 * DESIGN.md / mobile setup notes).
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInEmail() {
    setBusy(true);
    setError(null);
    const res = await authClient.signIn.email({ email: email.trim(), password });
    if (res.error) setError(res.error.message ?? 'Sign in failed.');
    setBusy(false);
  }

  async function signInGoogle() {
    setBusy(true);
    setError(null);
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed.');
    }
    setBusy(false);
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white dark:bg-black">
      <View className="flex-1 justify-center gap-3 px-6">
        <Text className="text-center text-3xl font-bold text-black dark:text-white">
          Saive
        </Text>
        <Text className="mb-4 text-center text-neutral-500">
          Sign in to your bookmarks
        </Text>

        <TextInput
          className="rounded-lg border border-neutral-300 px-4 py-3 text-black dark:border-neutral-700 dark:text-white"
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="rounded-lg border border-neutral-300 px-4 py-3 text-black dark:border-neutral-700 dark:text-white"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text className="text-center text-red-500">{error}</Text>}

        <Pressable
          className="items-center rounded-lg bg-black py-3 dark:bg-white"
          disabled={busy}
          onPress={signInEmail}>
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text className="font-semibold text-white dark:text-black">Sign in</Text>
          )}
        </Pressable>

        <Pressable
          className="items-center rounded-lg border border-neutral-300 py-3 dark:border-neutral-700"
          disabled={busy}
          onPress={signInGoogle}>
          <Text className="font-semibold text-black dark:text-white">
            Continue with Google
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
