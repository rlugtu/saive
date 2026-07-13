import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import FloatingTabBar from '@/components/floating-tab-bar';
import { TabBarScrollProvider } from '@/theme/tab-bar-scroll';

export default function AppTabs() {
  return (
    <TabBarScrollProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false, tabBarShowLabel: false }}>
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
          name="nearby"
          options={{
            title: 'Nearby',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="location-outline" color={color} size={size} />
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
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </TabBarScrollProvider>
  );
}
