'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAppSelector } from '@/store/hooks';
import { useLazyGetProductsQuery } from '@/store/api/productsApi';
import { selectFilters } from '@/store/slices/filtersSlice';
import { ProductCard } from './ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProductDto } from '@/types';

interface ProductsGridProps {
  /** Test ID for Playwright */
  testId?: string;
  /** Presentation mode */
  mode?: 'user' | 'admin-preview';
}

/**
 * Products grid with infinite scroll and filtering
 */
export function ProductsGrid({ testId = 'products-grid', mode = 'user' }: ProductsGridProps) {
  const filters = useAppSelector(selectFilters);
  const [loadProducts, { isFetching, isLoading, isError, error }] = useLazyGetProductsQuery();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [didLoad, setDidLoad] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const baseParams = useMemo(
    () => ({
      query: filters.query || undefined,
      categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
      priceMin: filters.priceMin ?? undefined,
      priceMax: filters.priceMax ?? undefined,
      isActive: filters.isActive ?? true,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    }),
    [filters]
  );

  const loadPage = useCallback(
    async (pageToLoad: number, replace = false) => {
      const result = await loadProducts({ ...baseParams, page: pageToLoad, pageSize }).unwrap();
      setProducts((prev) => {
        if (replace) return result.items;
        const existingIds = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...result.items.filter((p) => !existingIds.has(p.id))];
        return merged;
      });
      setTotalCount(result.totalCount);
      setPageSize(result.pageSize);
      setCurrentPage(result.page);
      setHasMore(result.page * result.pageSize < result.totalCount);
      setDidLoad(true);
    },
    [baseParams, loadProducts, pageSize]
  );

  // Load first page on filters change
  useEffect(() => {
    setProducts([]);
    setCurrentPage(1);
    setHasMore(false);
    setDidLoad(false);
    loadPage(1, true).catch(() => setDidLoad(true));
  }, [baseParams, loadPage]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isFetching && !isLoading) {
          loadPage(currentPage + 1).catch(() => undefined);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, isFetching, isLoading, currentPage, loadPage]);

  if (!didLoad && isLoading) {
    return (
      <div
        id={`${testId}-loading`}
        data-testid={`${testId}-loading`}
        className="flex align-items-center justify-content-center py-8"
      >
        <ProgressSpinner
          style={{ width: '50px', height: '50px' }}
          strokeWidth="4"
        />
      </div>
    );
  }

  if (isError) {
    const errorMessage = error && 'data' in error
      ? (error.data as { message?: string })?.message || 'Error al cargar productos'
      : 'Error al cargar productos';

    return (
      <EmptyState
        testId={`${testId}-error`}
        icon="pi pi-exclamation-circle"
        title="Error"
        message={errorMessage}
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        testId={`${testId}-empty`}
        icon="pi pi-box"
        title="No hay productos"
        message="No se encontraron productos con los filtros seleccionados."
      />
    );
  }

  return (
    <div id={testId} data-testid={testId} className="flex flex-column gap-3">
      {/* Products grid */}
      <div className="grid" data-testid={`${testId}-items`}>
        {products.map((product) => (
          <div key={product.id} className="col-12 sm:col-6 md:col-4 lg:col-3">
            <ProductCard product={product} testId="product-card" mode={mode} />
          </div>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} />

      {/* Loading more indicator */}
      {isFetching && didLoad && (
        <div className="flex align-items-center justify-content-center py-4" data-testid={`${testId}-loading-more`}>
          <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
        </div>
      )}
    </div>
  );
}
