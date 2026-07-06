import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { trpc } from '@/client/api';

// Inferred from web's tRPC procedure.
type Bookmarks = Awaited<ReturnType<typeof trpc.bookmarks.forList.query>>;

export default function ListScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [bookmarks, setBookmarks] = useState<Bookmarks>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Refetch on focus so a newly-created bookmark shows on return.
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      trpc.bookmarks.forList
        .query({ listId: id })
        .then(setBookmarks)
        .catch((e) => setError(e instanceof Error ? e.message : 'Request failed'))
        .finally(() => setLoading(false));
    }, [id]),
  );

  function confirmDeleteList() {
    Alert.alert('Delete list?', 'This deletes the list and its bookmarks.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          await trpc.lists.delete.mutate({ listId: id });
          router.back();
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-bg px-4 pt-4">
      <Stack.Screen
        options={{
          title: name ?? 'List',
          headerRight: () => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/bookmarks/new',
                  params: { listId: id, listName: name },
                })
              }>
              <Text className="text-base font-semibold text-primary">Add</Text>
            </Pressable>
          ),
        }}
      />

      {loading && <Text className="text-muted">Loading…</Text>}
      {error && <Text className="text-danger">{error}</Text>}
      {!loading && !error && bookmarks.length === 0 && (
        <Text className="text-muted">No bookmarks yet.</Text>
      )}

      <FlatList
        data={bookmarks}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
        ListFooterComponent={
          <View className="mt-6 gap-2">
            <Pressable
              onPress={() =>
                router.push({ pathname: '/lists/edit', params: { id } })
              }
              className="items-center rounded-lg border border-border py-3">
              <Text className="text-ink">Edit list</Text>
            </Pressable>
            <Pressable
              onPress={confirmDeleteList}
              className="items-center rounded-lg border border-border py-3">
              <Text className="font-semibold text-danger">Delete list</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/bookmarks/[id]',
                params: { id: item.id, name: item.name },
              })
            }
            className="gap-1 rounded-xl border border-border bg-panel p-3">
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
          </Pressable>
        )}
      />
    </View>
  );
}
