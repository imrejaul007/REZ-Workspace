/**
 * Hojai API Gateway
 * Version: 1.0 | Port: 4500
 * Central entry point with tenant routing
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from './shared/utils/logger.js';
import { createResponse, createErrorResponse } from './shared/types/index.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { eventRoutes } from './routes/events.js';
import { memoryRoutes } from './routes/memory.js';
import { workflowRoutes } from './routes/workflows.js';
import { agentRoutes } from './routes/agents.js';
const logger = createLogger('hojai-api-gateway');
const PORT = 4500;
const SERVICES = {
    // Core Platforms (Ports 4500-4599)
    governance: { name: 'hojai-governance', baseUrl: 'localhost', port: 4501, healthPath: '/health', enabled: true },
    event: { name: 'hojai-event', baseUrl: 'localhost', port: 4510, healthPath: '/health', enabled: true },
    memory: { name: 'hojai-memory', baseUrl: 'localhost', port: 4520, healthPath: '/health', enabled: true },
    intelligence: { name: 'hojai-intelligence', baseUrl: 'localhost', port: 4530, healthPath: '/health', enabled: true },
    agents: { name: 'hojai-agents', baseUrl: 'localhost', port: 4550, healthPath: '/health', enabled: true },
    workflow: { name: 'hojai-workflow', baseUrl: 'localhost', port: 4560, healthPath: '/health', enabled: true },
    communications: { name: 'hojai-communications', baseUrl: 'localhost', port: 4570, healthPath: '/health', enabled: true },
    hyperlocal: { name: 'hojai-hyperlocal', baseUrl: 'localhost', port: 4580, healthPath: '/health', enabled: true },
    data: { name: 'hojai-data', baseUrl: 'localhost', port: 4590, healthPath: '/health', enabled: true },
    identity: { name: 'hojai-identity', baseUrl: 'localhost', port: 4600, healthPath: '/health', enabled: true },
    // External Services (RABTUL)
    auth: { name: 'rabtul-auth', baseUrl: 'localhost', port: 4002, healthPath: '/health', enabled: true },
    payment: { name: 'rabtul-payment', baseUrl: 'localhost', port: 4001, healthPath: '/health', enabled: true },
    wallet: { name: 'rabtul-wallet', baseUrl: 'localhost', port: 4004, healthPath: '/health', enabled: true },
};
// ============================================
// GATEWAY CLASS
// ============================================
class HojaiAPIGateway {
    app;
    serviceHealth = new Map();
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.startHealthChecks();
    }
    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Security headers
        this.app.use(helmet());
        // CORS
        this.app.use(cors({
            origin: process.env.CORS_ORIGINS?.split(',') || '*',
            credentials: true
        }));
        // Compression
        this.app.use(compression());
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 1000,
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        // Request logging
        this.app.use(this.requestLogger.bind(this));
    }
    /**
     * Setup routes
     */
    setupRoutes() {
        // ============================================
        // GATEWAY ROUTES
        // ============================================
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'hojai-api-gateway',
                version: '1.0.0',
                port: PORT,
                timestamp: new Date().toISOString()
            });
        });
        // Liveness probe
        this.app.get('/health/live', (req, res) => {
            res.json({ status: 'ok' });
        });
        // Readiness probe with service health
        this.app.get('/health/ready', (req, res) => {
            const unhealthyServices = Array.from(this.serviceHealth.entries())
                .filter(([_, healthy]) => !healthy)
                .map(([name]) => name);
            if (unhealthyServices.length > 0) {
                res.status(503).json({
                    status: 'degraded',
                    unhealthyServices
                });
            }
            else {
                res.json({ status: 'ready' });
            }
        });
        // Service registry
        this.app.get('/services', (req, res) => {
            const services = Object.entries(SERVICES).map(([key, service]) => ({
                name: key,
                url: `http://${service.baseUrl}:${service.port}`,
                healthy: this.serviceHealth.get(key) ?? false,
                enabled: service.enabled
            }));
            res.json(createResponse({ services }));
        });
        // Service health status
        this.app.get('/services/health', (req, res) => {
            const health = Object.fromEntries(this.serviceHealth);
            res.json(createResponse({ health }));
        });
        // ============================================
        // API ROUTES (require tenant context)
        // ============================================
        // Tenant info
        this.app.get('/api/tenant', tenantMiddleware(), (req, res) => {
            const ctx = req.tenantContext;
            res.json(createResponse({
                tenant_id: ctx.tenant_id,
                tenant_type: ctx.tenant_type,
                namespace: ctx.namespace,
                roles: ctx.roles
            }, { tenantId: ctx.tenant_id }));
        });
        // Tenant stats
        this.app.get('/api/tenant/stats', tenantMiddleware(), async (req, res) => {
            const ctx = req.tenantContext;
            // Aggregate from services
            res.json(createResponse({
                tenant_id: ctx.tenant_id,
                services: {
                    events: { count: 0 },
                    memories: { count: 0 },
                    workflows: { count: 0 },
                    agents: { count: 0 }
                }
            }, { tenantId: ctx.tenant_id }));
        });
        // Event service routes
        this.app.use('/api/events', tenantMiddleware(), eventRoutes);
        // Memory service routes
        this.app.use('/api/memory', tenantMiddleware(), memoryRoutes);
        // Workflow service routes
        this.app.use('/api/workflows', tenantMiddleware(), workflowRoutes);
        // Agent service routes
        this.app.use('/api/agents', tenantMiddleware(), agentRoutes);
        // ============================================
        // EXTERNAL SERVICE ROUTES (RABTUL Passthrough)
        // ============================================
        // Auth (passthrough)
        this.app.use('/auth', this.createPassthrough('auth'));
        // Payment (passthrough)
        this.app.use('/payment', this.createPassthrough('payment'));
        // Wallet (passthrough)
        this.app.use('/wallet', this.createPassthrough('wallet'));
        // ============================================
        // ERROR HANDLER
        // ============================================
        this.app.use((err, req, res, next) => {
            logger.error('gateway_error', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method
            });
            res.status(500).json(createErrorResponse('GATEWAY_ERROR', 'An error occurred in the gateway'));
        });
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json(createErrorResponse('NOT_FOUND', `Route ${req.path} not found`));
        });
    }
    /**
     * Create proxy middleware for a service
     */
    createProxy(serviceKey) {
        const service = SERVICES[serviceKey];
        if (!service) {
            throw new Error(`Service ${serviceKey} not found`);
        }
        return async (req, res, next) => {
            try {
                const targetUrl = `http://${service.baseUrl}:${service.port}${req.path}`;
                const requestId = uuidv4();
                logger.info('proxying_request', {
                    service: serviceKey,
                    method: req.method,
                    path: req.path,
                    target: targetUrl,
                    requestId
                });
                // Forward request to service
                const response = await fetch(targetUrl, {
                    method: req.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Request-Id': requestId,
                        'X-Tenant-Id': req.tenantContext?.tenant_id || '',
                        'X-Organization-Id': req.tenantContext?.organization_id || '',
                        'X-User-Id': req.tenantContext?.user_id || '',
                        'X-Roles': JSON.stringify(req.tenantContext?.roles || [])
                    },
                    body: ['POST', 'PUT', 'PATCH'].includes(req.method)
                        ? JSON.stringify(req.body)
                        : undefined,
                    signal: AbortSignal.timeout(30000)
                });
                const data = await response.json();
                res.status(response.status).json(data);
            }
            catch (error) {
                logger.error('proxy_error', {
                    service: serviceKey,
                    error: error.message
                });
                res.status(503).json(createErrorResponse('SERVICE_UNAVAILABLE', `Service ${service.name} is currently unavailable`));
            }
        };
    }
    /**
     * Create passthrough middleware (no tenant context modification)
     */
    createPassthrough(serviceKey) {
        const service = SERVICES[serviceKey];
        if (!service) {
            throw new Error(`Service ${serviceKey} not found`);
        }
        return async (req, res) => {
            try {
                const targetUrl = `http://${service.baseUrl}:${service.port}${req.path}`;
                const response = await fetch(targetUrl, {
                    method: req.method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: ['POST', 'PUT', 'PATCH'].includes(req.method)
                        ? JSON.stringify(req.body)
                        : undefined,
                    signal: AbortSignal.timeout(30000)
                });
                const data = await response.json();
                res.status(response.status).json(data);
            }
            catch (error) {
                logger.error('passthrough_error', {
                    service: serviceKey,
                    error: error.message
                });
                res.status(503).json(createErrorResponse('SERVICE_UNAVAILABLE', `Service ${service.name} is currently unavailable`));
            }
        };
    }
    /**
     * Request logger
     */
    requestLogger(req, res, next) {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.info('request', {
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
     * Start health checks for all services
     */
    startHealthChecks() {
        setInterval(async () => {
            for (const [key, service] of Object.entries(SERVICES)) {
                if (!service.enabled)
                    continue;
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);
                    const response = await fetch(`http://${service.baseUrl}:${service.port}${service.healthPath}`, { signal: controller.signal });
                    clearTimeout(timeout);
                    this.serviceHealth.set(key, response.ok);
                }
                catch {
                    this.serviceHealth.set(key, false);
                }
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Start the gateway
     */
    start() {
        this.app.listen(PORT, () => {
            logger.info('hojai_api_gateway_started', { port: PORT });
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║           HOJAI API GATEWAY v1.0.0                          ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                ║
║  Status: Running                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Services Registered: ${Object.keys(SERVICES).length}                                ║
║  - Core: 10 services (4500-4600)                            ║
║  - External: 3 services (RABTUL)                             ║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                  ║
║  - GET  /health              Health check                   ║
║  - GET  /services            Service registry               ║
║  - GET  /api/tenant          Tenant info                    ║
║  - POST /api/events          Event operations               ║
║  - POST /api/memory          Memory operations             ║
║  - POST /api/workflows       Workflow operations            ║
║  - POST /api/agents          Agent operations               ║
╚══════════════════════════════════════════════════════════════╝
      `);
        });
    }
}
// ============================================
// BOOTSTRAP
// ============================================
const gateway = new HojaiAPIGateway();
gateway.start();
export { HojaiAPIGateway, SERVICES };
export default gateway;
//# sourceMappingURL=index.js.map