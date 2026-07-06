import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { trpc } from '@/client/api';
import { authClient } from '@/client/auth';

// Inferred straight from web's tRPC procedure — no hand-written DTOs.
type Memberships = Awaited<ReturnType<typeof trpc.lists.mine.query>>;

export default function HomeScreen() {
  const router = useRouter();
  const [lists, setLists] = useState<Memberships>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trpc.lists.mine
      .query()
      .then(setLists)
      .catch((e) => setError(e instanceof Error ? e.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-bg">
      <View className="flex-1 gap-3 px-4 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-ink">Saive</Text>
          <Pressable onPress={() => authClient.signOut()}>
            <Text className="text-muted">Sign out</Text>
          </Pressable>
        </View>

        {loading && <Text className="text-muted">Loading…</Text>}
        {error && <Text className="text-danger">Not signed in — {error}</Text>}

        <FlatList
          data={lists}
          keyExtractor={(m) => m.list.id}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/lists/[id]',
                  params: { id: item.list.id, name: item.list.name },
                })
              }
              className="rounded-xl border border-border bg-panel p-3">
              <Text className="text-base text-ink">
                {item.list.icon} {item.list.name}
              </Text>
              <Text className="text-sm text-muted">
                {item.list._count.bookmarks} bookmarks
              </Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
