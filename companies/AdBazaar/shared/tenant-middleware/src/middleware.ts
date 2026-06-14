/**
 * AdBazaar Tenant Middleware
 *
 * Express middleware for tenant identification and validation.
 */

import { Request, Response, NextFunction } from 'express';
import {
  TenantContext,
  TenantType,
  TenantTier,
  InventoryCategory,
  isInternalInventory,
  FeatureFlags,
} from './types';
import {
  getTenantContextOrUndefined,
  createInternalTenantContext,
  createExternalTenantContext,
  canAccessInventory,
  filterAccessibleInventory,
} from './context';

// ============================================================================
// TENANT IDENTIFICATION
// ============================================================================

/**
 * Headers used for tenant identification
 */
export const TENANT_HEADERS = {
  TENANT_ID: 'x-adbazaar-tenant-id',
  TENANT_TYPE: 'x-adbazaar-tenant-type',
  TENANT_COMPANY: 'x-adbazaar-company-id',
  API_KEY: 'x-api-key',
  AUTHORIZATION: 'authorization',
};

/**
 * Tenant identification modes
 */
export enum TenantIdMode {
  HEADER = 'header',       // x-adbazaar-tenant-id header
  API_KEY = 'api_key',     // API key lookup
  JWT = 'jwt',             // JWT token extraction
  DOMAIN = 'domain',       // Domain-based identification
}

/**
 * Middleware options
 */
export interface TenantMiddlewareOptions {
  /** How to identify tenant */
  mode: TenantIdMode;

  /** API key to secret mapping (for api_key mode) */
  apiKeys?: Record<string, { tenantId: string; type: TenantType; companyId?: string }>;

  /** JWT secret for verification (for jwt mode) */
  jwtSecret?: string;

  /** Domain to tenant mapping (for domain mode) */
  domains?: Record<string, { tenantId: string; type: TenantType }>;

  /** Whether to allow missing tenant (for public endpoints) */
  optional?: boolean;

  /** Whether to create default tenant for missing */
  createDefault?: boolean;

  /** Default tenant type for missing tenants */
  defaultType?: TenantType;
}

/**
 * Default middleware options
 */
const DEFAULT_OPTIONS: TenantMiddlewareOptions = {
  mode: TenantIdMode.HEADER,
  optional: false,
  createDefault: false,
  defaultType: TenantType.EXTERNAL,
};

/**
 * Identify tenant from request
 */
export async function identifyTenant(
  req: Request,
  options: TenantMiddlewareOptions
): Promise<TenantContext | null> {
  const { mode, apiKeys, domains, optional, createDefault, defaultType } = options;

  let tenant: TenantContext | null = null;

  switch (mode) {
    case TenantIdMode.HEADER:
      tenant = await identifyFromHeader(req);
      break;

    case TenantIdMode.API_KEY:
      tenant = await identifyFromApiKey(req, apiKeys || {});
      break;

    case TenantIdMode.JWT:
      tenant = await identifyFromJwt(req, options.jwtSecret || '');
      break;

    case TenantIdMode.DOMAIN:
      tenant = await identifyFromDomain(req, domains || {});
      break;
  }

  // Handle missing tenant
  if (!tenant) {
    if (optional) {
      return null;
    }
    if (createDefault) {
      return createDefaultTenant(defaultType || TenantType.EXTERNAL);
    }
    return null;
  }

  return tenant;
}

/**
 * Identify tenant from header
 */
async function identifyFromHeader(req: Request): Promise<TenantContext | null> {
  const tenantId = req.headers[TENANT_HEADERS.TENANT_ID] as string;
  const tenantType = req.headers[TENANT_HEADERS.TENANT_TYPE] as TenantType;
  const companyId = req.headers[TENANT_HEADERS.TENANT_COMPANY] as string;

  if (!tenantId) {
    return null;
  }

  // Validate tenant type
  if (!Object.values(TenantType).includes(tenantType)) {
    throw new Error(`Invalid tenant type: ${tenantType}`);
  }

  if (tenantType === TenantType.REZ_INTERNAL) {
    return createInternalTenantContext(companyId || tenantId, tenantId);
  }

  return createExternalTenantContext(tenantId, tenantId, tenantId);
}

