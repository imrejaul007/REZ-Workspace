/**
 * Error classes for REZ ecosystem
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('RATE_LIMITED', 'Too many requests', 429, { retryAfter });
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super('SERVICE_UNAVAILABLE', `Service '${service}' is currently unavailable`, 503);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super('INTERNAL_ERROR', message, 500);
  }
}

// ============ Error Handler ============

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message);
  }

  return new InternalError('An unknown error occurred');
}

// ============ Assert Functions ============

export function assert(condition: boolean, error: AppError): asserts condition {
  if (!condition) {
    throw error;
  }
}

export function assertNotFound<T>(value: T | null | undefined, resource: string, id?: string): asserts value {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource, id);
  }
}

export function assertValid<T>(value: unknown, schema: { parse: (v: unknown) => T }): T {
  try {
    return schema.parse(value);
  } catch (error) {
    throw new ValidationError('Invalid data', { error });
  }
}
