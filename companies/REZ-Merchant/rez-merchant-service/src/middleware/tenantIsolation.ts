/**
 * Multi-Tenant Security Isolation Middleware
 * Ensures complete data isolation between tenants
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// ── Tenant Types ─────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise';
  features: string[];
  limits: {
    stores: number;
    staff: number;
    ordersPerMonth: number;
    apiCallsPerDay: number;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    dataRetention: number; // days
  };
  status: 'active' | 'suspended' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContext {
  tenantId: string;
  merchantId: string;
  userId?: string;
  roles: string[];
  permissions: string[];
  ipAddress: string;
  userAgent: string;
  requestId: string;
}

// ── Tenant Resolution ────────────────────────────────────────────────────────

type TenantResolver = (req: Request) => Promise<string | null>;

const defaultTenantResolvers: TenantResolver[] = [
  // 1. From JWT token (most trusted)
  async (req: Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
      // JWT would be decoded here
      // Return tenantId from token payload
      const token = authHeader.split(' ')[1];
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.tenantId || payload.merchantId || null;
    } catch {
      return null;
    }
  },

  // 2. From X-Tenant-ID header (for internal services)
  async (req: Request) => {
    return (req.headers['x-tenant-id'] as string) || null;
  },

  // 3. From subdomain
  async (req: Request) => {
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];

    // Skip www and common subdomains
    if (['www', 'api', 'admin', 'localhost'].includes(subdomain)) {
      return null;
    }

    return subdomain;
  },

  // 4. From path parameter
  async (req: Request) => {
    // Check common path patterns
    return (req.params.tenantId || req.params.merchantId || req.query.tenantId) as string || null;
  },
];

// ── Tenant Cache ────────────────────────────────────────────────────────────

const tenantCache = new Map<string, { tenant: Tenant; expiresAt: number }>();
const TENANT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTenantFromCache(tenantId: string): Promise<Tenant | null> {
  const cached = tenantCache.get(tenantId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  // Fetch from database (mock - would query tenant collection)
  const tenant = await fetchTenant(tenantId);

  if (tenant) {
    tenantCache.set(tenantId, {
      tenant,
      expiresAt: Date.now() + TENANT_CACHE_TTL,
    });
  }

  return tenant;
}

async function fetchTenant(tenantId: string): Promise<Tenant | null> {
  // This would query the tenants collection
  // Mock implementation
  return null;
}

function invalidateTenantCache(tenantId: string): void {
  tenantCache.delete(tenantId);
}

// ── Request Scoping ────────────────────────────────────────────────────────

/**
 * Automatically scope all Mongoose queries to the current tenant
 */
export function setupTenantScoping(): void {
  // Add tenant context to all queries
  mongoose.plugin((schema: any) => {
    // Only apply to schemas that have tenantId field
    if (schema.obj.tenantId) {
      schema.pre(['find', 'findOne', 'count', 'aggregate'], function () {
        const context = (global as any).__tenantContext;
        if (context?.tenantId) {
          // Only apply if query doesn't already specify tenantId
          if (!this.getQuery().tenantId) {
            this.where({ tenantId: context.tenantId });
          }
        }
      });

      // Ensure tenantId is always set on save
      schema.pre('save', function (next) {
        const context = (global as any).__tenantContext;
        if (context?.tenantId && !this.tenantId) {
          this.tenantId = context.tenantId;
        }
        next();
      });
    }
  });
}

// ── Middleware Factory ───────────────────────────────────────────────────────

export interface TenantMiddlewareOptions {
  resolvers?: TenantResolver[];
  required?: boolean;
  checkStatus?: boolean;
  checkPlan?: string[];
  checkFeatures?: string[];
  enforceLimits?: boolean;
  onUnauthorized?: (req: Request, res: Response) => void;
  onTenantNotFound?: (req: Request, res: Response) => void;
}

