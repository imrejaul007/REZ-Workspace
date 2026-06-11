const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERROR_${statusCode}`;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400, 'INVALID_ID');
  }

  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map(e => e.message);
    error = new ValidationError('Validation failed', messages);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ConflictError(`${field} already exists`);
  }

  if (err.name === 'MongoServerError' && err.message.includes('timeout')) {
    error = new AppError('Database timeout. Please try again.', 503, 'DB_TIMEOUT');
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  if (error.details) {
    response.details = error.details;
  }

  res.status(statusCode).json(response);
};

const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};