import { ReactNode } from "react";

// Nullable type wrapper
export type Nullable<D> = D | null | undefined;

// Basic select option
export interface BasicSelectOpt<T = string> {
  label: ReactNode | string;
  value: T;
}

// API Response
export interface ApiResponse<T> {
  status: boolean;
  data: T;
  message?: string;
}

// API Pagination Response
export interface ApiPaginationResponse<T> extends ApiResponse<T> {
  total: number;
  pagination: {
    page: number;
    limit: number;
  };
}

// Enums
export enum RoleEnum {
  ADMIN = "admin",
  USER = "user",
}