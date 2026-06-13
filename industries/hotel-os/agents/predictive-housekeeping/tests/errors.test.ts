import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  TwinNotFoundError,
  TwinAlreadyExistsError,
  formatErrorResponse,
} from '../src/utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with correct properties', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should default code to INTERNAL_ERROR', () => {
      const error = new AppError('Test error', 500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 error with details', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', details);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(details);
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError('Already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('TwinNotFoundError', () => {
    it('should create a twin not found error', () => {
      const error = new TwinNotFoundError('guest', 'G-123');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('TWIN_NOT_FOUND');
      expect(error.message).toBe('Twin not found: guest G-123');
    });
  });

  describe('TwinAlreadyExistsError', () => {
    it('should create a twin already exists error', () => {
      const error = new TwinAlreadyExistsError('room', '501');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('TWIN_ALREADY_EXISTS');
      expect(error.message).toBe('Twin already exists: room 501');
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error response correctly', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      const response = formatErrorResponse(error, '/api/twins/guest');

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('Invalid input');
      expect(response.error.details).toEqual({ field: 'email' });
      expect(response.error.path).toBe('/api/twins/guest');
      expect(response.error.timestamp).toBeDefined();
    });

    it('should not include details for non-validation errors', () => {
      const error = new NotFoundError('Guest not found');
      const response = formatErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error.details).toBeUndefined();
    });
  });
});