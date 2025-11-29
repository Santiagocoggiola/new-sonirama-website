'use client';

import { useThemeContext } from '@/providers/ThemeProvider';
import type { ThemeMode } from '@/providers/ThemeProvider';

/**
 * Hook for managing theme state
 * Wraps ThemeProvider context for easier use
 */
export function useTheme() {
  const { theme, resolvedTheme, setTheme, toggle, isDark } = useThemeContext();

  return {
    /** Current theme mode (light, dark, system) */
    theme,
    /** Resolved theme (light or dark) */
    resolvedTheme,
    /** Whether dark mode is active */
    isDark,
    /** Whether light mode is active */
    isLight: !isDark,
    /** Set theme mode */
    setTheme,
    /** Toggle between light and dark */
    toggle,
    /** Alias for toggle */
    toggleTheme: toggle,
    /** Always true after hydration */
    isInitialized: true,
  };
}

export type { ThemeMode };
