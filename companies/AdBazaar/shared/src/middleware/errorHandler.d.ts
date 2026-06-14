import { Request, Response, NextFunction } from 'express';
/**
 * Global error handler middleware
 */
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void;
/**
 * 404 Not Found handler
 */
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=errorHandler.d.ts.map