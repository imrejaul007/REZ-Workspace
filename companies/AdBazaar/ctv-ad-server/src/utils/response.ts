import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode: number = 500,
  code?: string
): void => {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  if (code) {
    (response as any).code = code;
  }

  res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message?: string): void => {
  sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

export const sendNotFound = (res: Response, resource: string = 'Resource'): void => {
  sendError(res, `${resource} not found`, 404, 'NOT_FOUND');
};

export const sendBadRequest = (res: Response, error: string): void => {
  sendError(res, error, 400, 'BAD_REQUEST');
};

export const sendUnauthorized = (res: Response, error: string = 'Unauthorized'): void => {
  sendError(res, error, 401, 'UNAUTHORIZED');
};

export const sendForbidden = (res: Response, error: string = 'Forbidden'): void => {
  sendError(res, error, 403, 'FORBIDDEN');
};

export const sendConflict = (res: Response, error: string): void => {
  sendError(res, error, 409, 'CONFLICT');
};

export const sendTooManyRequests = (res: Response, error: string = 'Too many requests'): void => {
  sendError(res, error, 429, 'RATE_LIMITED');
};

export const sendInternalError = (res: Response, error: string = 'Internal server error'): void => {
  sendError(res, error, 500, 'INTERNAL_ERROR');
};