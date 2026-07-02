"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";

type Theme = "light" | "dark";

/**
 * Flips the `data-theme` attribute on <html> to preview both palettes.
 * Initial value matches the <html data-theme="dark"> default set in layout.
 * Persistence (tied to user.theme) comes with auth in Step 2.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }

  return (
    <PixelButton variant="secondary" size="sm" onClick={toggle}>
      {theme === "dark" ? "☀ light" : "☾ dark"}
    </PixelButton>
  );
}
