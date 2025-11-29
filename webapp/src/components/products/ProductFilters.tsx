'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectFilters,
  selectActiveFiltersCount,
  setQuery,
  setCategoryIds,
  setPriceRange,
  clearFilters,
} from '@/store/slices/filtersSlice';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Badge } from 'primereact/badge';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import type { RootState } from '@/store';

interface ProductFiltersProps {
  /** Whether the sidebar is visible */
  readonly visible: boolean;
  /** Callback to close the sidebar */
  readonly onHide: () => void;
  /** Test ID for Playwright */
  readonly testId?: string;
}

/**
 * Product filters sidebar overlay using PrimeReact Sidebar
 */
export function ProductFilters({
  visible,
  onHide,
  testId = 'product-filters',
}: ProductFiltersProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state: RootState) => selectFilters(state as Parameters<typeof selectFilters>[0]));
  const activeFiltersCount = useAppSelector((state: RootState) => selectActiveFiltersCount(state as Parameters<typeof selectActiveFiltersCount>[0]));
  
  const { data: categoriesData } = useGetCategoriesQuery({});
  const categories = categoriesData?.items ?? [];

  const categoryOptions = [
    { label: 'Todas las categorías', value: null },
    ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
  ];

  // Get the first selected category (for single-select dropdown)
  const selectedCategoryId = filters.categoryIds.length > 0 ? filters.categoryIds[0] : null;

  const handleSearchChange = useCallback(
    (value: string) => {
      dispatch(setQuery(value));
    },
    [dispatch]
  );

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      dispatch(setCategoryIds(value ? [value] : []));
    },
    [dispatch]
  );

  const handleMinPriceChange = useCallback(
    (value: number | null) => {
      dispatch(setPriceRange({ min: value, max: filters.priceMax }));
    },
    [dispatch, filters.priceMax]
  );

  const handleMaxPriceChange = useCallback(
    (value: number | null) => {
      dispatch(setPriceRange({ min: filters.priceMin, max: value }));
    },
    [dispatch, filters.priceMin]
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const handleApplyFilters = useCallback(() => {
    onHide();
  }, [onHide]);

  return (
    <Sidebar
      visible={visible}
      onHide={onHide}
      position="right"
      className="w-full md:w-25rem"
      header={
        <div className="flex align-items-center gap-2">
          <i className="pi pi-filter text-xl" />
          <span className="font-semibold text-xl">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge value={activeFiltersCount} severity="info" />
          )}
        </div>
      }
      data-testid={testId}
    >
      <div className="flex flex-column gap-4 p-2">
        {/* Search */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-search`} className="font-medium text-color">
            Buscar
          </label>
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              id={`${testId}-search`}
              data-testid={`${testId}-search`}
              value={filters.query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full"
            />
          </IconField>
        </div>

        {/* Category */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-category`} className="font-medium text-color">
            Categoría
          </label>
          <Dropdown
            id={`${testId}-category`}
            data-testid={`${testId}-category`}
            value={selectedCategoryId}
            options={categoryOptions}
            onChange={(e) => handleCategoryChange(e.value)}
            placeholder="Seleccionar categoría"
            className="w-full"
          />
        </div>

        {/* Price Range */}
        <fieldset className="flex flex-column gap-2 border-none p-0 m-0">
          <legend className="font-medium text-color p-0 m-0 mb-2">Rango de precio</legend>
          <div className="flex gap-2 align-items-center">
            <InputNumber
              id={`${testId}-min-price`}
              data-testid={`${testId}-min-price`}
              value={filters.priceMin}
              onValueChange={(e) => handleMinPriceChange(e.value ?? null)}
              placeholder="Mín"
              mode="currency"
              currency="ARS"
              locale="es-AR"
              className="flex-1"
              min={0}
              aria-label="Precio mínimo"
            />
            <span className="text-color-secondary">-</span>
            <InputNumber
              id={`${testId}-max-price`}
              data-testid={`${testId}-max-price`}
              value={filters.priceMax}
              onValueChange={(e) => handleMaxPriceChange(e.value ?? null)}
              placeholder="Máx"
              mode="currency"
              currency="ARS"
              locale="es-AR"
              className="flex-1"
              min={0}
              aria-label="Precio máximo"
            />
          </div>
        </fieldset>

        {/* Action buttons */}
        <div className="flex flex-column gap-2 mt-4">
          <Button
            id={`${testId}-apply`}
            data-testid={`${testId}-apply`}
            label="Aplicar filtros"
            icon="pi pi-check"
            onClick={handleApplyFilters}
            className="w-full"
          />
          {activeFiltersCount > 0 && (
            <Button
              id={`${testId}-clear`}
              data-testid={`${testId}-clear`}
              label="Limpiar filtros"
              icon="pi pi-times"
              severity="secondary"
              text
              onClick={handleClearFilters}
              className="w-full"
            />
          )}
        </div>
      </div>
    </Sidebar>
  );
}
