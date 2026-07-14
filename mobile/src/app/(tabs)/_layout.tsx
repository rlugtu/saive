import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import FloatingTabBar from '@/components/floating-tab-bar';
import { TabBarScrollProvider } from '@/theme/tab-bar-scroll';

export default function AppTabs() {
  const router = useRouter();
  return (
    <TabBarScrollProvider>
      {/*
        Tab order is deliberate: Lists (index) sits dead-center of the five tabs —
        Nearby, Create, Lists, Friends, Profile. React Navigation renders tabs in
        the order these <Tabs.Screen> are declared, so the JSX order IS the bar order.
        "Create" is an action tab: it has no real screen — its press is intercepted
        and pushes the standalone new-bookmark modal instead (see create.tsx).
      */}
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false, tabBarShowLabel: false }}>
        <Tabs.Screen
          name="nearby"
          options={{
            title: 'Nearby',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="location-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Add',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="add-circle-outline" color={color} size={size} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push('/bookmarks/new');
            },
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Lists',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="list" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="friends"
          options={{
            title: 'Friends',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="people-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="person-circle-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </TabBarScrollProvider>
  );
}
