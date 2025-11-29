'use client';

import { useCallback, useEffect, useRef } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAppSelector } from '@/store/hooks';
import { useGetProductsQuery } from '@/store/api/productsApi';
import { selectFilters } from '@/store/slices/filtersSlice';
import { ProductCard } from './ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

interface ProductsGridProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Products grid with infinite scroll and filtering
 */
export function ProductsGrid({ testId = 'products-grid' }: ProductsGridProps) {
  const filters = useAppSelector(selectFilters);
  
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetProductsQuery({
    query: filters.query || undefined,
    categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    priceMin: filters.priceMin ?? undefined,
    priceMax: filters.priceMax ?? undefined,
    isActive: filters.isActive ?? true,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  });

  const products = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const currentPage = data?.page ?? 1;
  const hasMore = (currentPage * pageSize) < totalCount;

  // For now, we fetch all with pagination params from filters
  // In future, implement proper infinite scroll by incrementing page

  if (isLoading) {
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
    <div id={testId} data-testid={testId}>
      {/* Results count */}
      <div
        className="mb-3 text-color-secondary"
        data-testid={`${testId}-count`}
      >
        {data?.totalCount === 1
          ? '1 producto encontrado'
          : `${data?.totalCount ?? products.length} productos encontrados`}
      </div>

      {/* Products grid */}
      <div
        className="grid"
        data-testid={`${testId}-items`}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="col-12 sm:col-6 md:col-4 lg:col-3"
          >
            <ProductCard
              product={product}
              testId="product-card"
            />
          </div>
        ))}
      </div>

      {/* Loading more indicator */}
      {isFetching && !isLoading && (
        <div
          className="flex align-items-center justify-content-center py-4"
          data-testid={`${testId}-loading-more`}
        >
          <ProgressSpinner
            style={{ width: '30px', height: '30px' }}
            strokeWidth="4"
          />
        </div>
      )}
    </div>
  );
}
