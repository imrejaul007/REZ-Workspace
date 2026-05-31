/**
 * Hojai Event Bus Service
 * Version: 1.0 | Port: 4510
 * Event streaming, pub/sub, and event sourcing
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { eventRoutes } from './routes/events.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { streamRoutes } from './routes/stream.js';

const PORT = 4510;

// ============================================
// LOGGING
// ============================================

function createLogger(service: string) {
  return {
    info: (event: string, data?: Record<string, unknown>) => {
      console.log(JSON.stringify({ level: 'info', service, event, timestamp: new Date().toISOString(), ...data }));
    },
    error: (event: string, data?: Record<string, unknown>) => {
      console.error(JSON.stringify({ level: 'error', service, event, timestamp: new Date().toISOString(), ...data }));
    },
    warn: (event: string, data?: Record<string, unknown>) => {
      console.warn(JSON.stringify({ level: 'warn', service, event, timestamp: new Date().toISOString(), ...data }));
    }
  };
}

const logger = createLogger('hojai-event');

// ============================================
// TYPES
// ============================================

export interface Event {
  id: string;
  type: string;
  source: string;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: {
    userId?: string;
    sessionId?: string;
    correlationId?: string;
    traceId?: string;
  };
}

export interface Subscription {
  id: string;
  tenantId: string;
  name: string;
  eventType: string;
  eventPattern?: string; // For pattern matching like "commerce.*"
  handler: string; // URL or function identifier
  filter?: Record<string, unknown>;
  createdAt: string;
  active: boolean;
  stats: {
    received: number;
    processed: number;
    failed: number;
  };
}

export interface EventStream {
  id: string;
  name: string;
  tenantId: string;
  eventTypes: string[];
  retentionDays: number;
  createdAt: string;
}

// ============================================
// IN-MEMORY STORES
// ============================================

export const eventStore: Map<string, Event[]> = new Map();
export const subscriptionStore: Subscription[] = [];
export const streamStore: EventStream[] = [];

// ============================================
// TENANT CONTEXT
// ============================================

interface TenantContext {
  tenant_id: string;
  user_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

function tenantMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TENANT_ID', message: 'X-Tenant-Id header required' }
      });
    }
    req.tenantContext = { tenant_id: tenantId, user_id: req.headers['x-user-id'] as string };
    next();
  };
}

// ============================================
// EVENT BUS CLASS
// ============================================

class HojaiEventBus {
  private app: express.Express;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        logger.info('request', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: Date.now() - start
        });
      });
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'hojai-event',
        version: '1.0.0',
        port: PORT,
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/health/live', (req, res) => res.json({ status: 'ok' }));
    this.app.get('/health/ready', (req, res) => res.json({ status: 'ready' }));

    // Stats
    this.app.get('/stats', tenantMiddleware(), (req, res) => {
      const ctx = req.tenantContext!;
      const tenantEvents = eventStore.get(ctx.tenant_id) || [];
      const tenantSubscriptions = subscriptionStore.filter(s => s.tenantId === ctx.tenant_id);

      res.json({
        success: true,
        data: {
          events: {
            total: tenantEvents.length,
            byType: this.groupByType(tenantEvents)
          },
          subscriptions: {
            total: tenantSubscriptions.length,
            active: tenantSubscriptions.filter(s => s.active).length
          }
        }
      });
    });

    // Mount route modules
    this.app.use('/events', tenantMiddleware(), eventRoutes);
    this.app.use('/subscriptions', tenantMiddleware(), subscriptionRoutes);
    this.app.use('/stream', tenantMiddleware(), streamRoutes);

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('error', { error: err.message, path: req.path });
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: err.message }
      });
    });

    // 404
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Route ${req.path} not found` }
      });
    });
  }

  private groupByType(events: Event[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const event of events) {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    }
    return grouped;
  }

  start() {
    this.app.listen(PORT, () => {
      logger.info('service_started', { port: PORT });
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║           HOJAI EVENT BUS v1.0.0                          ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                ║
║  Status: Running                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║  - Event Publishing & Consumption                           ║
║  - Pub/Sub Subscriptions                                    ║
║  - Event Pattern Matching                                   ║
║  - Event Streaming                                          ║
║  - Event Schema Registry                                    ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  }
}

// ============================================
// BOOTSTRAP
// ============================================

const eventBus = new HojaiEventBus();
eventBus.start();

export { HojaiEventBus };
export default eventBus;