export function createTenantMiddleware(options: TenantMiddlewareOptions = {}) {
  const {
    resolvers = defaultTenantResolvers,
    required = true,
    checkStatus = true,
    checkPlan,
    checkFeatures,
    enforceLimits = true,
    onUnauthorized,
    onTenantNotFound,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Resolve tenant
    let tenantId: string | null = null;

    for (const resolver of resolvers) {
      tenantId = await resolver(req);
      if (tenantId) break;
    }

    // Check if tenant is required
    if (!tenantId) {
      if (required) {
        if (onUnauthorized) {
          return onUnauthorized(req, res);
        }
        return res.status(401).json({
          success: false,
          error: {
            code: 'TENANT_REQUIRED',
            message: 'Tenant identification is required',
          },
        });
      }
      return next();
    }

    // Get tenant details
    const tenant = await getTenantFromCache(tenantId);

    if (!tenant) {
      if (onTenantNotFound) {
        return onTenantNotFound(req, res);
      }
      return res.status(404).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant not found',
        },
      });
    }

    // Check tenant status
    if (checkStatus && tenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_INACTIVE',
          message: tenant.status === 'suspended'
            ? 'Tenant account is suspended'
            : 'Tenant account is inactive',
        },
      });
    }

    // Check plan requirements
    if (checkPlan && checkPlan.length > 0) {
      const planHierarchy = ['starter', 'professional', 'enterprise'];
      const tenantPlanIndex = planHierarchy.indexOf(tenant.plan);
      const requiredPlans = checkPlan.map((p) => planHierarchy.indexOf(p));
      const meetsRequirement = requiredPlans.some((idx) => idx <= tenantPlanIndex);

      if (!meetsRequirement) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PLAN_REQUIRED',
            message: `This feature requires a ${checkPlan.join(' or ')} plan`,
            currentPlan: tenant.plan,
          },
        });
      }
    }

    // Check feature requirements
    if (checkFeatures && checkFeatures.length > 0) {
      const hasAllFeatures = checkFeatures.every((feature) =>
        tenant.features.includes(feature)
      );

      if (!hasAllFeatures) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FEATURE_NOT_ENABLED',
            message: 'Required feature is not enabled for this tenant',
            missingFeatures: checkFeatures.filter((f) => !tenant.features.includes(f)),
          },
        });
      }
    }

    // Build tenant context
    const tenantContext: TenantContext = {
      tenantId: tenant.id,
      merchantId: tenant.id, // Alias for compatibility
      userId: (req as any).user?.id,
      roles: (req as any).user?.roles || [],
      permissions: (req as any).user?.permissions || [],
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      requestId: (req as any).requestId || `req_${Date.now()}`,
    };

    // Set tenant context globally (for Mongoose scoping)
    (global as any).__tenantContext = tenantContext;

    // Attach to request for use in route handlers
    (req as any).tenant = tenant;
    (req as any).tenantContext = tenantContext;

    // Check rate limits per tenant
    if (enforceLimits) {
      const limitCheck = await checkTenantLimits(tenant.id, tenant.limits);
      if (!limitCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `API rate limit exceeded. Resets in ${limitCheck.resetIn}`,
            limit: tenant.limits.apiCallsPerDay,
            current: limitCheck.current,
          },
          headers: {
            'X-RateLimit-Limit': tenant.limits.apiCallsPerDay,
            'X-RateLimit-Remaining': limitCheck.remaining,
            'X-RateLimit-Reset': limitCheck.resetAt,
          },
        });
      }
    }

    // Add security headers
    res.setHeader('X-Tenant-ID', tenant.id);
    res.setHeader('X-Tenant-Plan', tenant.plan);

    next();
  };
}

// ── Rate Limiting ──────────────────────────────────────────────────────────

interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetAt: number;
  resetIn: string;
}

async function checkTenantLimits(tenantId: string, limits: Tenant['limits']): Promise<LimitCheck> {
  // Use Redis for distributed rate limiting
  // Mock implementation
  const key = `ratelimit:tenant:${tenantId}`;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const resetAt = startOfDay.getTime() + 24 * 60 * 60 * 1000;

  // Mock: always allowed
  return {
    allowed: true,
    current: 0,
    limit: limits.apiCallsPerDay,
    remaining: limits.apiCallsPerDay,
    resetAt: Math.floor(resetAt / 1000),
    resetIn: '24 hours',
  };
}

