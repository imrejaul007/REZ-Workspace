/**
 * HOJAI RAG Service - Rate Limiting Middleware
 */
import { Request, Response, NextFunction } from 'express';
export declare function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Stricter rate limit for expensive operations (generation)
 */
export declare function generationRateLimit(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=rateLimit.d.ts.map