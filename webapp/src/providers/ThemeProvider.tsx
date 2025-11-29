'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** Current theme setting */
  theme: ThemeMode;
  /** Resolved theme (actual light/dark) */
  resolvedTheme: ResolvedTheme;
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void;
  /** Toggle between light and dark */
  toggle: () => void;
  /** Whether dark mode is active */
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'sonirama-theme';
const DARK_THEME_ID = 'sonirama-theme-dark';
const DARK_THEME_HREF = 'https://cdn.jsdelivr.net/npm/primereact@10.9.7/resources/themes/lara-dark-blue/theme.css';

/**
 * Get system preference for color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get stored theme from localStorage
 */
function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'system';
}

/**
 * Apply theme to the document
 */
function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;

  // Update data-theme attribute
  document.documentElement.dataset.theme = resolved;

  // Handle dark theme stylesheet
  const existingLink = document.getElementById(DARK_THEME_ID) as HTMLLinkElement | null;

  if (resolved === 'dark') {
    if (!existingLink) {
      const link = document.createElement('link');
      link.id = DARK_THEME_ID;
      link.rel = 'stylesheet';
      link.href = DARK_THEME_HREF;
      document.head.appendChild(link);
    } else if (existingLink.href !== DARK_THEME_HREF) {
      existingLink.href = DARK_THEME_HREF;
    }
  } else {
    existingLink?.remove();
  }
}

interface ThemeProviderProps {
  children: ReactNode;
  /** Default theme */
  defaultTheme?: ThemeMode;
}

/**
 * Theme provider for Sonirama app
 * Supports light, dark, and system preference
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const stored = getStoredTheme();
    const system = getSystemTheme();
    const resolved = stored === 'system' ? system : stored;

    setThemeState(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    
    setThemeState(newTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // localStorage not available
    }
  }, []);

  const toggle = useCallback(() => {
    const newResolved = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newResolved);
  }, [resolvedTheme, setTheme]);

  const value: ThemeContextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggle,
      isDark: resolvedTheme === 'dark',
    }),
    [theme, resolvedTheme, setTheme, toggle]
  );

  // Prevent flash by not rendering until mounted
  // We still render children to allow SSR, but context may have default values
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
