import { logger } from '../../shared/logger';
/**
 * Validation utilities for AI Front Desk Service
 */

import { Request, Response, NextFunction } from 'express';

// Validation error class
export class ValidationError extends Error {
  public statusCode: number;
  public field?: string;

  constructor(message: string, field?: string, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.field = field;
  }
}

// Guest validation
export function validateGuestInput(req: Request, res: Response, next: NextFunction): void {
  const { name, phone, checkIn, roomNumber } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new ValidationError('Name is required and must be a non-empty string', 'name'));
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
    return next(new ValidationError('Phone is required and must be a non-empty string', 'phone'));
  }

  if (!checkIn) {
    return next(new ValidationError('Check-in date is required', 'checkIn'));
  }

  const checkInDate = new Date(checkIn);
  if (isNaN(checkInDate.getTime())) {
    return next(new ValidationError('Check-in date must be a valid date', 'checkIn'));
  }

  if (!roomNumber || typeof roomNumber !== 'string' || roomNumber.trim().length === 0) {
    return next(new ValidationError('Room number is required', 'roomNumber'));
  }

  next();
}

// Service request validation
export function validateServiceRequestInput(req: Request, res: Response, next: NextFunction): void {
  const { type, description } = req.body;

  const validTypes = ['room_service', 'housekeeping', 'concierge', 'maintenance', 'taxi'];
  if (!type || !validTypes.includes(type)) {
    return next(new ValidationError(`Type must be one of: ${validTypes.join(', ')}`, 'type'));
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return next(new ValidationError('Description is required and must be a non-empty string', 'description'));
  }

  next();
}

// Booking validation
export function validateBookingInput(req: Request, res: Response, next: NextFunction): void {
  const { checkIn, checkOut } = req.body;

  const checkInDate = new Date(checkIn);
  if (!checkIn || isNaN(checkInDate.getTime())) {
    return next(new ValidationError('Check-in date is required and must be a valid date', 'checkIn'));
  }

  if (checkOut) {
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkOutDate.getTime())) {
      return next(new ValidationError('Check-out date must be a valid date', 'checkOut'));
    }

    if (checkOutDate <= checkInDate) {
      return next(new ValidationError('Check-out date must be after check-in date', 'checkOut'));
    }
  }

  next();
}

// Status update validation
export function validateStatusUpdate(req: Request, res: Response, next: NextFunction): void {
  const { status } = req.body;

  if (!status || typeof status !== 'string') {
    return next(new ValidationError('Status is required', 'status'));
  }

  next();
}

// Concierge query validation
export function validateConciergeQuery(req: Request, res: Response, next: NextFunction): void {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return next(new ValidationError('Query is required and must be a non-empty string', 'query'));
  }

  if (query.length > 1000) {
    return next(new ValidationError('Query must be less than 1000 characters', 'query'));
  }

  next();
}

// Request ID validation
export function validateRequestId(req: Request, res: Response, next: NextFunction): void {
  const { id } = req.params;

  if (!id || id.trim().length === 0) {
    return next(new ValidationError('ID is required', 'id'));
  }

  next();
}

// Pagination validation
export function validatePagination(req: Request, res: Response, next: NextFunction): void {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return next(new ValidationError('Page must be a positive integer', 'page'));
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new ValidationError('Limit must be between 1 and 100', 'limit'));
    }
  }

  next();
}

// Error handler middleware
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      field: err.field,
    });
    return;
  }

  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

export default {
  validateGuestInput,
  validateServiceRequestInput,
  validateBookingInput,
  validateStatusUpdate,
  validateConciergeQuery,
  validateRequestId,
  validatePagination,
  errorHandler,
  ValidationError,
};