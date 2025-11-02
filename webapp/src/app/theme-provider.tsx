"use client";

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DARK_LINK_ID = "pr-theme-dark";
const DARK_THEME_HREF =
  "https://cdn.jsdelivr.net/npm/primereact@10.9.7/resources/themes/lara-dark-blue/theme.css";

function applyTheme(t: ThemeMode) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(DARK_LINK_ID) as HTMLLinkElement | null;
  if (t === "dark") {
    if (existing) {
      if (existing.href !== DARK_THEME_HREF) existing.href = DARK_THEME_HREF;
    } else {
      const link = document.createElement("link");
      link.id = DARK_LINK_ID;
      link.rel = "stylesheet";
      link.href = DARK_THEME_HREF;
      document.head.appendChild(link);
    }
    document.documentElement.dataset.theme = "dark";
  } else {
    existing?.remove();
    document.documentElement.dataset.theme = "light";
  }
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export default function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [theme, setTheme] = useState<ThemeMode>("light");

  // Initialize from saved preference or system
  useEffect(() => {
    const saved = globalThis?.localStorage?.getItem?.("theme");
    const prefersDark = !!globalThis?.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const initial: ThemeMode = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
    const schedule = (fn: () => void) => {
      const w = (globalThis as { window?: Window }).window;
      if (w && typeof w.requestAnimationFrame === "function") {
        w.requestAnimationFrame(fn as FrameRequestCallback);
      } else {
        setTimeout(fn, 0);
      }
    };
    schedule(() => setTheme(initial));
    // Applying theme updates the DOM, safe to do immediately
    applyTheme(initial);
  }, [setTheme]);

  const updateTheme = useCallback((t: ThemeMode) => {
    setTheme(t);
    applyTheme(t);
    try {
      globalThis?.localStorage?.setItem?.("theme", t);
    } catch {
      // ignore
    }
  }, [setTheme]);

  const value: ThemeContextValue = useMemo(() => ({
    theme,
    setTheme: updateTheme,
    toggle: () => updateTheme(theme === "dark" ? "light" : "dark"),
  }), [theme, updateTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
