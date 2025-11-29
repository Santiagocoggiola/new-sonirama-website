'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect media query matches
 * SSR-safe - returns false on server
 * 
 * @param query - CSS media query string
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create handler
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoints matching PrimeFlex
 */
export const breakpoints = {
  sm: '(min-width: 576px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 992px)',
  xl: '(min-width: 1200px)',
} as const;

/**
 * Hook for common responsive breakpoints
 */
export function useBreakpoints() {
  const isSm = useMediaQuery(breakpoints.sm);
  const isMd = useMediaQuery(breakpoints.md);
  const isLg = useMediaQuery(breakpoints.lg);
  const isXl = useMediaQuery(breakpoints.xl);

  return {
    /** >= 576px */
    isSm,
    /** >= 768px */
    isMd,
    /** >= 992px */
    isLg,
    /** >= 1200px */
    isXl,
    /** < 576px */
    isXs: !isSm,
    /** < 768px */
    isMobile: !isMd,
    /** >= 768px */
    isDesktop: isMd,
  };
}
