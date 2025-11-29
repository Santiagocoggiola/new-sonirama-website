import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

type SortDirection = 'ASC' | 'DESC';

interface ProductFiltersState {
  query: string;
  categoryIds: string[];
  priceMin: number | null;
  priceMax: number | null;
  isActive: boolean | null;
  sortBy: 'CreatedAt' | 'Code' | 'Name' | 'Price';
  sortDir: SortDirection;
}

const initialState: ProductFiltersState = {
  query: '',
  categoryIds: [],
  priceMin: null,
  priceMax: null,
  isActive: null,
  sortBy: 'CreatedAt',
  sortDir: 'DESC',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setCategoryIds: (state, action: PayloadAction<string[]>) => {
      state.categoryIds = action.payload;
    },
    addCategoryId: (state, action: PayloadAction<string>) => {
      if (!state.categoryIds.includes(action.payload)) {
        state.categoryIds.push(action.payload);
      }
    },
    removeCategoryId: (state, action: PayloadAction<string>) => {
      state.categoryIds = state.categoryIds.filter((id) => id !== action.payload);
    },
    toggleCategoryId: (state, action: PayloadAction<string>) => {
      const index = state.categoryIds.indexOf(action.payload);
      if (index === -1) {
        state.categoryIds.push(action.payload);
      } else {
        state.categoryIds.splice(index, 1);
      }
    },
    setPriceRange: (
      state,
      action: PayloadAction<{ min: number | null; max: number | null }>
    ) => {
      state.priceMin = action.payload.min;
      state.priceMax = action.payload.max;
    },
    setIsActive: (state, action: PayloadAction<boolean | null>) => {
      state.isActive = action.payload;
    },
    setSortBy: (
      state,
      action: PayloadAction<'CreatedAt' | 'Code' | 'Name' | 'Price'>
    ) => {
      state.sortBy = action.payload;
    },
    setSortDir: (state, action: PayloadAction<SortDirection>) => {
      state.sortDir = action.payload;
    },
    setSort: (
      state,
      action: PayloadAction<{
        sortBy: 'CreatedAt' | 'Code' | 'Name' | 'Price';
        sortDir: SortDirection;
      }>
    ) => {
      state.sortBy = action.payload.sortBy;
      state.sortDir = action.payload.sortDir;
    },
    clearFilters: (state) => {
      state.query = '';
      state.categoryIds = [];
      state.priceMin = null;
      state.priceMax = null;
      state.isActive = null;
      state.sortBy = 'CreatedAt';
      state.sortDir = 'DESC';
    },
    resetFiltersKeepSort: (state) => {
      state.query = '';
      state.categoryIds = [];
      state.priceMin = null;
      state.priceMax = null;
      state.isActive = null;
    },
  },
});

export const {
  setQuery,
  setCategoryIds,
  addCategoryId,
  removeCategoryId,
  toggleCategoryId,
  setPriceRange,
  setIsActive,
  setSortBy,
  setSortDir,
  setSort,
  clearFilters,
  resetFiltersKeepSort,
} = filtersSlice.actions;

// Selectors
export const selectFilters = (state: { filters: ProductFiltersState }) =>
  state.filters;
export const selectQuery = (state: { filters: ProductFiltersState }) =>
  state.filters.query;
export const selectCategoryIds = (state: { filters: ProductFiltersState }) =>
  state.filters.categoryIds;
export const selectPriceRange = (state: { filters: ProductFiltersState }) => ({
  min: state.filters.priceMin,
  max: state.filters.priceMax,
});
export const selectIsActiveFilter = (state: { filters: ProductFiltersState }) =>
  state.filters.isActive;
export const selectSortBy = (state: { filters: ProductFiltersState }) =>
  state.filters.sortBy;
export const selectSortDir = (state: { filters: ProductFiltersState }) =>
  state.filters.sortDir;
export const selectHasActiveFilters = (state: { filters: ProductFiltersState }) =>
  state.filters.query !== '' ||
  state.filters.categoryIds.length > 0 ||
  state.filters.priceMin !== null ||
  state.filters.priceMax !== null ||
  state.filters.isActive !== null;

export const selectActiveFiltersCount = (state: { filters: ProductFiltersState }) => {
  let count = 0;
  if (state.filters.query !== '') count++;
  count += state.filters.categoryIds.length;
  if (state.filters.priceMin !== null || state.filters.priceMax !== null) count++;
  if (state.filters.isActive !== null) count++;
  return count;
};

export default filtersSlice.reducer;
