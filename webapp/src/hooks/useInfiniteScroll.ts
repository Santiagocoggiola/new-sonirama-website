'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions<T> {
  /** Initial data to display */
  initialData?: T[];
  /** Function to fetch more data */
  fetchMore: (page: number) => Promise<{ items: T[]; hasMore: boolean }>;
  /** Threshold in pixels from bottom to trigger fetch */
  threshold?: number;
  /** Whether to enable infinite scroll */
  enabled?: boolean;
}

interface UseInfiniteScrollResult<T> {
  /** Combined data from all pages */
  data: T[];
  /** Whether more data is being fetched */
  isLoading: boolean;
  /** Whether there's more data to fetch */
  hasMore: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Current page number */
  page: number;
  /** Ref to attach to the sentinel element */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** Manually trigger fetch */
  loadMore: () => Promise<void>;
  /** Reset to initial state */
  reset: () => void;
}

export function useInfiniteScroll<T>({
  initialData = [],
  fetchMore,
  threshold = 100,
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isFetchingRef = useRef(false);

  /**
   * Load more data
   */
  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || !enabled) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const result = await fetchMore(nextPage);

      setData((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [fetchMore, hasMore, page, enabled]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setData(initialData);
    setPage(1);
    setHasMore(true);
    setError(null);
    isFetchingRef.current = false;
  }, [initialData]);

  /**
   * Set up Intersection Observer
   */
  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, isLoading, loadMore, threshold]);

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  return {
    data,
    isLoading,
    hasMore,
    error,
    page,
    sentinelRef,
    loadMore,
    reset,
  };
}
