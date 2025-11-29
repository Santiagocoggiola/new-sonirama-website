'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setQuery,
  toggleCategoryId,
  setPriceRange,
  clearFilters,
  selectFilters,
  selectHasActiveFilters,
} from '@/store/slices/filtersSlice';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { formatPrice, debounce } from '@/lib/utils';

interface SidebarProps {
  /** Whether sidebar is visible (mobile) */
  visible?: boolean;
  /** Callback to hide sidebar (mobile) */
  onHide?: () => void;
  /** Whether to render as overlay (mobile) */
  modal?: boolean;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Sidebar component with product filters
 */
export function Sidebar({
  visible = true,
  onHide,
  modal = false,
  testId = 'sidebar',
}: SidebarProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  
  // Local state for debounced inputs
  const [searchValue, setSearchValue] = useState(filters.query);
  const [priceRange, setPriceRangeLocal] = useState<[number, number]>([
    filters.priceMin ?? 0,
    filters.priceMax ?? 100000,
  ]);

  // Fetch categories
  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategoriesQuery({
    isActive: true,
    pageSize: 100,
  });
  const categories = categoriesData?.items ?? [];

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      dispatch(setQuery(value));
    }, 300),
    [dispatch]
  );

  // Debounced price range
  const debouncedPriceRange = useCallback(
    debounce((min: number, max: number) => {
      dispatch(setPriceRange({ 
        min: min > 0 ? min : null, 
        max: max < 100000 ? max : null 
      }));
    }, 300),
    [dispatch]
  );

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handlePriceRangeChange = (value: number | [number, number]) => {
    const range = Array.isArray(value) ? value : [value, value];
    setPriceRangeLocal(range as [number, number]);
    debouncedPriceRange(range[0], range[1]);
  };

  const handleCategoryToggle = (categoryId: string) => {
    dispatch(toggleCategoryId(categoryId));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchValue('');
    setPriceRangeLocal([0, 100000]);
  };

  // Sync local state with Redux on external changes
  useEffect(() => {
    setSearchValue(filters.query);
  }, [filters.query]);

  useEffect(() => {
    setPriceRangeLocal([
      filters.priceMin ?? 0,
      filters.priceMax ?? 100000,
    ]);
  }, [filters.priceMin, filters.priceMax]);

  const content = (
    <div
      id={testId}
      data-testid={testId}
      className="flex flex-column gap-4"
    >
      {/* Search */}
      <div className="flex flex-column gap-2">
        <span className="p-input-icon-left w-full">
          <i className="pi pi-search" />
          <InputText
            id={`${testId}-search`}
            data-testid={`${testId}-search`}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full"
          />
        </span>
      </div>

      <Divider className="my-0" />

      {/* Categories */}
      <div className="flex flex-column gap-3">
        <span className="font-semibold text-color">Categorías</span>
        {isCategoriesLoading ? (
          <div className="flex align-items-center gap-2 text-color-secondary">
            <i className="pi pi-spin pi-spinner" />
            <span>Cargando...</span>
          </div>
        ) : categories.length === 0 ? (
          <span className="text-color-secondary text-sm">
            No hay categorías disponibles
          </span>
        ) : (
          <div
            id={`${testId}-categories`}
            data-testid={`${testId}-categories`}
            className="flex flex-column gap-2"
          >
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex align-items-center gap-2"
              >
                <Checkbox
                  inputId={`${testId}-category-${category.id}`}
                  data-testid={`${testId}-category-${category.id}`}
                  checked={filters.categoryIds.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                />
                <label
                  htmlFor={`${testId}-category-${category.id}`}
                  className="cursor-pointer text-sm"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider className="my-0" />

      {/* Price range */}
      <div className="flex flex-column gap-3">
        <span className="font-semibold text-color">Rango de precio</span>
        <Slider
          id={`${testId}-price-slider`}
          data-testid={`${testId}-price-slider`}
          value={priceRange}
          onChange={(e) => handlePriceRangeChange(e.value as [number, number])}
          range
          min={0}
          max={100000}
          step={1000}
          className="w-full"
        />
        <div className="flex align-items-center justify-content-between text-sm text-color-secondary">
          <span data-testid={`${testId}-price-min`}>
            {formatPrice(priceRange[0])}
          </span>
          <span data-testid={`${testId}-price-max`}>
            {formatPrice(priceRange[1])}
          </span>
        </div>
      </div>

      <Divider className="my-0" />

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          id={`${testId}-clear-filters`}
          data-testid={`${testId}-clear-filters`}
          label="Limpiar filtros"
          icon="pi pi-filter-slash"
          outlined
          severity="secondary"
          className="w-full"
          onClick={handleClearFilters}
        />
      )}
    </div>
  );

  // Mobile: Render as overlay sidebar
  if (modal) {
    return (
      <PrimeSidebar
        visible={visible}
        onHide={onHide || (() => {})}
        position="left"
        className="w-20rem"
        id={`${testId}-mobile`}
        data-testid={`${testId}-mobile`}
        header={
          <span className="font-bold text-xl">Filtros</span>
        }
      >
        {content}
      </PrimeSidebar>
    );
  }

  // Desktop: Render as fixed sidebar
  return (
    <aside
      className="surface-card border-right-1 surface-border h-full overflow-y-auto p-3"
      style={{ width: 'var(--sidebar-width)', minWidth: '200px' }}
    >
      {content}
    </aside>
  );
}
