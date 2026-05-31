/**
 * Error Handling Middleware
 */
import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class RateLimitError extends AppError {
    constructor(retryAfter?: number);
    retryAfter?: number;
}
/**
 * Global error handler
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
/**
 * Not found handler for undefined routes
 */
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=error.d.ts.map