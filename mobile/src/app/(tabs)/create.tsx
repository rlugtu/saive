/**
 * Action-only tab: the "Create" tab never renders this screen. Its tab press is
 * intercepted in (tabs)/_layout.tsx, which pushes the standalone new-bookmark
 * modal (/bookmarks/new) instead. This file exists only so expo-router has a
 * route to back the tab.
 */
export default function CreateTab() {
  return null;
}
