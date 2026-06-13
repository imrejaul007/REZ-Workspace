// Standard API response helpers

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

export function errorResponse(error: string, code?: string): ApiResponse {
  return {
    success: false,
    error,
    ...(code && { code }),
  };
}

export function createdResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message: message || 'Created successfully',
  };
}

export function notFoundResponse(resource: string): ApiResponse {
  return {
    success: false,
    error: `${resource} not found`,
    code: 'NOT_FOUND',
  };
}

export function validationErrorResponse(errors: Array<{ field: string; message: string }>): ApiResponse {
  return {
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
  };
}