export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors || {};
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class AgreementError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code || 'AGREEMENT_ERROR');
    this.name = 'AgreementError';
  }
}

export class SigningError extends AppError {
  constructor(message: string) {
    super(message, 400, 'SIGNING_ERROR');
    this.name = 'SigningError';
  }
}

export class PaymentError extends AppError {
  constructor(message: string) {
    super(message, 400, 'PAYMENT_ERROR');
    this.name = 'PaymentError';
  }
}

export class PDFGenerationError extends AppError {
  constructor(message: string) {
    super(message, 500, 'PDF_GENERATION_ERROR');
    this.name = 'PDFGenerationError';
  }
}

// Error handler utility
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Check if error is operational
export const isOperationalError = (error: unknown): boolean => {
  return error instanceof AppError && error.isOperational;
};
