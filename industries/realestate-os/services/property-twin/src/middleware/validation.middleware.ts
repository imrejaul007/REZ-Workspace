import { Request, Response, NextFunction } from 'express';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { logger } from '../utils/logger';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

// Validation error class
export class ValidationError extends Error {
  public errors: ErrorObject[];

  constructor(errors: ErrorObject[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Create validation middleware
export const validate = (schema: object, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validator = ajv.compile(schema);
    const valid = validator(req[source]);

    if (!valid && validator.errors) {
      logger.warn('Validation failed', {
        errors: validator.errors,
        path: req.path,
        method: req.method,
      });

      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Request validation failed',
        details: validator.errors.map((err) => ({
          field: err.instancePath.replace('/', '') || err.params?.missingProperty || 'unknown',
          message: err.message,
          params: err.params,
        })),
      });
      return;
    }

    next();
  };
};

// Validate property twin creation
export const validateCreatePropertyTwin = validate({
  type: 'object',
  properties: {
    propertyId: { type: 'string', minLength: 1 },
    listing: {
      type: 'object',
      properties: {
        listingPrice: { type: 'number', minimum: 0 },
        status: { type: 'string', enum: ['active', 'pending', 'under_contract', 'sold', 'off_market'] },
      },
      required: ['listingPrice'],
    },
    location: {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string', minLength: 1 },
            city: { type: 'string', minLength: 1 },
            state: { type: 'string', minLength: 2 },
            postalCode: { type: 'string', minLength: 5 },
          },
          required: ['street', 'city', 'state', 'postalCode'],
        },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lng: { type: 'number', minimum: -180, maximum: 180 },
          },
          required: ['lat', 'lng'],
        },
      },
      required: ['address', 'coordinates'],
    },
    physical: {
      type: 'object',
      properties: {
        propertyType: {
          type: 'string',
          enum: ['single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial'],
        },
        bedrooms: { type: 'number', minimum: 0 },
        bathrooms: { type: 'number', minimum: 0 },
      },
      required: ['propertyType', 'bedrooms', 'bathrooms'],
    },
  },
  required: ['propertyId', 'listing', 'location', 'physical'],
}, 'body');

// Validate query parameters
export const validateQuery = validate({
  type: 'object',
  properties: {
    city: { type: 'string' },
    state: { type: 'string' },
    propertyType: { type: 'string' },
    status: { type: 'string' },
    minPrice: { type: 'number', minimum: 0 },
    maxPrice: { type: 'number', minimum: 0 },
    minBedrooms: { type: 'number', minimum: 0 },
    maxBedrooms: { type: 'number', minimum: 0 },
    limit: { type: 'number', minimum: 1, maximum: 100 },
    offset: { type: 'number', minimum: 0 },
  },
}, 'query');

// Validate ID parameter
export const validateIdParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];

    if (!id || id.trim() === '') {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `${paramName} parameter is required`,
      });
      return;
    }

    // Basic UUID or property ID format validation
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    const propertyIdRegex = /^[a-zA-Z0-9_-]+$/;

    if (!uuidRegex.test(id) && !propertyIdRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid ID format',
      });
      return;
    }

    next();
  };
};
