import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';

import { trpc } from '@/client/api';
import { useTheme } from '@/theme/theme-provider';
import { THEME_TOKENS } from '@/theme/tokens';
import { cardShadow } from '@/theme/shadows';
import { useTabBarScrollHandler } from '@/theme/tab-bar-scroll';

// Inferred straight from web's tRPC procedure — no hand-written DTOs.
type Memberships = Awaited<ReturnType<typeof trpc.lists.mine.query>>;
type Requests = Awaited<ReturnType<typeof trpc.sharing.incomingRequests.query>>;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const muted = THEME_TOKENS[theme].muted;
  const onScroll = useTabBarScrollHandler();

  const [lists, setLists] = useState<Memberships>([]);
  const [requests, setRequests] = useState<Requests>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    trpc.lists.mine
      .query()
      .then(setLists)
      .catch((e) => setError(e instanceof Error ? e.message : 'Request failed'))
      .finally(() => setLoading(false));
    trpc.sharing.incomingRequests.query().then(setRequests).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  async function decideRequest(
    inviteId: string,
    decision: 'approve' | 'reject',
  ) {
    // Optimistically drop the row; refresh lists so an approved list appears.
    setRequests((cur) => cur.filter((r) => r.id !== inviteId));
    if (decision === 'approve') {
      await trpc.sharing.approveRequest.mutate({ inviteId });
    } else {
      await trpc.sharing.rejectRequest.mutate({ inviteId });
    }
    load();
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((m) => m.list.name.toLowerCase().includes(q));
  }, [lists, query]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']} className="bg-bg">
      <Animated.FlatList
        data={shown}
        keyExtractor={(m) => m.list.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        ListHeaderComponent={
          <View className="gap-3 pb-1">
            <View className="flex-row items-center justify-between">
              <Text className="font-serif text-3xl text-ink">Klect</Text>
              <View className="flex-row items-center gap-4">
                <Pressable onPress={() => router.push('/lists/new')}>
                  <Text className="font-sans-semibold text-base text-primary">
                    + List
                  </Text>
                </Pressable>
                <Pressable onPress={() => router.push('/bookmarks/new')}>
                  <Text className="font-sans-semibold text-base text-primary">
                    + Bookmark
                  </Text>
                </Pressable>
              </View>
            </View>

            <TextInput
              className="rounded-skin border-skin border-border px-4 py-2.5 font-sans text-ink"
              placeholder="Search lists"
              placeholderTextColor={muted}
              autoCapitalize="none"
              value={query}
              onChangeText={setQuery}
            />

            {requests.length > 0 && (
              <View className="gap-2">
                <Text className="font-sans-semibold text-sm text-primary">
                  Collab requests
                </Text>
                {requests.map((req) => (
                  <View
                    key={req.id}
                    className="rounded-skin border-skin border-border bg-panel p-3">
                    <Text className="font-serif text-base text-ink" numberOfLines={1}>
                      {req.list.icon} {req.list.name}
                    </Text>
                    <Text className="font-sans text-sm text-muted" numberOfLines={1}>
                      {req.list.description || 'No description'}
                    </Text>
                    <View className="mt-2 flex-row justify-end gap-4">
                      <Pressable
                        onPress={() => decideRequest(req.id, 'reject')}
                        hitSlop={8}>
                        <Text className="font-sans text-muted">Reject</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => decideRequest(req.id, 'approve')}
                        hitSlop={8}>
                        <Text className="font-sans-semibold text-primary">
                          Approve
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {loading && <Text className="font-sans text-muted">Loading…</Text>}
            {error && <Text className="font-sans text-danger">{error}</Text>}
            {!loading && !error && shown.length === 0 && (
              <Text className="font-serif-italic text-muted">
                {query ? 'No lists match.' : 'No lists yet — tap + New.'}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/lists/[id]',
                params: { id: item.list.id, name: item.list.name },
              })
            }
            style={cardShadow}
            className="rounded-skin border-skin border-border bg-panel p-4">
            <Text className="font-serif text-xl text-ink">
              {item.list.icon} {item.list.name}
            </Text>
            <Text className="mt-0.5 font-sans text-sm text-muted">
              {plural(item.list._count.bookmarks, 'bookmark')} ·{' '}
              {plural(item.list._count.memberships, 'member')}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
