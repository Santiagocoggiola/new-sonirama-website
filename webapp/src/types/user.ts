/**
 * User types
 */

import type { UserRole } from './auth';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  discountPercent: number;
  role: UserRole;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface UserCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  discountPercent?: number;
  role?: UserRole;
}

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  discountPercent: number;
  role: UserRole;
  isActive: boolean;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  query?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: 'Email' | 'FirstName' | 'LastName' | 'CreatedAt';
  sortDir?: 'ASC' | 'DESC';
}
