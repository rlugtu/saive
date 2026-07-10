import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { trpc } from '@/client/api';
import { LocationInput } from '@/components/location-input';
import { useTheme } from '@/theme/theme-provider';
import { THEME_TOKENS } from '@/theme/tokens';
import type { RetrievedPlace } from '@web/lib/core/places';

// The exact `data` shape web's create/update procedures accept — no hand DTOs.
export type BookmarkData = Parameters<
  typeof trpc.bookmarks.create.mutate
>[0]['data'];

export const EMPTY_BOOKMARK: BookmarkData = {
  name: '',
  description: '',
  urls: [],
  images: [],
  notes: '',
  location: '',
  latitude: null,
  longitude: null,
  rating: 0,
  visited: false,
  videoUrl: '',
  videoType: '',
  tagNames: [],
};

type Props = {
  initial: BookmarkData;
  submitLabel: string;
  onSubmit: (data: BookmarkData) => Promise<void>;
  // Optional content rendered at the top of the form (e.g. the standalone flow's list picker).
  header?: ReactNode;
  // When true (e.g. a URL shared into the app), fetch page metadata once on mount.
  autofillOnMount?: boolean;
};

/**
 * Reusable bookmark editor. Edits name/url/description/tags/rating and merges
 * over `initial`, preserving fields it doesn't surface (notes, location, coords,
 * visited, video, extra urls) — so editing never wipes them.
 */
export default function BookmarkForm({
  initial,
  submitLabel,
  onSubmit,
  header,
  autofillOnMount,
}: Props) {
  const { theme } = useTheme();
  const muted = THEME_TOKENS[theme].muted;

  const [url, setUrl] = useState(initial.urls[0] ?? '');
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [tagsText, setTagsText] = useState(initial.tagNames.join(', '));
  const [rating, setRating] = useState(initial.rating);
  const [images, setImages] = useState<string[]>(initial.images);
  const [location, setLocation] = useState(initial.location);
  const [latitude, setLatitude] = useState<number | null>(initial.latitude);
  const [longitude, setLongitude] = useState<number | null>(initial.longitude);
  const [videoUrl, setVideoUrl] = useState(initial.videoUrl);
  const [videoType, setVideoType] = useState(initial.videoType);
  const [autofilling, setAutofilling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function autofill() {
    if (!url.trim()) return;
    setAutofilling(true);
    setError(null);
    try {
      const res = await trpc.metadata.fetch.query({ url: url.trim() });
      if (res.ok) {
        if (res.data.title) setName(res.data.title);
        if (res.data.description) setDescription(res.data.description);
        if (res.data.images.length) setImages(res.data.images);
        setVideoUrl(res.data.video?.url ?? '');
        setVideoType(res.data.video?.type ?? '');
        // Comprehension-suggested tags/location — only fill empty fields so we
        // never clobber what the user already typed.
        if (res.data.tags.length && !tagsText.trim())
          setTagsText(res.data.tags.join(', '));
        if (res.data.location && !location.trim()) setLocation(res.data.location);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Autofill failed');
    }
    setAutofilling(false);
  }

  // Auto-fetch page metadata once when the form opens with a prefilled URL
  // (e.g. a link shared into the app). Guarded so it runs a single time.
  const didAutofill = useRef(false);
  useEffect(() => {
    if (autofillOnMount && !didAutofill.current && url.trim()) {
      didAutofill.current = true;
      autofill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofillOnMount]);

  // Autofill when a place is picked in the Location field. Always sets location + coords; for a
  // business (POI) it overwrites name/description/url/images, then enriches from the website unfurl.
  async function handleLocationAutofill(place: RetrievedPlace) {
    setLocation(place.address);
    setLatitude(place.lat);
    setLongitude(place.lon);
    if (!place.isPoi) return; // plain address — location only

    setName(place.name);
    setUrl(place.website); // '' clears the field when the business has no site
    setDescription(place.category); // provisional; the unfurl may replace it
    setImages([]);
    setVideoUrl('');
    setVideoType('');

    if (!place.website) return;
    setAutofilling(true);
    try {
      const res = await trpc.metadata.fetch.query({ url: place.website });
      if (res.ok) {
        if (res.data.title && !place.name) setName(res.data.title);
        if (res.data.description) setDescription(res.data.description);
        if (res.data.images.length) setImages(res.data.images);
        setVideoUrl(res.data.video?.url ?? '');
        setVideoType(res.data.video?.type ?? '');
      }
    } catch {
      // Keep the basics set above.
    }
    setAutofilling(false);
  }

  async function submit() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    const first = url.trim();
    const urls = first ? [first, ...initial.urls.slice(1)] : initial.urls.slice(1);
    try {
      await onSubmit({
        ...initial,
        name: name.trim(),
        description: description.trim(),
        urls,
        images,
        location: location.trim(),
        latitude,
        longitude,
        rating,
        videoUrl,
        videoType,
        tagNames: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerStyle={{ padding: 16, gap: 12 }}
        keyboardShouldPersistTaps="handled">
        {header}
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-skin border-skin border-border px-4 py-3 text-ink"
            placeholder="Paste a link"
            placeholderTextColor={muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={url}
            onChangeText={setUrl}
          />
          <Pressable
            className="items-center justify-center rounded-skin border-skin border-border px-3"
            disabled={autofilling}
            onPress={autofill}>
            {autofilling ? (
              <ActivityIndicator />
            ) : (
              <Text className="text-ink">Autofill</Text>
            )}
          </Pressable>
        </View>

        <View className="gap-1">
          <LocationInput
            initialLocation={initial.location}
            onLocationChange={(text) => {
              setLocation(text);
              // Free-typed text no longer matches the picked pin — drop the coordinates.
              setLatitude(null);
              setLongitude(null);
            }}
            onAutofill={handleLocationAutofill}
          />
          <Text className="text-sm text-muted">
            Pick a business to autofill its name, photos & details.
          </Text>
        </View>

        <TextInput
          className="rounded-skin border-skin border-border px-4 py-3 text-ink"
          placeholder="Name"
          placeholderTextColor={muted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          className="rounded-skin border-skin border-border px-4 py-3 text-ink"
          placeholder="Description"
          placeholderTextColor={muted}
          multiline
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          className="rounded-skin border-skin border-border px-4 py-3 text-ink"
          placeholder="Tags (comma separated)"
          placeholderTextColor={muted}
          autoCapitalize="none"
          value={tagsText}
          onChangeText={setTagsText}
        />

        <View className="flex-row items-center gap-2">
          <Text className="text-muted">Rating</Text>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n === rating ? 0 : n)}>
              <Text className={`text-2xl ${n <= rating ? 'text-accent' : 'text-muted'}`}>
                {n <= rating ? '★' : '☆'}
              </Text>
            </Pressable>
          ))}
        </View>

        {error && <Text className="text-danger">{error}</Text>}

        <Pressable
          className="items-center rounded-skin bg-primary py-3"
          disabled={busy}
          onPress={submit}>
          {busy ? (
            <ActivityIndicator color={THEME_TOKENS[theme].primaryInk} />
          ) : (
            <Text className="font-semibold text-primary-ink">{submitLabel}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
