import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { trpc } from '@/client/api';

// Inferred from web's tRPC procedure.
type Bookmarks = Awaited<ReturnType<typeof trpc.bookmarks.forList.query>>;

export default function ListScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [bookmarks, setBookmarks] = useState<Bookmarks>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    trpc.bookmarks.forList
      .query({ listId: id })
      .then(setBookmarks)
      .catch((e) => setError(e instanceof Error ? e.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <View className="flex-1 bg-bg px-4 pt-4">
      <Stack.Screen options={{ title: name ?? 'List' }} />

      {loading && <Text className="text-muted">Loading…</Text>}
      {error && <Text className="text-danger">{error}</Text>}
      {!loading && !error && bookmarks.length === 0 && (
        <Text className="text-muted">No bookmarks yet.</Text>
      )}

      <FlatList
        data={bookmarks}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <View className="gap-1 rounded-xl border border-border bg-panel p-3">
            <Text className="text-base font-semibold text-ink">{item.name}</Text>
            {item.description ? (
              <Text className="text-sm text-muted" numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            {item.tags.length > 0 && (
              <View className="mt-1 flex-row flex-wrap gap-1">
                {item.tags.map((bt) => (
                  <View
                    key={bt.tag.id}
                    className="rounded px-2 py-0.5"
                    style={{ backgroundColor: bt.tag.color }}>
                    <Text className="text-xs text-ink">{bt.tag.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
