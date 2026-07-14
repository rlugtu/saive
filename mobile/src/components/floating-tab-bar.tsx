import {
  Animated as RNAnimated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import ReAnimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabActions } from '@react-navigation/native';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';

import { useTheme } from '@/theme/theme-provider';
import { THEME_TOKENS } from '@/theme/tokens';
import { cardShadow } from '@/theme/shadows';
import { useTabBarShrink } from '@/theme/tab-bar-scroll';

const ICON_SIZE = 26;
/** Box the icon + concentric ring live in; the ring hugs the box edge. */
const BOX = 40;
const PILL_HEIGHT = 60;
const RADIUS = PILL_HEIGHT / 2;

/** Ionicons outline (inactive) → filled (active) pair per swipe page. */
const ICONS: Record<
  string,
  { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }
> = {
  nearby: { outline: 'location-outline', filled: 'location' },
  index: { outline: 'albums-outline', filled: 'albums' },
  friends: { outline: 'people-outline', filled: 'people' },
  profile: { outline: 'person-circle-outline', filled: 'person-circle' },
};

/** Squash on touch-down; low-damping rebound (elastic overshoot) on release. */
const SQUASH = { stiffness: 400, damping: 18 } as const;
const REBOUND = { stiffness: 260, damping: 9 } as const;

/**
 * Instagram-style floating navigation: a content-hugging glass pill (not full width),
 * icon-only + vertically centered, that shrinks on scroll-down and grows back on
 * scroll-up. Inactive tabs are a lightweight stroke outline; the active tab is a
 * high-contrast solid fill inside a concentric ring. Because the tabs are a swipeable
 * pager (material-top-tabs), the outline→fill crossfade is driven by the pager's
 * `position` — so the icon fills in proportion to how far you've dragged toward it.
 * The center "Create" is an action button (no swipe page): it pushes /bookmarks/new.
 */
export default function FloatingTabBar({
  state,
  navigation,
  position,
}: MaterialTopTabBarProps) {
  const themeName = useTheme().theme;
  const t = THEME_TOKENS[themeName];
  const insets = useSafeAreaInsets();
  const shrink = useTabBarShrink();
  const isDark = themeName.endsWith('DARK');

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(shrink.value, [0, 1], [1, 0.82]) }],
    opacity: interpolate(shrink.value, [0, 1], [1, 0.9]),
  }));

  const renderTab = (index: number) => {
    const route = state.routes[index];
    const icon = ICONS[route.name];
    if (!icon) return null;
    const focused = state.index === index;

    // Fills as the pager position approaches this page; 1 exactly on it, 0 one page away.
    const filled = position.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.dispatch({ ...TabActions.jumpTo(route.name), target: state.key });
      }
    };

    return (
      <TabButton key={route.key} focused={focused} onPress={onPress}>
        <RNAnimated.View
          style={[
            styles.ring,
            {
              borderColor: t.primary,
              opacity: filled,
              transform: [
                { scale: filled.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
              ],
            },
          ]}
        />
        {/* Outline (inactive) sits underneath; filled (active) crossfades on top. */}
        <Ionicons name={icon.outline} size={ICON_SIZE} color={t.muted} />
        <RNAnimated.View style={[styles.fillLayer, { opacity: filled }]}>
          <Ionicons name={icon.filled} size={ICON_SIZE} color={t.primary} />
        </RNAnimated.View>
      </TabButton>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: Math.max(insets.bottom, 12) }]}>
      <ReAnimated.View
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

        {/* Bar order: Nearby · Create · Lists · Friends · Profile. Create is injected
            between the first page (nearby) and the rest. */}
        {renderTab(0)}
        <CreateButton color={t.muted} />
        {state.routes.slice(1).map((_, i) => renderTab(i + 1))}
      </ReAnimated.View>
    </View>
  );
}

/** Wraps a bar item with the spring squash/rebound press animation + haptic pulse. */
function TabButton({
  focused,
  onPress,
  children,
}: {
  focused: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      hitSlop={6}
      onPressIn={() => {
        scale.value = withSpring(0.86, SQUASH);
        Haptics.selectionAsync();
      }}
      onPressOut={() => {
        scale.value = withSpring(1, REBOUND);
      }}
      onPress={onPress}
      style={styles.item}>
      <ReAnimated.View style={[styles.iconBox, style]}>{children}</ReAnimated.View>
    </Pressable>
  );
}

/** Center action button — never a swipe page; pushes the standalone new-bookmark modal. */
function CreateButton({ color }: { color: string }) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New bookmark"
      hitSlop={6}
      onPressIn={() => {
        scale.value = withSpring(0.86, SQUASH);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, REBOUND);
      }}
      onPress={() => router.push('/bookmarks/new')}
      style={styles.item}>
      <ReAnimated.View style={[styles.iconBox, style]}>
        <Ionicons name="add-circle-outline" size={ICON_SIZE + 4} color={color} />
      </ReAnimated.View>
    </Pressable>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: BOX,
    height: BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BOX / 2,
    borderWidth: 1.5,
  },
  fillLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
