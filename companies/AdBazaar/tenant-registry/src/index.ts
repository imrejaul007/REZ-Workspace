/**
 * Tenant Registry Service - Main Entry Point
 *
 * Port: 4510
 *
 * Central tenant management for AdBazaar multi-tenant architecture.
 * Manages:
 * - Tenant registration (REZ Internal + External)
 * - API key management
 * - Authentication
 * - Tenant context for downstream services
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Services
import { tenantService, CreateTenantParams } from './services/tenantService';
import { Tenant, TenantType, TenantStatus } from './models/tenant';

// ============================================================================
// APP SETUP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4510', 10);

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tenant-registry';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-admin-token'] as string;
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    return;
  }
  next();
}

function apiAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    return;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { tenantId: string };
    (req as unknown as { internalTenantId: string }).internalTenantId = decoded.tenantId;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'INVALID_TOKEN' });
  }
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createTenantSchema = z.object({
  type: z.enum(['rez_internal', 'external']),
  tier: z.enum(['rez_tier_0', 'external_tier_0', 'external_tier_1', 'external_tier_2']).optional(),
  name: z.string().min(2).max(100),
  companyName: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  password: z.string().min(8).optional(),

  // REZ Internal
  rezCompanyId: z.string().optional(),
  rezProducts: z.array(z.string()).optional(),

  // External
  businessType: z.string().optional(),
  gstin: z.string().optional(),
});

const createApiKeySchema = z.object({
  name: z.string().min(2).max(50),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).default(['read', 'write']),
});

// ============================================================================
// HEALTH ENDPOINTS
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'tenant-registry',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.json({
    ready: mongoOk,
    mongodb: mongoOk ? 'connected' : 'disconnected',
  });
});

// ============================================================================
// AUTH ROUTES
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new tenant
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const validation = createTenantSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: validation.error.issues,
      });
      return;
    }

    const params: CreateTenantParams = validation.data;
    const tenant = await tenantService.createTenant(params);

    logger.info(`[TenantRegistry] New tenant registered: ${tenant.tenantId}`);

    res.status(201).json({
      success: true,
      data: {
        tenantId: tenant.tenantId,
        email: tenant.email,
        type: tenant.tenantType,
        status: tenant.status,
      },
    });
  } catch (error) {
    logger.error('Register error:', { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('EXISTS')) {
      res.status(409).json({ success: false, error: 'TENANT_EXISTS', message });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message });
  }
});

/**
 * POST /api/auth/login
 * Login with email/password
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'EMAIL_AND_PASSWORD_REQUIRED' });
      return;
    }

    const { tenant, token } = await tenantService.authenticate(email, password);

    logger.info(`[TenantRegistry] Login: ${tenant.tenantId}`);

    res.json({
      success: true,
      data: {
        token,
        tenant: {
          tenantId: tenant.tenantId,
          name: tenant.name,
          companyName: tenant.companyName,
          type: tenant.tenantType,
          tier: tenant.tenantTier,
        },
      },
    });
  } catch (error) {
    logger.error('Login error:', { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('AUTH_FAILED')) {
      res.status(401).json({ success: false, error: 'AUTH_FAILED', message });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/auth/me
 * Get current tenant info
 */
