import { Response } from 'express';
export const errors = {
  notFound: (r = 'Resource') => ({ code: 'NOT_FOUND', message: r + ' not found' }),
  badRequest: (m: string) => ({ code: 'BAD_REQUEST', message: m }),
  internalError: () => ({ code: 'INTERNAL_ERROR', message: 'Internal error' })
};
export function successResponse<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ success: true, data, meta: { timestamp: new Date().toISOString() } });
}
export function errorResponse(res: Response, error: { code: string; message: string }, status = 400): void {
  res.status(status).json({ success: false, error, meta: { timestamp: new Date().toISOString() } });
}
