import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      next(new ValidationError(`Validation failed: ${JSON.stringify(errors)}`));
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      next(new ValidationError(`Validation failed: ${JSON.stringify(errors)}`));
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      next(new ValidationError(`Validation failed: ${JSON.stringify(errors)}`));
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}

export const createEventSchema = z.object({
  postId: z.string().min(1),
  platform: z.string().min(1),
  accountId: z.string().min(1),
  date: z.string().datetime().or(z.date()),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  content: z.string().min(1),
  mediaPreview: z.string().optional(),
  assignee: z.string().optional(),
});

export const updateEventSchema = z.object({
  date: z.string().datetime().or(z.date()).optional(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  content: z.string().optional(),
  mediaPreview: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
  assignee: z.string().optional(),
  color: z.string().optional(),
});

export const bulkMoveSchema = z.object({
  eventIds: z.array(z.string()).min(1),
  newDate: z.string().datetime().or(z.date()),
  newTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

export const calendarQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  platform: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
  date: z.string().datetime().optional(),
});

export const eventIdSchema = z.object({
  id: z.string().uuid(),
});

export const exportQuerySchema = z.object({
  format: z.enum(['ical', 'csv', 'pdf']).optional().default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const settingsUpdateSchema = z.object({
  defaultView: z.enum(['month', 'week', 'day']).optional(),
  workingHours: z.object({
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  }).optional(),
  blackoutDates: z.array(z.string().datetime()).optional(),
  colorScheme: z.record(z.string()).optional(),
});
