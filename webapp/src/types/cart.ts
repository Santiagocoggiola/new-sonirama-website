/**
 * Cart types
 */

export interface CartItemDto {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPriceBase: number;
  discountPercent: number;
  unitPriceWithDiscount: number;
  lineTotal: number;
  minBulkQuantityApplied: number | null;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  total: number;
  updatedAtUtc: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface RemoveFromCartParams {
  productId: string;
  quantity?: number;
}
