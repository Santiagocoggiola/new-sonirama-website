'use client';

import { ProductsGrid, ProductFilters } from '@/components/products';

/**
 * Products page client component with filters
 */
export function ProductsPageClient() {
  return (
    <div id="products-page" data-testid="products-page" className="flex flex-column gap-4">
      {/* Header with title and filters */}
      <div className="flex align-items-center justify-content-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold m-0 text-color">
          Productos
        </h1>
        <ProductFilters testId="product-filters" />
      </div>
      
      {/* Products grid */}
      <ProductsGrid testId="products-grid" />
    </div>
  );
}
