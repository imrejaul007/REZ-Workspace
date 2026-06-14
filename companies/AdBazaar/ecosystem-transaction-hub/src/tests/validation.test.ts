import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { Request, Response, NextFunction } from 'express';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('validateBody', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
    });

    it('should pass valid data through', () => {
      mockRequest.body = { name: 'John', age: 25 };

      const middleware = validateBody(TestSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject missing required fields', () => {
      mockRequest.body = { name: 'John' }; // missing age

      const middleware = validateBody(TestSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject invalid data types', () => {
      mockRequest.body = { name: 'John', age: 'not-a-number' };

      const middleware = validateBody(TestSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return detailed error messages', () => {
      mockRequest.body = { name: '', age: -5 };

      const middleware = validateBody(TestSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'age' }),
          ]),
        })
      );
    });
  });

  describe('validateParams', () => {
    const ParamSchema = z.object({
      id: z.string().uuid(),
    });

    it('should pass valid params through', () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      const middleware = validateParams(ParamSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject invalid UUID', () => {
      mockRequest.params = { id: 'not-a-uuid' };

      const middleware = validateParams(ParamSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    const QuerySchema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      status: z.enum(['active', 'inactive']).optional(),
    });

    it('should pass valid query params through', () => {
      mockRequest.query = { page: '1', limit: '20', status: 'active' };

      const middleware = validateQuery(QuerySchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
 });

    it('should coerce string numbers to numbers', () => {
      mockRequest.query = { page: '5' };

      const middleware = validateQuery(QuerySchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject limit exceeding max', () => {
      mockRequest.query = { page: '1', limit: '200' };

      const middleware = validateQuery(QuerySchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow optional params to be missing', () => {
      mockRequest.query = {};

      const middleware = validateQuery(QuerySchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});