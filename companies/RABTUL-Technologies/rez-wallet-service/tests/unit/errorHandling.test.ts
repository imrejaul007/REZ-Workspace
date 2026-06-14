import { errorResponse, ApiError, successResponse } from '../../src/utils/errorResponse';

describe('Error Response Utilities', () => {
  describe('errorResponse', () => {
    it('should create a standard error response', () => {
      const response = errorResponse(400, 'Bad Request', 'VALIDATION_ERROR');

      expect(response).toEqual({
        success: false,
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
      });
    });

    it('should create error response without code', () => {
      const response = errorResponse(500, 'Internal Server Error');

      expect(response).toEqual({
        success: false,
        error: 'Internal Server Error',
      });
    });

    it('should include details when provided', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const response = errorResponse(400, 'Validation failed', 'VALIDATION_ERROR', details);

      expect(response).toEqual({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details,
      });
    });

    it('should include requestId when provided', () => {
      const requestId = 'req-123';
      const response = errorResponse(404, 'Not Found', 'NOT_FOUND', undefined, requestId);

      expect(response).toEqual({
        success: false,
        error: 'Not Found',
        code: 'NOT_FOUND',
        requestId,
      });
    });
  });

  describe('ApiError', () => {
    it('should create an ApiError with status code', () => {
      const error = new ApiError(400, 'Bad Request', 'VALIDATION_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError without code', () => {
      const error = new ApiError(500, 'Server Error');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Server Error');
      expect(error.code).toBeUndefined();
    });

    it('should include details when provided', () => {
      const details = { users: [] };
      const error = new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('successResponse', () => {
    it('should create a success response', () => {
      const data = { id: '123', name: 'Test' };
      const response = successResponse(data);

      expect(response).toEqual({
        success: true,
        data,
      });
    });

    it('should create success response with requestId', () => {
      const data = { id: '123' };
      const requestId = 'req-456';
      const response = successResponse(data, requestId);

      expect(response).toEqual({
        success: true,
        data,
        requestId,
      });
    });

    it('should handle array data', () => {
      const data = [1, 2, 3];
      const response = successResponse(data);

      expect(response).toEqual({
        success: true,
        data,
      });
    });

    it('should handle null data', () => {
      const response = successResponse(null);

      expect(response).toEqual({
        success: true,
        data: null,
      });
    });
  });
});
