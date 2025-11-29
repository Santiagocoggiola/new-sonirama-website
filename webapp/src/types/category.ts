/**
 * Category types
 */

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  parentIds: string[];
  childIds: string[];
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  parentIds?: string[];
}

export interface CategoryUpdateRequest {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  parentIds?: string[];
}

export interface CategoryListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  isActive?: boolean;
  sortBy?: 'Name' | 'Slug' | 'CreatedAt';
  sortDir?: 'ASC' | 'DESC';
}
