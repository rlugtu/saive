"use client";

import dynamic from "next/dynamic";

// `ssr: false` must live in a client module (a server component can't disable SSR for a
// child). Leaflet reads `window` at import time, so the map loads only in the browser.
const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

export function LocationMapClient(props: {
  lat: number;
  lon: number;
  label?: string;
}) {
  return <LocationMap {...props} />;
}
