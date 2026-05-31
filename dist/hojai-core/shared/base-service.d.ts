/**
 * Hojai Core - Base Service Template
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Standard service template for all Hojai Core platforms
 */
import { Express, Request, Response, NextFunction } from 'express';
import { TenantContext } from '../types';
import { createLogger } from '../utils/logger';
/**
 * Base service configuration
 */
export interface BaseServiceConfig {
    name: string;
    port: number;
    version: string;
    enableHealth?: boolean;
    enableMetrics?: boolean;
}
/**
 * Base service class
 */
export declare abstract class BaseService {
    protected app: Express;
    protected config: BaseServiceConfig;
    protected logger: ReturnType<typeof createLogger>;
    constructor(config: BaseServiceConfig);
    /**
     * Setup standard middleware
     */
    private setupMiddleware;
    /**
     * Setup base routes
     */
    private setupBaseRoutes;
    /**
     * Request logger
     */
    private requestLogger;
    /**
     * Error handler
     */
    private errorHandler;
    /**
     * Add tenant-protected routes
     */
    protected addTenantRoutes(router: any, routes: TenantRoute[]): void;
    /**
     * Add optional-tenant routes
     */
    protected addOptionalTenantRoutes(router: any, routes: TenantRoute[]): void;
    /**
     * Start the service
     */
    start(): Promise<void>;
    /**
     * Get the Express app
     */
    getApp(): Express;
}
/**
 * Tenant route definition
 */
export interface TenantRoute {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    path: string;
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void;
}
/**
 * Create a base controller
 */
export declare abstract class BaseController {
    protected tenantContext: TenantContext;
    protected logger: ReturnType<typeof createLogger>;
    constructor(tenantContext: TenantContext);
    /**
     * Send success response
     */
    protected success<T>(res: Response, data: T, meta?: Record<string, any>): void;
    /**
     * Send error response
     */
    protected error(res: Response, code: string, message: string, status?: number): void;
    /**
     * Send paginated response
     */
    protected paginated<T>(res: Response, data: T[], pagination: {
        page: number;
        pageSize: number;
        total: number;
    }): void;
}
/**
 * Validation error helper
 */
export declare class ValidationError extends Error {
    details?: Record<string, any> | undefined;
    constructor(message: string, details?: Record<string, any> | undefined);
}
/**
 * Not found error helper
 */
export declare class NotFoundError extends Error {
    constructor(resource: string);
}
//# sourceMappingURL=base-service.d.ts.map