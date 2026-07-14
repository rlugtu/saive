import { AppRegistry, Text, TextInput } from 'react-native';

import ShareExtension from '@/share-extension';

// Inside a share extension, RN's default font scaling can mis-size text (a documented
// expo-share-extension quirk). Disable it globally so the reused BookmarkForm — which renders RN's
// own <Text>/<TextInput> — lays out correctly without touching the shared component. Text/TextInput
// are class components, so defaultProps still applies under React 19.
const withNoFontScaling = (Component: typeof Text | typeof TextInput) => {
  // @ts-expect-error defaultProps is untyped on these host components
  Component.defaultProps = {
    // @ts-expect-error merge with any existing defaults
    ...(Component.defaultProps ?? {}),
    allowFontScaling: false,
  };
};
withNoFontScaling(Text);
withNoFontScaling(TextInput);

AppRegistry.registerComponent('shareExtension', () => ShareExtension);
