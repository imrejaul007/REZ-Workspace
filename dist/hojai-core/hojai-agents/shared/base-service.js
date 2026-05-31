/**
 * Hojai Core - Base Service Template
 * Version: 1.0 | Date: May 29, 2026
 * Purpose: Standard service template for all Hojai Core platforms
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createResponse, createErrorResponse } from '../types';
import { tenantMiddleware, optionalTenantMiddleware } from '../middleware/tenant';
import { createLogger } from '../utils/logger';
import { createRateLimiter } from '../utils/rate-limiter';
/**
 * Base service class
 */
export class BaseService {
    app;
    config;
    logger;
    constructor(config) {
        this.config = config;
        this.app = express();
        this.logger = createLogger(config.name);
        this.setupMiddleware();
        this.setupBaseRoutes();
    }
    /**
     * Setup standard middleware
     */
    setupMiddleware() {
        // Security
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.CORS_ORIGINS?.split(',') || '*',
            credentials: true
        }));
        // Compression
        this.app.use(compression());
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        // Request logging
        this.app.use(this.requestLogger.bind(this));
        // Rate limiting (tenant-aware)
        this.app.use(createRateLimiter());
    }
    /**
     * Setup base routes
     */
    setupBaseRoutes() {
        // Health check
        if (this.config.enableHealth !== false) {
            this.app.get('/health', (req, res) => {
                res.json({
                    status: 'healthy',
                    service: this.config.name,
                    version: this.config.version,
                    timestamp: new Date().toISOString()
                });
            });
            this.app.get('/health/live', (req, res) => {
                res.json({ status: 'ok' });
            });
            this.app.get('/health/ready', (req, res) => {
                // Add readiness checks here (DB connection, etc.)
                res.json({ status: 'ready' });
            });
        }
        // Error handler
        this.app.use(this.errorHandler.bind(this));
    }
    /**
     * Request logger
     */
    requestLogger(req, res, next) {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            this.logger.info('request', {
                method: req.method,
                path: req.path,
                status: res.statusCode,
                duration,
                tenantId: req.tenantContext?.tenant_id
            });
        });
        next();
    }
    /**
     * Error handler
     */
    errorHandler(err, req, res, next) {
        this.logger.error('request_error', {
            error: err.message,
            stack: err.stack,
            path: req.path
        });
        if (err.name === 'TenantError') {
            return res.status(400).json(createErrorResponse(err.code, err.message));
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json(createErrorResponse('VALIDATION_ERROR', err.message, err.details));
        }
        if (err.name === 'NotFoundError') {
            return res.status(404).json(createErrorResponse('NOT_FOUND', err.message));
        }
        // Default error
        res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
    }
    /**
     * Add tenant-protected routes
     */
    addTenantRoutes(router, routes) {
        for (const route of routes) {
            router[route.method](route.path, tenantMiddleware(), route.handler);
        }
    }
    /**
     * Add optional-tenant routes
     */
    addOptionalTenantRoutes(router, routes) {
        for (const route of routes) {
            router[route.method](route.path, optionalTenantMiddleware(), route.handler);
        }
    }
    /**
     * Start the service
     */
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.config.port, () => {
                this.logger.info('service_started', {
                    service: this.config.name,
                    port: this.config.port
                });
                resolve();
            });
        });
    }
    /**
     * Get the Express app
     */
    getApp() {
        return this.app;
    }
}
/**
 * Create a base controller
 */
export class BaseController {
    tenantContext;
    logger;
    constructor(tenantContext) {
        this.tenantContext = tenantContext;
        this.logger = createLogger('controller');
    }
    /**
     * Send success response
     */
    success(res, data, meta) {
        res.json(createResponse(data, {
            tenantId: this.tenantContext.tenant_id,
            ...meta
        }));
    }
    /**
     * Send error response
     */
    error(res, code, message, status = 400) {
        res.status(status).json(createErrorResponse(code, message));
    }
    /**
     * Send paginated response
     */
    paginated(res, data, pagination) {
        res.json({
            success: true,
            data,
            pagination: {
                ...pagination,
                hasMore: pagination.page * pagination.pageSize < pagination.total
            },
            meta: {
                timestamp: new Date().toISOString(),
                requestId: '',
                tenantId: this.tenantContext.tenant_id
            }
        });
    }
}
/**
 * Validation error helper
 */
export class ValidationError extends Error {
    details;
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ValidationError';
    }
}
/**
 * Not found error helper
 */
export class NotFoundError extends Error {
    constructor(resource) {
        super(`${resource} not found`);
        this.name = 'NotFoundError';
    }
}
//# sourceMappingURL=base-service.js.map