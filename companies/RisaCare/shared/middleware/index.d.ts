import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { RisaCareError } from '../errors';
export declare function requestId(req: Request, res: Response, next: NextFunction): void;
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export declare const compressionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const globalRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare function errorHandler(error: Error | RisaCareError, req: Request, res: Response, _next: NextFunction): void;
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
export declare function healthCheck(req: Request, res: Response): void;
