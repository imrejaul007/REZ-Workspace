import { Response } from 'express';

export const errors = {
  notFound: (resource = 'Resource') => ({
    code: 'NOT_FOUND',
    message: `${resource} not found`,
  }),
  unauthorized: () => ({
    code: 'UNAUTHORIZED',
    message: 'Unauthorized access',
  }),
  forbidden: () => ({
    code: 'FORBIDDEN',
    message: 'Access forbidden',
  }),
  badRequest: (message: string) => ({
    code: 'BAD_REQUEST',
    message,
  }),
  internalError: () => ({
    code: 'INTERNAL_ERROR',
    message: 'An internal error occurred',
  }),
  conflict: (message: string) => ({
    code: 'CONFLICT',
    message,
  }),
};

export function successResponse<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (res as any).locals?.requestId,
    },
  });
}

export function errorResponse(res: Response, error: { code: string; message: string }, status = 400): void {
  res.status(status).json({
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (res as any).locals?.requestId,
    },
  });
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): void {
  const totalPages = Math.ceil(total / limit);
  res.status(200).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (res as any).locals?.requestId,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
}
