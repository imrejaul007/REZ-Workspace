import { Request, Response, NextFunction } from 'express';
/**
 * Adds a unique request ID to each request
 */
export declare function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Logs incoming requests and response times
 */
export declare function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=requestLogger.d.ts.map