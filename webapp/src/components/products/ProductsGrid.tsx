'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { VirtualScroller, type VirtualScrollerLazyEvent } from 'primereact/virtualscroller';
import { useAppSelector } from '@/store/hooks';
import { useLazyGetProductsQuery } from '@/store/api/productsApi';
import { useGetMyProfileQuery } from '@/store/api/usersApi';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
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
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [loadProducts, { isFetching, isLoading, isError, error }] = useLazyGetProductsQuery();
  const { data: profile } = useGetMyProfileQuery(undefined, { skip: mode === 'admin-preview' || !isAuthenticated });
  const [items, setItems] = useState<Array<ProductDto | null>>([]);
  const [pageSize, setPageSize] = useState(20);
  const [didLoad, setDidLoad] = useState(false);
  const [columns, setColumns] = useState(4);

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

  const ensureItemsLength = useCallback((nextTotal: number) => {
    setItems((prev) => {
      if (prev.length === nextTotal) return prev;
      return Array.from({ length: nextTotal }, (_, idx) => prev[idx] ?? null);
    });
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, first: number, rows: number) => {
      const result = await loadProducts({ ...baseParams, page: pageToLoad, pageSize: rows }).unwrap();
      setPageSize(result.pageSize);
      ensureItemsLength(result.totalCount);
      setItems((prev) => {
        const next = prev.length === result.totalCount ? [...prev] : Array(result.totalCount).fill(null);
        result.items.forEach((item, index) => {
          next[first + index] = item;
        });
        return next;
      });
      setDidLoad(true);
    },
    [baseParams, ensureItemsLength, loadProducts]
  );

  // Load first page on filters change
  useEffect(() => {
    setItems([]);
    setDidLoad(false);
    loadPage(1, 0, pageSize).catch(() => setDidLoad(true));
  }, [baseParams, loadPage]);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 960) {
        setColumns(2);
      } else if (width < 1200) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

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

  if (items.length === 0 && didLoad) {
    return (
      <EmptyState
        testId={`${testId}-empty`}
        icon="pi pi-box"
        title="No hay productos"
        message="No se encontraron productos con los filtros seleccionados."
      />
    );
  }

  const itemTemplate = (product: ProductDto | null, options: { index: number }) => {
    if (!product) {
      return (
        <div className="p-2">
          <div className="surface-card border-round p-4" style={{ minHeight: 260 }}>
            <div className="product-image-placeholder" style={{ height: 180, borderRadius: '8px' }} />
            <div className="mt-3 h-1rem surface-200 border-round" />
            <div className="mt-2 h-1rem surface-200 border-round w-6" />
          </div>
        </div>
      );
    }

    return (
      <div className="p-2">
        <ProductCard
          product={product}
          testId="product-card"
          mode={mode}
          userDiscountPercent={profile?.discountPercent ?? 0}
        />
      </div>
    );
  };

  const handleLazyLoad = (event: VirtualScrollerLazyEvent) => {
    const first = event.first ?? 0;
    const rows = event.rows ?? pageSize;
    const page = Math.floor(first / rows) + 1;

    const isLoaded = items[first] !== null && items[first] !== undefined;
    if (!isLoaded) {
      loadPage(page, first, rows).catch(() => undefined);
    }
  };

  return (
    <div
      id={testId}
      data-testid={testId}
      className="flex flex-column gap-3 products-virtual-grid"
      style={{ ['--grid-columns' as string]: String(columns) }}
    >
      <VirtualScroller
        id={`${testId}-items`}
        data-testid={`${testId}-items`}
        items={items}
        itemSize={320}
        lazy
        onLazyLoad={handleLazyLoad}
        className="w-full products-virtual-grid__scroller"
        style={{ minHeight: '60vh' }}
        itemTemplate={itemTemplate}
      />

      {isFetching && didLoad && (
        <div className="flex align-items-center justify-content-center py-4" data-testid={`${testId}-loading-more`}>
          <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
        </div>
      )}

      <style>{`
        .products-virtual-grid__scroller .p-virtualscroller-content {
          display: grid;
          grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
          gap: 1rem;
        }
      `}</style>
    </div>
  );
}