/**
 * Identify tenant from API key
 */
async function identifyFromApiKey(
  req: Request,
  apiKeys: Record<string, { tenantId: string; type: TenantType; companyId?: string }>
): Promise<TenantContext | null> {
  const authHeader = req.headers[TENANT_HEADERS.AUTHORIZATION];
  const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const apiKey = (req.headers[TENANT_HEADERS.API_KEY] as string) ||
                 authValue?.replace('Bearer ', '');

  if (!apiKey) {
    return null;
  }

  const keyConfig = apiKeys[apiKey];
  if (!keyConfig) {
    return null;
  }

  if (keyConfig.type === TenantType.REZ_INTERNAL) {
    return createInternalTenantContext(
      keyConfig.companyId || keyConfig.tenantId,
      keyConfig.tenantId
    );
  }

  return createExternalTenantContext(
    keyConfig.tenantId,
    keyConfig.tenantId,
    keyConfig.tenantId
  );
}

/**
 * Identify tenant from JWT token (placeholder - needs JWT library)
 */
async function identifyFromJwt(req: Request, secret: string): Promise<TenantContext | null> {
  const authHeader = req.headers[TENANT_HEADERS.AUTHORIZATION];
  const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const token = authValue?.replace('Bearer ', '');

  if (!token || !secret) {
    return null;
  }

  // TODO: Implement JWT verification
  // const decoded = jwt.verify(token, secret);
  // return decoded.tenantContext;

  return null;
}

/**
 * Identify tenant from domain
 */
async function identifyFromDomain(
  req: Request,
  domains: Record<string, { tenantId: string; type: TenantType }>
): Promise<TenantContext | null> {
  const host = req.headers.host || '';
  const domain = host.replace(/:\d+$/, ''); // Remove port

  const config = domains[domain];
  if (!config) {
    return null;
  }

  if (config.type === TenantType.REZ_INTERNAL) {
    return createInternalTenantContext(config.tenantId, config.tenantId);
  }

  return createExternalTenantContext(config.tenantId, config.tenantId, config.tenantId);
}

/**
 * Create default tenant for unauthenticated requests
 */
function createDefaultTenant(type: TenantType): TenantContext {
  if (type === TenantType.REZ_INTERNAL) {
    return createInternalTenantContext('anonymous', 'Anonymous User');
  }

  return createExternalTenantContext('anonymous', 'Anonymous User', 'Anonymous');
}

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

/**
 * Create tenant middleware with options
 */
export function createTenantMiddleware(options: Partial<TenantMiddlewareOptions> = {}) {
  const fullOptions: TenantMiddlewareOptions = { ...DEFAULT_OPTIONS, ...options };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await identifyTenant(req, fullOptions);

      if (!tenant) {
        if (!fullOptions.optional) {
          res.status(401).json({
            success: false,
            error: 'TENANT_REQUIRED',
            message: 'Tenant identification required',
          });
          return;
        }
        // Optional mode - continue without tenant
        next();
        return;
      }

      // Attach tenant to request
      req.tenant = tenant;
      req.tenantId = tenant.tenantId;
      req.isInternalTenant = tenant.tenantType === TenantType.REZ_INTERNAL;

      next();
    } catch (error) {
      logger.error('Tenant middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'TENANT_ERROR',
        message: 'Failed to identify tenant',
      });
    }
  };
}

/**
 * Require internal tenant (REZ ecosystem only)
 */
export function requireInternalTenant() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({
        success: false,
        error: 'TENANT_REQUIRED',
        message: 'Tenant required',
      });
      return;
    }

    if (req.tenant.tenantType !== TenantType.REZ_INTERNAL) {
      res.status(403).json({
        success: false,
        error: 'INTERNAL_ONLY',
        message: 'This resource requires internal REZ tenant access',
      });
      return;
    }

    next();
  };
}

