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
  role?: UserRole;
}

export interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
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
