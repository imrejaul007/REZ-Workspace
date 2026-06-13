import { Request, Response, NextFunction } from 'express';
import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, coerceTypes: false });
addFormats(ajv);

export interface ValidationSchema {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    if (schema.body) {
      const validateBody = ajv.compile(schema.body);
      if (!validateBody(req.body)) {
        errors.push(...formatErrors(validateBody.errors || []));
      }
    }

    if (schema.query) {
      const validateQuery = ajv.compile(schema.query);
      if (!validateQuery(req.query)) {
        errors.push(...formatErrors(validateQuery.errors || []));
      }
    }

    if (schema.params) {
      const validateParams = ajv.compile(schema.params);
      if (!validateParams(req.params)) {
        errors.push(...formatErrors(validateParams.errors || []));
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    next();
  };
}

function formatErrors(errors: ErrorObject[]): string[] {
  return errors.map((error) => {
    const path = error.instancePath || 'root';
    return `${path}: ${error.message}`;
  });
}
