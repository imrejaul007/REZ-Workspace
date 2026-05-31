/**
 * HOJAI RAG Service - Error Handler Middleware
 */
import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
}
export declare class ValidationError extends AppError {
    details?: unknown | undefined;
    constructor(message: string, details?: unknown | undefined);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class RateLimitError extends AppError {
    constructor(retryAfter?: number);
    retryAfter?: number;
}
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
export declare function notFoundHandler(_req: Request, res: Response): void;
//# sourceMappingURL=error.d.ts.map