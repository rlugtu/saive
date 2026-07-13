import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/theme/theme-provider';
import { THEME_TOKENS } from '@/theme/tokens';
import { cardShadow } from '@/theme/shadows';
import { useTabBarShrink } from '@/theme/tab-bar-scroll';

/** One size step up from React Navigation's default (~24). */
const ICON_SIZE = 28;
const PILL_HEIGHT = 56;
const RADIUS = PILL_HEIGHT / 2;

/**
 * Instagram-style floating navigation: a content-hugging glass pill (not full width),
 * icon-only + vertically centered, that shrinks on scroll-down and grows back on
 * scroll-up. The frosted blur needs a native build to render; until then the
 * translucent `panel` fallback keeps it looking like glass.
 */
export default function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const themeName = useTheme().theme;
  const t = THEME_TOKENS[themeName];
  const insets = useSafeAreaInsets();
  const shrink = useTabBarShrink();
  const isDark = themeName.endsWith('DARK');

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(shrink.value, [0, 1], [1, 0.82]) }],
    opacity: interpolate(shrink.value, [0, 1], [1, 0.9]),
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: Math.max(insets.bottom, 12) }]}>
      <Animated.View
        style={[
          styles.pill,
          // Translucent fallback so it still reads as glass without the native blur.
          { borderColor: t.border, backgroundColor: t.panel + (isDark ? '99' : 'B3') },
          cardShadow,
          pillStyle,
        ]}>
        <View style={styles.clip}>
          <BlurView
            intensity={40}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? t.primary : t.muted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
              hitSlop={6}
              style={styles.item}>
              {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: PILL_HEIGHT,
    borderRadius: RADIUS,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  clip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  item: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