/**
 * Require specific feature
 */
export function requireFeature(feature: keyof FeatureFlags) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({
        success: false,
        error: 'TENANT_REQUIRED',
        message: 'Tenant required',
      });
      return;
    }

    if (!req.tenant.features[feature]) {
      res.status(403).json({
        success: false,
        error: 'FEATURE_NOT_ALLOWED',
        message: `Feature ${feature} is not available for your tenant type`,
      });
      return;
    }

    next();
  };
}

// ============================================================================
// INVENTORY ACCESS MIDDLEWARE
// ============================================================================

/**
 * Require access to specific inventory category
 */
export function requireInventoryAccess(category: InventoryCategory) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({
        success: false,
        error: 'TENANT_REQUIRED',
        message: 'Tenant required',
      });
      return;
    }

    // Check if internal inventory
    if (isInternalInventory(category)) {
      if (req.tenant.tenantType !== TenantType.REZ_INTERNAL) {
        res.status(403).json({
          success: false,
          error: 'INTERNAL_ONLY',
          message: `Inventory ${category} requires internal tenant access`,
        });
        return;
      }
    }

    // Check if tenant has access to this specific category
    if (!canAccessInventory(req.tenant, category)) {
      res.status(403).json({
        success: false,
        error: 'INVENTORY_NOT_ALLOWED',
        message: `Your tenant does not have access to inventory ${category}`,
      });
      return;
    }

    next();
  };
}

/**
 * Validate campaign inventory access
 * Attaches filtered inventory to request
 */
export function validateCampaignInventory(
  categories: InventoryCategory[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.tenant) {
      res.status(401).json({
        success: false,
        error: 'TENANT_REQUIRED',
        message: 'Tenant required',
      });
      return;
    }

    const { allowed, denied } = filterAccessibleInventory(req.tenant, categories);

    // Store filtered inventory on request for downstream use
    (req as unknown as { allowedInventory: InventoryCategory[]; deniedInventory: InventoryCategory[] })
      .allowedInventory = allowed;
    (req as unknown as { deniedInventory: InventoryCategory[] })
      .deniedInventory = denied;

    if (allowed.length === 0) {
      res.status(403).json({
        success: false,
        error: 'NO_ALLOWED_INVENTORY',
        message: 'None of the requested inventory categories are available for your tenant',
        deniedCategories: denied,
      });
      return;
    }

    next();
  };
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Get rate limit for current tenant
 */
export function getTenantRateLimit(req: Request): {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
} {
  if (!req.tenant) {
    return {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
      requestsPerDay: 50000,
    };
  }

  return {
    requestsPerMinute: req.tenant.rateLimits.requestsPerMinute,
    requestsPerHour: req.tenant.rateLimits.requestsPerHour,
    requestsPerDay: req.tenant.rateLimits.requestsPerDay,
  };
}

// ============================================================================
// PRESET MIDDLEWARES
// ============================================================================

/**
 * Standard tenant middleware (header-based)
 */
export const tenantMiddleware = createTenantMiddleware({
  mode: TenantIdMode.HEADER,
});

/**
 * Optional tenant middleware (allows missing tenant)
 */
export const optionalTenantMiddleware = createTenantMiddleware({
  mode: TenantIdMode.HEADER,
  optional: true,
});

/**
 * API key based tenant middleware
 */
export function createApiKeyMiddleware(
  apiKeys: Record<string, { tenantId: string; type: TenantType; companyId?: string }>
) {
  return createTenantMiddleware({
    mode: TenantIdMode.API_KEY,
    apiKeys,
  });
}

/**
 * Combined auth middleware (API key or header)
 */
export function createCombinedTenantMiddleware(
  apiKeys: Record<string, { tenantId: string; type: TenantType; companyId?: string }>
) {
  return createTenantMiddleware({
    mode: TenantIdMode.HEADER,
    optional: true,
  });
}
