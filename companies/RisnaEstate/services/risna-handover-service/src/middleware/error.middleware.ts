import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import logger from '../config/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle AppError
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    };

    if (err instanceof ValidationError) {
      response.error.errors = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        statusCode: 400,
        details: err.message,
      },
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid ID format',
        statusCode: 400,
      },
    });
    return;
  }

  // Handle duplicate key error
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        message: 'Duplicate entry',
        statusCode: 409,
      },
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      statusCode: 500,
    },
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
};

export default errorHandler;