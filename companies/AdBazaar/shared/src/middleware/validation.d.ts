import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Validate request body against a Zod schema
 */
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate query parameters against a Zod schema
 */
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate URL parameters against a Zod schema
 */
export declare function validateParams<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
export declare const paginationSchema: any;
export declare const idParamSchema: any;
export declare const optionalIdParamSchema: any;
//# sourceMappingURL=validation.d.ts.map