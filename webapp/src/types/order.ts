/**
 * Order types
 */

export type OrderStatus =
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'ModificationPending'
  | 'Confirmed'
  | 'ReadyForPickup'
  | 'Completed'
  | 'Cancelled';

export interface OrderItemDto {
  productId: string;
  productCode: string;
  productName: string;
  productImageUrl?: string | null;
  productImageAlt?: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  unitPriceWithDiscount: number;
  lineTotal: number;
  subtotal: number;
  product?: {
    images?: { url: string; altText: string; isPrimary: boolean }[];
  };
}

export interface OrderStatusHistoryDto {
  status: OrderStatus;
  changedAtUtc: string;
  changedByUserId?: string;
  notes?: string;
}

export interface OrderDto {
  id: string;
  number: string;
  orderNumber: string; // alias for number
  status: OrderStatus;
  userId: string;
  userPhoneNumber?: string | null;
  userDiscountPercent: number;
  subtotal: number;
  discountTotal: number;
  bulkDiscountAmount: number;
  total: number;
  currency: string;
  userNotes: string | null;
  adminNotes: string | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
  modificationReason: string | null;
  originalTotal: number | null;
  modifiedAtUtc: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  approvedAtUtc: string | null;
  confirmedAtUtc: string | null;
  readyAtUtc: string | null;
  items: OrderItemDto[];
  statusHistory?: OrderStatusHistoryDto[];
}

export interface OrderSummaryDto {
  id: string;
  number: string;
  status: OrderStatus;
  userId: string;
  total: number;
  currency: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  itemCount: number;
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: OrderStatus;
  createdFromUtc?: string;
  createdToUtc?: string;
  sortBy?: 'CreatedAt' | 'Number' | 'Status' | 'Total';
  sortDir?: 'ASC' | 'DESC';
  userId?: string;
}

export interface OrderConfirmRequest {
  note?: string;
}

export interface OrderCancelRequest {
  reason: string;
}

export interface OrderApproveRequest {
  adminNotes?: string;
}

export interface OrderRejectRequest {
  reason: string;
}

export interface OrderReadyRequest {
  readyNotes?: string;
}

export interface OrderCompleteRequest {
  completionNotes?: string;
}

export interface OrderModifyItemRequest {
  productId: string;
  newQuantity: number;
}

export interface OrderModifyRequest {
  reason: string;
  items: OrderModifyItemRequest[];
  adminNotes?: string;
}

export interface OrderAcceptModificationsRequest {
  note?: string;
}

export interface OrderRejectModificationsRequest {
  reason: string;
}

/**
 * Get human-readable order status label
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PendingApproval: 'Pendiente de aprobación',
    Approved: 'Aprobado',
    Rejected: 'Rechazado',
    ModificationPending: 'Modificación pendiente',
    Confirmed: 'Confirmado',
    ReadyForPickup: 'Listo para retiro',
    Completed: 'Completado',
    Cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

/**
 * Get PrimeReact severity for order status
 */
export function getOrderStatusSeverity(
  status: OrderStatus
): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | null {
  const severities: Record<OrderStatus, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
    PendingApproval: 'warning',
    Approved: 'info',
    Rejected: 'danger',
    ModificationPending: 'warning',
    Confirmed: 'info',
    ReadyForPickup: 'success',
    Completed: 'success',
    Cancelled: 'danger',
  };
  return severities[status] || null;
}

