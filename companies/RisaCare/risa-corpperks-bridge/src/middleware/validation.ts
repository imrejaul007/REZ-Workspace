import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types';

export const validateRequest = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          data: { errors },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
        timestamp: new Date().toISOString(),
      });
    }
  };
};
