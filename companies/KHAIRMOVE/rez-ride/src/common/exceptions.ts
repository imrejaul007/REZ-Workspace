import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base application error with typed codes
 */
export class AppError extends HttpException {
  constructor(
    message: string,
    public readonly code: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super({ message, code, statusCode }, statusCode);
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    super(message, `${resource.toUpperCase()}_NOT_FOUND`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, public readonly issues?: string[]) {
    super(message, 'VALIDATION_ERROR', HttpStatus.BAD_REQUEST);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', HttpStatus.UNAUTHORIZED);
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', HttpStatus.FORBIDDEN);
  }
}

/**
 * Conflict errors (duplicate, race condition)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR', HttpStatus.CONFLICT);
  }
}

/**
 * Business rule violations
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code ?? 'BUSINESS_RULE_VIOLATION', HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

/**
 * Ride-specific errors
 */
export class RideNotFoundError extends NotFoundError {
  constructor(rideId?: string) {
    super('Ride', rideId);
  }
}

export class DriverNotFoundError extends NotFoundError {
  constructor(driverId?: string) {
    super('Driver', driverId);
  }
}

export class BookingNotFoundError extends NotFoundError {
  constructor(bookingId?: string) {
    super('Booking', bookingId);
  }
}

export class PackageNotFoundError extends NotFoundError {
  constructor(packageId?: string) {
    super('Package', packageId);
  }
}

export class InvalidStateTransitionError extends BusinessRuleError {
  constructor(from: string, to: string) {
    super(`Invalid state transition from '${from}' to '${to}'`, 'INVALID_STATE_TRANSITION');
  }
}

export class RideAlreadyCancelledError extends ConflictError {
  constructor(rideId: string) {
    super(`Ride '${rideId}' has already been cancelled`);
  }
}

export class DriverAlreadyAssignedError extends ConflictError {
  constructor(rideId: string) {
    super(`Ride '${rideId}' already has an assigned driver`);
  }
}

/**
 * Airport service errors
 */
export class AlreadyInQueueError extends ConflictError {
  constructor() {
    super('Already in airport queue');
  }
}

export class QueueFullError extends ConflictError {
  constructor() {
    super('Airport queue is full. Please try again later.');
  }
}

export class NotInQueueError extends ConflictError {
  constructor() {
    super('Not currently in airport queue');
  }
}

/**
 * Corporate service errors
 */
export class CorporateValidationError extends ValidationError {
  constructor(message: string, issues?: string[]) {
    super(message, issues);
  }
}
