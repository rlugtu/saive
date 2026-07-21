import { Pressable, Text } from 'react-native';

/**
 * Toggle pill for a bookmark's visited flag. Shared by the detail view and the
 * add/edit form. `size` defaults to 'sm' (the form); the detail view uses 'md' to
 * give the pill more presence next to the rating.
 */
export default function VisitedPill({
  visited,
  onToggle,
  size = 'sm',
}: {
  visited: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: visited }}
      onPress={onToggle}
      className={`rounded-skin-sm ${size === 'md' ? 'px-3 py-1' : 'px-2.5 py-0.5'} ${visited ? 'bg-success' : 'border-skin border-border'}`}>
      <Text
        className={`font-sans ${size === 'md' ? 'text-sm' : 'text-xs'} ${visited ? 'text-primary-ink' : 'text-muted'}`}>
        {visited ? 'Visited' : 'Mark visited'}
      </Text>
    </Pressable>
  );
}
