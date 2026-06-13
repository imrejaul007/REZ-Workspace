/**
 * AI Concierge Agent - Error Classes
 * Custom error types for the service
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class TwinNotFoundError extends AppError {
  constructor(twinType: string, twinId: string) {
    super(
      `${twinType} Twin not found: ${twinId}`,
      'TWIN_NOT_FOUND',
      404,
      { twinType, twinId }
    );
  }
}

export class TwinAlreadyExistsError extends AppError {
  constructor(twinType: string, twinId: string) {
    super(
      `${twinType} Twin already exists: ${twinId}`,
      'TWIN_ALREADY_EXISTS',
      409,
      { twinType, twinId }
    );
  }
}

export class TwinUpdateConflictError extends AppError {
  constructor(twinType: string, twinId: string, version: number) {
    super(
      `Conflict updating ${twinType} Twin ${twinId}: version mismatch (expected ${version})`,
      'TWIN_UPDATE_CONFLICT',
      409,
      { twinType, twinId, expectedVersion: version }
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(serviceName: string, originalError?: Error) {
    super(
      `Service unavailable: ${serviceName}`,
      'SERVICE_UNAVAILABLE',
      503,
      { serviceName, originalError: originalError?.message }
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, 'AUTH_INVALID_TOKEN', 401);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'Rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter }
    );
  }
}

export class SyncTimeoutError extends AppError {
  constructor(twinType: string, twinId: string, timeout: number) {
    super(
      `Timeout syncing ${twinType} Twin ${twinId}`,
      'SYNC_TIMEOUT',
      504,
      { twinType, twinId, timeoutMs: timeout }
    );
  }
}

export class AgentUnavailableError extends AppError {
  constructor(agentId: string) {
    super(
      `Managing agent unavailable: ${agentId}`,
      'AGENT_UNAVAILABLE',
      503,
      { agentId }
    );
  }
}
