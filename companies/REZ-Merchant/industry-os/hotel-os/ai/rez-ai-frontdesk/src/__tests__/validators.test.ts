/**
 * Validators Tests
 */

import { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  validateGuestInput,
  validateServiceRequestInput,
  validateBookingInput,
  validateStatusUpdate,
  validateConciergeQuery,
  validateRequestId,
} from '../validators';

describe('Validators', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with message and field', () => {
      const error = new ValidationError('Name is required', 'name');
      expect(error.message).toBe('Name is required');
      expect(error.field).toBe('name');
      expect(error.statusCode).toBe(400);
    });

    it('should create a ValidationError with custom status code', () => {
      const error = new ValidationError('Not found', undefined, 404);
      expect(error.statusCode).toBe(404);
    });
  });

  describe('validateGuestInput', () => {
    it('should call next() for valid guest input', () => {
      mockRequest.body = {
        name: 'John Doe',
        phone: '1234567890',
        checkIn: new Date(),
        roomNumber: '101',
      };

      validateGuestInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with error for missing name', () => {
      mockRequest.body = {
        phone: '1234567890',
        checkIn: new Date(),
        roomNumber: '101',
      };

      validateGuestInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should call next with error for missing phone', () => {
      mockRequest.body = {
        name: 'John Doe',
        checkIn: new Date(),
        roomNumber: '101',
      };

      validateGuestInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should call next with error for invalid checkIn date', () => {
      mockRequest.body = {
        name: 'John Doe',
        phone: '1234567890',
        checkIn: 'invalid-date',
        roomNumber: '101',
      };

      validateGuestInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateServiceRequestInput', () => {
    it('should call next() for valid service request', () => {
      mockRequest.body = {
        type: 'room_service',
        description: 'Extra towels please',
      };

      validateServiceRequestInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with error for invalid type', () => {
      mockRequest.body = {
        type: 'invalid_type',
        description: 'Some request',
      };

      validateServiceRequestInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should call next with error for missing description', () => {
      mockRequest.body = {
        type: 'room_service',
      };

      validateServiceRequestInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateBookingInput', () => {
    it('should call next() for valid booking', () => {
      mockRequest.body = {
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000), // tomorrow
      };

      validateBookingInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with error for missing checkIn', () => {
      mockRequest.body = {
        checkOut: new Date(),
      };

      validateBookingInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should call next with error for invalid checkIn date', () => {
      mockRequest.body = {
        checkIn: 'not-a-date',
      };

      validateBookingInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should call next with error if checkOut is before checkIn', () => {
      mockRequest.body = {
        checkIn: new Date(Date.now() + 86400000),
        checkOut: new Date(),
      };

      validateBookingInput(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateConciergeQuery', () => {
    it('should call next() for valid query', () => {
      mockRequest.body = {
        query: 'What time is breakfast?',
      };

      validateConciergeQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with error for missing query', () => {
      mockRequest.body = {};

      validateConciergeQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should call next with error for query over 1000 chars', () => {
      mockRequest.body = {
        query: 'a'.repeat(1001),
      };

      validateConciergeQuery(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateRequestId', () => {
    it('should call next() for valid id', () => {
      mockRequest.params = { id: '123' };

      validateRequestId(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with error for missing id', () => {
      mockRequest.params = {};

      validateRequestId(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe('validateStatusUpdate', () => {
    it('should call next() for valid status', () => {
      mockRequest.body = { status: 'pending' };

      validateStatusUpdate(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should call next with error for missing status', () => {
      mockRequest.body = {};

      validateStatusUpdate(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });
});