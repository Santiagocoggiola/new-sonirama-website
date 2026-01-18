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
  userDiscountPercent: number;
  unitPriceWithDiscount: number;
  lineTotal: number;
  minBulkQuantityApplied: number | null;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  subtotal: number;
  discountTotal: number;
  userDiscountPercent: number;
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
