/**
 * Hojai Model Registry - Error Handling Middleware
 */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number, isOperational?: boolean);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, identifier?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare function errorHandler(err: Error, _req: Request, res: Response<ApiError>, _next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response<ApiError>, _next: NextFunction): void;
//# sourceMappingURL=error.d.ts.map