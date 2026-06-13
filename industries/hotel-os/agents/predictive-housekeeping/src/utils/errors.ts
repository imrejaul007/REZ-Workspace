export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message: string = 'Validation failed', details?: unknown, code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', code: string = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', code: string = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code);
  }
}

export class TwinNotFoundError extends NotFoundError {
  constructor(twinType: string, twinId: string) {
    super(`Twin not found: ${twinType} ${twinId}`, 'TWIN_NOT_FOUND');
  }
}

export class TwinAlreadyExistsError extends ConflictError {
  constructor(twinType: string, twinId: string) {
    super(`Twin already exists: ${twinType} ${twinId}`, 'TWIN_ALREADY_EXISTS');
  }
}

export class TwinUpdateConflictError extends AppError {
  constructor(twinType: string, twinId: string) {
    super(`Twin update conflict: ${twinType} ${twinId}`, 409, 'TWIN_UPDATE_CONFLICT');
  }
}

export class AgentUnavailableError extends ServiceUnavailableError {
  constructor(agentName: string) {
    super(`Agent unavailable: ${agentName}`, 'AGENT_UNAVAILABLE');
  }
}

export class SyncTimeoutError extends ServiceUnavailableError {
  constructor(operation: string) {
    super(`Sync timeout during: ${operation}`, 'SYNC_TIMEOUT');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    if (retryAfter) {
      this.retryAfter = retryAfter;
    }
  }

  public retryAfter?: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path?: string;
  };
}

export function formatErrorResponse(error: AppError, path?: string): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error instanceof ValidationError ? error.details : undefined,
      timestamp: new Date().toISOString(),
      path,
    },
  };
}