app.get('/api/auth/me', apiAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as unknown as { internalTenantId: string }).internalTenantId;
    const tenant = await tenantService.getTenantById(tenantId);

    if (!tenant) {
      res.status(404).json({ success: false, error: 'TENANT_NOT_FOUND' });
      return;
    }

    const context = await tenantService.getTenantContext(tenant);

    res.json({
      success: true,
      data: context,
    });
  } catch (error) {
    logger.error('Get me error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// API KEY ROUTES
// ============================================================================

/**
 * POST /api/keys
 * Create API key
 */
app.post('/api/keys', apiAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as unknown as { internalTenantId: string }).internalTenantId;

    const validation = createApiKeySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        details: validation.error.issues,
      });
      return;
    }

    const { name, permissions } = validation.data;
    const apiKey = await tenantService.createApiKey(tenantId, name, permissions);

    logger.info(`[TenantRegistry] API key created: ${tenantId}/${name}`);

    res.status(201).json({
      success: true,
      data: {
        key: apiKey.key,
        secret: apiKey.secret,
        name: apiKey.name,
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
        warning: 'Store the secret securely - it will not be shown again',
      },
    });
  } catch (error) {
    logger.error('Create API key error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/keys/:name
 * Revoke API key
 */
app.delete('/api/keys/:name', apiAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as unknown as { internalTenantId: string }).internalTenantId;
    const { name } = req.params;

    await tenantService.revokeApiKey(tenantId, name);

    logger.info(`[TenantRegistry] API key revoked: ${tenantId}/${name}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Revoke API key error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// TENANT ROUTES (ADMIN)
// ============================================================================

/**
 * GET /api/tenants
 * List all tenants (admin)
 */
app.get('/api/tenants', adminAuth, async (req: Request, res: Response) => {
  try {
    const type = req.query.type as TenantType | undefined;
    const status = req.query.status as TenantStatus | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await tenantService.listTenants({ type, status, page, limit });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('List tenants error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/tenants/:id
 * Get tenant by ID (admin)
 */
app.get('/api/tenants/:id', adminAuth, async (req: res: Response) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);

    if (!tenant) {
      res.status(404).json({ success: false, error: 'TENANT_NOT_FOUND' });
      return;
    }

    const context = await tenantService.getTenantContext(tenant);

    res.json({
      success: true,
      data: context,
    });
  } catch (error) {
    logger.error('Get tenant error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * PATCH /api/tenants/:id
 * Update tenant (admin)
 */
app.patch('/api/tenants/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tenant = await tenantService.updateTenant(id, updates);

    if (!tenant) {
      res.status(404).json({ success: false, error: 'TENANT_NOT_FOUND' });
      return;
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    logger.error('Update tenant error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/tenants/:id/suspend
 * Suspend tenant (admin)
 */
app.post('/api/tenants/:id/suspend', adminAuth, async (req: Request, res: Response) => {
  try {
    await tenantService.suspendTenant(req.params.id);
    logger.info(`[TenantRegistry] Tenant suspended: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Suspend tenant error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/tenants/:id/reactivate
 * Reactivate tenant (admin)
 */
app.post('/api/tenants/:id/reactivate', adminAuth, async (req: Request, res: Response) => {
  try {
    await tenantService.reactivateTenant(req.params.id);
    logger.info(`[TenantRegistry] Tenant reactivated: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Reactivate tenant error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// STATS ROUTES
// ============================================================================

/**
 * GET /api/stats
 * Get tenant statistics (admin)
 */
app.get('/api/stats', adminAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await tenantService.getTenantStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get stats error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// INTERNAL ROUTES (For downstream services)
// ============================================================================

/**
 * POST /api/internal/validate-key
 * Validate API key (internal use)
 */
app.post('/api/internal/validate-key', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      res.status(400).json({ success: false, error: 'API_KEY_REQUIRED' });
      return;
    }

    const tenant = await tenantService.validateApiKey(apiKey);

    if (!tenant) {
      res.status(401).json({ success: false, valid: false });
      return;
    }

    const context = await tenantService.getTenantContext(tenant);

    res.json({
      success: true,
      valid: true,
      tenant: context,
    });
  } catch (error) {
    logger.error('Validate key error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/internal/validate-jwt
 * Validate JWT and get tenant context (internal use)
 */
app.post('/api/internal/validate-jwt', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'TOKEN_REQUIRED' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { tenantId: string };
    const tenant = await tenantService.getTenantById(decoded.tenantId);

    if (!tenant) {
      res.status(401).json({ success: false, valid: false });
      return;
    }

    const context = await tenantService.getTenantContext(tenant);

    res.json({
      success: true,
      valid: true,
      tenant: context,
    });
  } catch (error) {
    res.status(401).json({ success: false, valid: false });
  }
});

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * POST /api/seed
 * Seed initial REZ internal tenants (admin)
 */
app.post('/api/seed', adminAuth, async (_req: Request, res: Response) => {
  try {
    const rezTenants = [
      { name: 'ReZ App', companyName: 'ReZ Consumer', rezCompanyId: 'rez-app' },
      { name: 'ReZ Ride', companyName: 'ReZ Mobility', rezCompanyId: 'rez-ride' },
      { name: 'Airzy', companyName: 'Airzy Travel', rezCompanyId: 'airzy' },
      { name: 'StayOwn', companyName: 'StayOwn Hotels', rezCompanyId: 'stayown' },
      { name: 'CorpPerks', companyName: 'CorpPerks India', rezCompanyId: 'corpperks' },
      { name: 'BuzzLocal', companyName: 'BuzzLocal', rezCompanyId: 'buzzlocal' },
    ];

    const results = [];
    for (const tenant of rezTenants) {
      try {
        const existing = await tenantService.getTenantById(`rez_${tenant.rezCompanyId}`);
        if (existing) {
          results.push({ name: tenant.name, status: 'already_exists' });
          continue;
        }

        await tenantService.createTenant({
          type: TenantType.REZ_INTERNAL,
          name: tenant.name,
          companyName: tenant.companyName,
          email: `${tenant.rezCompanyId}@rez.money`,
          rezCompanyId: tenant.rezCompanyId,
          password: 'rez-internal-2026',
        });
        results.push({ name: tenant.name, status: 'created' });
      } catch (e) {
        results.push({ name: tenant.name, status: 'error', error: e instanceof Error ? e.message : 'Unknown' });
      }
    }

    logger.info('[TenantRegistry] Seeded REZ tenants:', results);
    res.json({ success: true, results });
  } catch (error) {
    logger.error('Seed error:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[Error] ${req.path}:`, { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('[TenantRegistry] Connected to MongoDB');

    // Start server
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║          TENANT REGISTRY SERVICE STARTED                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:      ${PORT}                                             ║
║  Service:   tenant-registry                                 ║
║  Version:   1.0.0                                         ║
║  MongoDB:   ${MONGODB_URI.substring(0, 30)}...       ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('[TenantRegistry] Failed to start:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

start();

export default app;
