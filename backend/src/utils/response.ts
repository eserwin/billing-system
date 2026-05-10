import { PaginatedResult } from '../types/common';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = { success: true, data };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

export function paginatedResponse<T>(result: PaginatedResult<T>): ApiSuccessResponse<T[]> {
  return {
    success: true,
    data: result.data,
    meta: result.meta,
  };
}

export function errorResponse(message: string, errors?: ValidationError[]): ApiErrorResponse {
  const response: ApiErrorResponse = { success: false, message };
  if (errors) {
    response.errors = errors;
  }
  return response;
}

export function httpResponse(statusCode: number, body: ApiResponse<unknown>) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}
