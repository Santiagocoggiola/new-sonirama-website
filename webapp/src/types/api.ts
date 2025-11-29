/**
 * Generic API response types
 */

export interface PagedResult<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}

export interface ApiError {
  error: string;
  detalles?: Record<string, string[]>;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface CountResponse {
  count: number;
}

export interface DeletedResponse {
  deleted: boolean;
}

export interface MarkedAsReadResponse {
  markedAsRead: number;
}
