/**
 * AdBazaar Multi-Tenant Middleware
 *
 * Complete multi-tenant support for AdBazaar advertising platform.
 *
 * Features:
 * - Tenant identification via header, API key, JWT, or domain
 * - Inventory access control (internal vs marketplace)
 * - Feature flag management
 * - Rate limiting by tenant tier
 * - Pricing configuration
 *
 * Usage:
 * ```typescript
 * import { tenantMiddleware, requireInternalTenant, requireInventoryAccess } from '@rez/tenant-middleware';
 *
 * // Apply tenant middleware
 * app.use(tenantMiddleware());
 *
 * // Require internal tenant
 * app.get('/api/internal/data', requireInternalTenant(), handler);
 *
 * // Require specific inventory access
 * app.post('/api/campaign', requireInventoryAccess(InventoryCategory.REZ_APP_HOME_FEED), handler);
 * ```
 */

// Types
export * from './types';

// Context
export {
  getTenantContext,
  getTenantContextOrUndefined,
  hasTenantContext,
  withTenantContext,
  createTenantContext,
  createInternalTenantContext,
  createExternalTenantContext,
  canAccessInventory,
  canAccessAllInventory,
  filterAccessibleInventory,
  isInternalTenant,
  isExternalTenant,
} from './context';

// Middleware
export {
  tenantMiddleware,
  optionalTenantMiddleware,
  createApiKeyMiddleware,
  createCombinedTenantMiddleware,
  requireInternalTenant,
  requireFeature,
  requireInventoryAccess,
  validateCampaignInventory,
  getTenantRateLimit,
  createTenantMiddleware,
  TENANT_HEADERS,
  TenantIdMode,
} from './middleware';

export type { TenantMiddlewareOptions } from './middleware';

// Re-export commonly used types
export type { TenantContext } from './types';
export { TenantType, TenantTier, InventoryCategory, Platform } from './types';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tenant-middleware',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