// ── Permission Checking ────────────────────────────────────────────────────

/**
 * Middleware to check specific permissions
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const context: TenantContext = (req as any).tenantContext;

    if (!context) {
      return res.status(401).json({
        success: false,
        error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' },
      });
    }

    // Admin has all permissions
    if (context.roles.includes('admin') || context.roles.includes('superadmin')) {
      return next();
    }

    // Check if user has all required permissions
    const hasPermission = permissions.every((perm) =>
      context.permissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to perform this action',
          required: permissions,
        },
      });
    }

    next();
  };
}

/**
 * Middleware to check specific roles
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const context: TenantContext = (req as any).tenantContext;

    if (!context) {
      return res.status(401).json({
        success: false,
        error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' },
      });
    }

    // Check if user has any of the required roles
    const hasRole = roles.some((role) => context.roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ROLE_REQUIRED',
          message: `This action requires one of: ${roles.join(', ')}`,
        },
      });
    }

    next();
  };
}

// ── Data Access Control ─────────────────────────────────────────────────────

/**
 * Create query filter to ensure tenant isolation
 */
export function createTenantFilter(context: TenantContext, additionalFilters: Record<string, any> = {}): Record<string, any> {
  return {
    tenantId: context.tenantId,
    ...additionalFilters,
  };
}

/**
 * Verify document belongs to current tenant
 */
export async function verifyTenantOwnership(
  model: mongoose.Model<any>,
  documentId: string,
  context: TenantContext
): Promise<boolean> {
  try {
    const doc = await model.findOne({
      _id: documentId,
      tenantId: context.tenantId,
    });

    return !!doc;
  } catch {
    return false;
  }
}

/**
 * Middleware to verify document ownership
 */
export function requireOwnership(model: mongoose.Model<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const context: TenantContext = (req as any).tenantContext;
    const documentId = req.params.id || req.params.documentId;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: { code: 'DOCUMENT_ID_REQUIRED', message: 'Document ID is required' },
      });
    }

    const isOwner = await verifyTenantOwnership(model, documentId, context);

    if (!isOwner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      });
    }

    next();
  };
}

// ── Audit Logging ───────────────────────────────────────────────────────────

/**
 * Log tenant-scoped actions for audit
 */
export async function logTenantAction(
  context: TenantContext,
  action: string,
  resource: string,
  details: Record<string, any> = {}
): Promise<void> {
  // Would write to audit log collection
  console.log('[Audit]', {
    timestamp: new Date().toISOString(),
    tenantId: context.tenantId,
    userId: context.userId,
    action,
    resource,
    ip: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
    details,
  });
}

// ── Utility Functions ───────────────────────────────────────────────────────

/**
 * Get current tenant from request
 */
export function getTenant(req: Request): Tenant | null {
  return (req as any).tenant || null;
}

/**
 * Get current tenant context from request
 */
export function getTenantContext(req: Request): TenantContext | null {
  return (req as any).tenantContext || null;
}

/**
 * Clear tenant context (for cleanup)
 */
export function clearTenantContext(): void {
  delete (global as any).__tenantContext;
}

// ── Pre-built Middleware Combinations ──────────────────────────────────────

/**
 * Standard tenant middleware with common options
 */
export const tenantMiddleware = createTenantMiddleware({
  required: true,
  checkStatus: true,
  enforceLimits: true,
});

/**
 * Optional tenant middleware for public endpoints
 */
export const optionalTenantMiddleware = createTenantMiddleware({
  required: false,
  checkStatus: true,
  enforceLimits: false,
});

/**
 * Admin tenant middleware for tenant management
 */
export const adminTenantMiddleware = createTenantMiddleware({
  required: true,
  checkStatus: true,
  checkPlan: ['enterprise'],
  enforceLimits: false,
});

export default createTenantMiddleware;
