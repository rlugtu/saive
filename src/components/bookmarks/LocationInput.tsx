"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PixelInput } from "@/components/ui/PixelInput";
import { searchPlaces, type PlaceSuggestion } from "@/lib/actions/places";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

/**
 * Location field with address / business autocomplete (Geoapify, proxied server-side).
 * Renders the visible input plus hidden `location`/`latitude`/`longitude` inputs so the
 * bookmark form submits by name. Free typing clears the coordinates (the text no longer
 * matches a pin); picking a suggestion fills them.
 */
export function LocationInput({
  initialLocation = "",
  initialLat = null,
  initialLon = null,
}: {
  initialLocation?: string;
  initialLat?: number | null;
  initialLon?: number | null;
}) {
  const [query, setQuery] = useState(initialLocation);
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lon, setLon] = useState<number | null>(initialLon);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Ignore responses that arrive after a newer request, and skip refetching a query
  // we just resolved (e.g. the address set programmatically after a pick, or the initial
  // value on an edit-form mount).
  const reqId = useRef(0);
  const lastFetched = useRef<string | null>(initialLocation.trim() || null);

  useEffect(() => {
    const q = query.trim();
    const handle = setTimeout(async () => {
      if (q.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setError(null);
        lastFetched.current = null;
        return;
      }
      if (q === lastFetched.current) return; // unchanged (or just-picked) — no refetch

      const id = ++reqId.current;
      lastFetched.current = q;
      const result = await searchPlaces(q);
      if (id !== reqId.current) return; // a newer request superseded this one
      if (result.ok) {
        setSuggestions(result.data);
        setError(null);
      } else {
        setSuggestions([]);
        setError(result.error);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  function pick(s: PlaceSuggestion) {
    lastFetched.current = s.address.trim(); // prevent the query-change effect from refetching
    setQuery(s.address);
    setLat(s.lat);
    setLon(s.lon);
    setSuggestions([]);
    setError(null);
    setOpen(false);
  }

  const showDropdown =
    open && query.trim().length >= MIN_QUERY_LENGTH && (suggestions.length > 0 || !!error);

  return (
    <div className="relative">
      {/* Hidden inputs carry the values into the form submission. */}
      <input type="hidden" name="location" value={query} />
      <input type="hidden" name="latitude" value={lat ?? ""} />
      <input type="hidden" name="longitude" value={lon ?? ""} />

      <PixelInput
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // Free typing means the text no longer matches the picked pin.
          setLat(null);
          setLon(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Ramen Nagi · 1600 Amphitheatre Pkwy…"
        aria-label="Location"
        autoComplete="off"
      />

      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="pixel-box bg-panel absolute z-10 mt-2 max-h-80 w-full overflow-auto p-2"
          // Keep focus on the input so option clicks register before blur.
          onMouseDown={(e) => e.preventDefault()}
        >
          {error ? (
            <p className="text-muted p-2 text-sm">{error}</p>
          ) : (
            suggestions.map((s, i) => (
              <button
                key={`${s.lat},${s.lon},${i}`}
                type="button"
                onClick={() => pick(s)}
                className="hover:bg-primary/15 flex w-full flex-col gap-0.5 px-2 py-1.5 text-left cursor-pointer"
              >
                <span className="truncate">{s.label}</span>
                <span className="text-muted truncate text-sm">{s.address}</span>
              </button>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
