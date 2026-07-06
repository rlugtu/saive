import '@/global.css';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import LoginScreen from '@/components/login-screen';
import { authClient } from '@/client/auth';
import { ThemeProvider as AppThemeProvider } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { data: session, isPending } = authClient.useSession();

  return (
    <AppThemeProvider>
      <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {isPending ? (
          // Splash overlay covers this brief gap while the session resolves.
          <View style={{ flex: 1 }} />
        ) : session ? (
          <AppTabs />
        ) : (
          <LoginScreen />
        )}
      </NavThemeProvider>
    </AppThemeProvider>
  );
}
