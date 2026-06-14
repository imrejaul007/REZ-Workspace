import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as unknown).message || exception.message;
        code = (exceptionResponse as unknown).code || code;
        details = isDevelopment ? (exceptionResponse as unknown).details : null;
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      // Handle Prisma errors
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_ERROR';

      switch (exception.code) {
        case 'P2002':
          message = 'A record with this data already exists';
          code = 'UNIQUE_CONSTRAINT_VIOLATION';
          break;
        case 'P2025':
          message = 'Record not found';
          code = 'RECORD_NOT_FOUND';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2003':
          message = 'Foreign key constraint failed';
          code = 'FOREIGN_KEY_CONSTRAINT';
          break;
        default:
          message = 'Database operation failed';
      }
    } else if (exception instanceof Error) {
      message = isDevelopment ? exception.message : 'Internal server error';

      // Handle specific error types
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        code = 'VALIDATION_ERROR';
      } else if (exception.name === 'UnauthorizedError') {
        status = HttpStatus.UNAUTHORIZED;
        code = 'UNAUTHORIZED';
        message = 'Authentication required';
      }
    }

    // Log the error (with different levels based on status)
    const logContext = {
      url: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      userId: request.user?.id,
      timestamp: new Date().toISOString(),
      status,
      code,
    };

    if (status >= 500) {
      this.logger.error(`Server Error: ${message}`, exception instanceof Error ? exception.stack : exception, logContext);
    } else if (status >= 400) {
      this.logger.warn(`Client Error: ${message}`, logContext);
    }

    // Prepare response
    const errorResponse: unknown = {
      success: false,
      error: {
        code,
        message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    // Add debug info in development
    if (isDevelopment && details) {
      errorResponse.error.details = details;
    }

    // Add validation errors if available
    if (exception instanceof HttpException && status === HttpStatus.BAD_REQUEST) {
      const exceptionResponse = exception.getResponse() as unknown;
      if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
        errorResponse.error.validationErrors = exceptionResponse.message;
      }
    }

    // Security: Don't expose internal errors in production
    if (!isDevelopment && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse.error.message = 'An unexpected error occurred. Please try again later.';
    }

    // Set security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');

    response.status(status).json(errorResponse);
  }
}