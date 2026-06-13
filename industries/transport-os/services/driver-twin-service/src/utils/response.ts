import { Response } from 'express';

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

/**
 * Send success response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Send created response
 */
export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return res.status(201).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): Response {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  });
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  statusCode: number,
  error: string,
  code?: string,
  metadata?: Record<string, any>
): Response {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(code && { code }),
    ...(metadata && { metadata }),
  });
}

/**
 * Send not found response
 */
export function sendNotFound(res: Response, resource: string, id?: string): Response {
  return res.status(404).json({
    success: false,
    error: `${resource} not found${id ? `: ${id}` : ''}`,
    code: `${resource.toUpperCase().replace(' ', '_')}_NOT_FOUND`,
  });
}

/**
 * Send conflict response
 */
export function sendConflict(res: Response, error: string, code?: string): Response {
  return res.status(409).json({
    success: false,
    error,
    ...(code && { code }),
  });
}

/**
 * Send validation error response
 */
export function sendValidationError(res: Response, errors: any[]): Response {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    metadata: { errors },
  });
}

/**
 * Send unauthorized response
 */
export function sendUnauthorized(res: Response, message = 'Unauthorized'): Response {
  return res.status(401).json({
    success: false,
    error: message,
    code: 'UNAUTHORIZED',
  });
}

/**
 * Send forbidden response
 */
export function sendForbidden(res: Response, message = 'Forbidden'): Response {
  return res.status(403).json({
    success: false,
    error: message,
    code: 'FORBIDDEN',
  });
}
