import { Response } from 'express';

// ============================================================================
// SUCCESS RESPONSE
// ============================================================================

export function successResponse<T>(res: Response, data: T, statusCode: number = 200): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function createdResponse<T>(res: Response, data: T, message?: string): Response {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
}

// ============================================================================
// ERROR RESPONSE
// ============================================================================

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 500,
  code?: string
): Response {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(code && { code }),
  });
}

export function notFoundResponse(res: Response, resource: string = 'Resource'): Response {
  return res.status(404).json({
    success: false,
    error: `${resource} not found`,
    code: 'NOT_FOUND',
  });
}

export function validationErrorResponse(
  res: Response,
  errors: Array<{ path: string; message: string }>
): Response {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: { errors },
  });
}

export function unauthorizedResponse(res: Response, message: string = 'Unauthorized'): Response {
  return res.status(401).json({
    success: false,
    error: message,
    code: 'UNAUTHORIZED',
  });
}

export function forbiddenResponse(res: Response, message: string = 'Forbidden'): Response {
  return res.status(403).json({
    success: false,
    error: message,
    code: 'FORBIDDEN',
  });
}

// ============================================================================
// PAGINATED RESPONSE
// ============================================================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta
): Response {
  return res.status(200).json({
    success: true,
    data,
    pagination,
  });
}