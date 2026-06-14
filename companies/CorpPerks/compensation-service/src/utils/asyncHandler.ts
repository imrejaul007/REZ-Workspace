import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

interface ValidateRequestOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (options: ValidateRequestOptions) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (options.body) {
        req.body = options.body.parse(req.body);
      }
      if (options.query) {
        req.query = options.query.parse(req.query);
      }
      if (options.params) {
        req.params = options.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        next(error);
      }
      next(error);
    }
  };
};
