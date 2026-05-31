import { Request, Response, NextFunction } from 'express';
declare const router: import("express-serve-static-core").Router;
declare const globalLimiter: import("express-rate-limit").RateLimitRequestHandler;
declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
export default router;
export { globalLimiter, authLimiter, requestLogger };
//# sourceMappingURL=apiGateway.d.ts.map