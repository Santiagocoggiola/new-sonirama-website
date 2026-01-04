'use client';

import { useCallback, useMemo } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Card } from 'primereact/card';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectFilters, setQuery, setSort, setCategoryIds, setPriceRange, clearFilters } from '@/store/slices/filtersSlice';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { ProductsGrid } from '@/components/products';

/**
 * Products page client component with filters
 */
export type ProductsPageMode = 'user' | 'admin-preview';

export function ProductsPageClient({ mode = 'user' }: { mode?: ProductsPageMode }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesQuery({ pageSize: 200, isActive: true });
  const categoryOptions = useMemo(
    () => [
      { label: 'Todas las categorías', value: null },
      ...(categoriesData?.items ?? []).map((cat) => ({ label: cat.name, value: cat.id })),
    ],
    [categoriesData]
  );

  const sortOptions = [
    { label: 'Más recientes', value: { sortBy: 'CreatedAt', sortDir: 'DESC' as const } },
    { label: 'Precio: menor a mayor', value: { sortBy: 'Price', sortDir: 'ASC' as const } },
    { label: 'Precio: mayor a menor', value: { sortBy: 'Price', sortDir: 'DESC' as const } },
    { label: 'Nombre A-Z', value: { sortBy: 'Name', sortDir: 'ASC' as const } },
    { label: 'Nombre Z-A', value: { sortBy: 'Name', sortDir: 'DESC' as const } },
    { label: 'Código', value: { sortBy: 'Code', sortDir: 'ASC' as const } },
  ];

  const handleSearch = useCallback((value: string) => {
    dispatch(setQuery(value));
  }, [dispatch]);

  const handleSortChange = useCallback((val: { sortBy: typeof filters.sortBy; sortDir: typeof filters.sortDir }) => {
    dispatch(setSort(val));
  }, [dispatch]);

  const handleCategory = useCallback((value: string | null) => {
    dispatch(setCategoryIds(value ? [value] : []));
  }, [dispatch]);

  const handlePriceMin = useCallback((value: number | null) => {
    dispatch(setPriceRange({ min: value, max: filters.priceMax }));
  }, [dispatch, filters.priceMax]);

  const handlePriceMax = useCallback((value: number | null) => {
    dispatch(setPriceRange({ min: filters.priceMin, max: value }));
  }, [dispatch, filters.priceMin]);

  const handleClear = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  return (
    <div id="products-page" data-testid="products-page" className="products-page">
      <div className="products-shell">
        <aside className="products-sidebar">
          <Card className="shadow-1 products-sidebar-card" pt={{ content: { className: 'p-3' } }}>
            <div className="flex flex-column gap-3">
              <div className="flex flex-column gap-2">
                <label className="font-medium">Buscar</label>
                <InputText
                  value={filters.query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Nombre o código"
                  data-testid="products-search-side"
                />
              </div>

              <div className="flex flex-column gap-2">
                <label className="font-medium">Categoría</label>
                <Dropdown
                  value={filters.categoryIds[0] ?? null}
                  options={categoryOptions}
                  onChange={(e) => handleCategory(e.value)}
                  placeholder="Todas"
                  loading={isLoadingCategories}
                  className="w-full"
                  data-testid="products-category-side"
                />
              </div>

              <div className="flex flex-column gap-2">
                <label className="font-medium">Precio</label>
                <div className="flex gap-2">
                  <InputNumber
                    value={filters.priceMin}
                    onValueChange={(e) => handlePriceMin(e.value ?? null)}
                    mode="currency"
                    currency="ARS"
                    locale="es-AR"
                    placeholder="Mín"
                    className="w-full"
                    inputClassName="w-full"
                    data-testid="products-price-min"
                  />
                  <InputNumber
                    value={filters.priceMax}
                    onValueChange={(e) => handlePriceMax(e.value ?? null)}
                    mode="currency"
                    currency="ARS"
                    locale="es-AR"
                    placeholder="Máx"
                    className="w-full"
                    inputClassName="w-full"
                    data-testid="products-price-max"
                  />
                </div>
              </div>

              <div className="flex flex-column gap-2">
                <label className="font-medium">Ordenar por</label>
                <Dropdown
                  value={{ sortBy: filters.sortBy, sortDir: filters.sortDir }}
                  options={sortOptions}
                  optionLabel="label"
                  onChange={(e) => handleSortChange(e.value)}
                  className="w-full"
                  data-testid="products-sort-side"
                />
              </div>

              <Button
                type="button"
                label="Limpiar filtros"
                icon="pi pi-filter-slash"
                outlined
                severity="secondary"
                onClick={handleClear}
                data-testid="products-clear-side"
              />
            </div>
          </Card>
        </aside>

        <main className="products-main">
          <ProductsGrid testId="products-grid" mode={mode} />
        </main>
      </div>

      <style jsx>{`
        .products-page {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: calc(100% + 2rem);
          margin-left: -1rem;
          margin-right: -1rem;
          padding-left: 0;
          padding-right: 0;
        }

        .products-main {
          flex: 1;
          min-width: 0;
          margin-top: 0.5rem;
        }

        @media (min-width: 768px) {
          .products-page {
            width: calc(100% + 3rem);
            margin-left: -1.5rem;
            margin-right: -1.5rem;
          }

          .products-main {
            margin-top: 0.75rem;
          }
        }

        @media (min-width: 992px) {
          .products-page {
            width: calc(100% + 4rem);
            margin-left: -2rem;
            margin-right: -2rem;
          }

          .products-main {
            margin-top: 1rem;
          }
        }

        .products-shell {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          width: 100%;
        }

        .products-sidebar {
          position: sticky;
          top: 0;
          width: 340px;
          flex-shrink: 0;
          align-self: flex-start;
          margin-left: 0;
          margin-top: -1rem;
        }

        .products-main {
          flex: 1;
          min-width: 0;
        }

        :global(.products-sidebar-card.p-card) {
          border-radius: 0;
        }

        :global(.products-sidebar-card .p-card-body) {
          padding: 0;
        }

        @media (max-width: 960px) {
          .products-shell {
            flex-direction: column;
          }

          .products-sidebar {
            position: static;
            width: 100%;
            margin-left: 0;
            margin-top: 0;
          }
        }

        @media (min-width: 768px) {
          .products-sidebar {
            margin-top: -1.5rem;
          }
        }

        @media (min-width: 992px) {
          .products-sidebar {
            margin-top: -2rem;
          }
        }
      `}</style>
    </div>
  );
}
