import { ReactNode } from "react";

// Nullable type wrapper
export type Nullable<D> = D | null | undefined;

// Basic select option
export interface BasicSelectOpt<T = string> {
  label: ReactNode | string;
  value: T;
}

// API Standard Response type
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

// Global enums used across modules
export enum RoleEnum {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
}
