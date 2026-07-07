import { Theme } from "@/generated/prisma/enums";

/** All selectable themes: retro (pixel), modern (sleek), journal (warm), each light/dark. */
export const THEME_OPTIONS: { value: Theme; label: string; dataAttr: string }[] =
  [
    { value: "PIXEL_LIGHT", label: "Pixel Light", dataAttr: "pixel-light" },
    { value: "PIXEL_DARK", label: "Pixel Dark", dataAttr: "pixel-dark" },
    { value: "MODERN_LIGHT", label: "Modern Light", dataAttr: "modern-light" },
    { value: "MODERN_DARK", label: "Modern Dark", dataAttr: "modern-dark" },
    { value: "JOURNAL_LIGHT", label: "Journal Light", dataAttr: "journal-light" },
    { value: "JOURNAL_DARK", label: "Journal Dark", dataAttr: "journal-dark" },
  ];

const DATA_ATTR: Record<Theme, string> = {
  PIXEL_LIGHT: "pixel-light",
  PIXEL_DARK: "pixel-dark",
  MODERN_LIGHT: "modern-light",
  MODERN_DARK: "modern-dark",
  JOURNAL_LIGHT: "journal-light",
  JOURNAL_DARK: "journal-dark",
};

/** Enum value → the `data-theme` attribute string used in globals.css. */
export function themeDataAttr(raw: string | null | undefined): string {
  return raw && raw in DATA_ATTR ? DATA_ATTR[raw as Theme] : "modern-light";
}

/** Validate an arbitrary string to a known Theme (fallback MODERN_LIGHT). */
export function coerceTheme(raw: string | null | undefined): Theme {
  return raw && (Object.values(Theme) as string[]).includes(raw)
    ? (raw as Theme)
    : "MODERN_LIGHT";
}
