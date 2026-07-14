import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HeaderBlurBackground from '@/components/header-blur-background';

/**
 * A frosted-glass overlay pinned to the top of a tab screen, spanning the status-bar
 * safe area. Mirrors the floating tab bar so screen content scrolls *under* a
 * translucent, blurred status bar instead of a solid bg-colored strip. Shares its glass
 * surface with the pushed-screen navigation header (`HeaderBlurBackground`) so both look
 * identical. Pair with a `SafeAreaView` that drops its `top` edge and a scroll container
 * padded by the top inset.
 */
export default function FloatingStatusBar() {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { height: insets.top }]}>
      <HeaderBlurBackground />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
});
