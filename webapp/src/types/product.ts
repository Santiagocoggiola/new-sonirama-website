/**
 * Product types
 */

export interface ProductImageDto {
  id: string;
  productId: string;
  fileName: string;
  relativePath: string;
  url: string;
  uploadedAtUtc: string;
}

export interface ProductCategoryDto {
  id: string;
  name: string;
}

export interface BulkDiscountDto {
  id: string;
  productId: string;
  minQuantity: number;
  discountPercent: number;
  startsAtUtc: string | null;
  endsAtUtc: string | null;
  isActive: boolean;
}

export interface ProductDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string | null;
  categories?: ProductCategoryDto[];
  minBulkQuantity: number | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  images: ProductImageDto[];
  bulkDiscounts?: BulkDiscountDto[];
}

export interface ProductCreateRequest {
  code: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  categoryIds?: string[];
  isActive?: boolean;
  images?: File[];
}

export interface ProductUpdateRequest {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  categoryIds?: string[];
  isActive?: boolean;
  images?: File[];
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  category?: string;
  categoryIds?: string[];
  priceMin?: number;
  priceMax?: number;
  isActive?: boolean;
  sortBy?: 'CreatedAt' | 'Code' | 'Name' | 'Price';
  sortDir?: 'ASC' | 'DESC';
}

export interface BulkDiscountCreateRequest {
  minQuantity: number;
  discountPercent: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export interface BulkDiscountUpdateRequest {
  minQuantity: number;
  discountPercent: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}
