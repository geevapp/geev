/**
 * API Response utilities for consistent API responses
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a successful API response
 */
export function apiSuccess<T>(data: T, message?: string): Response {
  return Response.json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
}

/**
 * Create an error API response
 */
export function apiError(message: string, status: number = 400): Response {
  return Response.json({
    success: false,
    error: message,
  } as ApiResponse, { status });
}