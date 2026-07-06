import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { trpc } from '@/client/api';
import { authClient } from '@/client/auth';

// Inferred straight from web's tRPC procedure — no hand-written DTOs.
type Memberships = Awaited<ReturnType<typeof trpc.lists.mine.query>>;

export default function HomeScreen() {
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
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title">Saive</ThemedText>
          <Pressable onPress={() => authClient.signOut()}>
            <ThemedText type="small">Sign out</ThemedText>
          </Pressable>
        </View>

        {loading && <ThemedText type="small">Loading…</ThemedText>}
        {error && <ThemedText type="small">Not signed in — {error}</ThemedText>}

        <FlatList
          style={styles.list}
          data={lists}
          keyExtractor={(m) => m.list.id}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText>
                {item.list.icon} {item.list.name}
              </ThemedText>
              <ThemedText type="small">
                {item.list._count.bookmarks} bookmarks
              </ThemedText>
            </ThemedView>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: { alignSelf: 'stretch' },
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.one,
  },
});
