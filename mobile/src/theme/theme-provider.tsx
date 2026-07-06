import { createContext, useContext, useState, type ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';

import { themeVars, type ThemeName } from './tokens';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

/**
 * Applies a Saive theme's tokens as CSS variables (via NativeWind `vars()`) to a
 * root wrapper, so `bg-bg` / `text-ink` / `bg-primary` resolve to the active
 * palette. Reproduces web's `data-theme` var-swap. Defaults to the pixel theme
 * following the system light/dark; `setTheme` lets a settings screen override it.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [override, setOverride] = useState<ThemeName | null>(null);
  const theme = override ?? (scheme === 'dark' ? 'PIXEL_DARK' : 'PIXEL_LIGHT');

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setOverride }}>
      <View style={vars(themeVars(theme))} className="flex-1 bg-bg">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}
