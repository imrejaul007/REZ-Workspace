/**
 * AdBazaar Tenant Context
 *
 * Provides tenant context management for request lifecycle.
 */

import { AsyncLocalStorage } from 'async_hooks';
import {
  TenantContext,
  TenantType,
  TenantTier,
  InventoryCategory,
  DEFAULT_RATE_LIMITS,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_PRICING,
} from './types';

// ============================================================================
// ASYNC LOCAL STORAGE FOR TENANT CONTEXT
// ============================================================================

/**
 * AsyncLocalStorage instance for tenant context
 * Provides request-scoped tenant data without explicit passing
 */
const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Get the current tenant context
 * Throws if called outside of tenant-scoped execution
 */
export function getTenantContext(): TenantContext {
  const context = tenantStorage.getStore();
  if (!context) {
    throw new Error('Tenant context not available. Ensure request is wrapped with withTenantContext().');
  }
  return context;
}

/**
 * Get the current tenant context or undefined if not available
 */
export function getTenantContextOrUndefined(): TenantContext | undefined {
  return tenantStorage.getStore();
}

/**
 * Check if tenant context is available
 */
export function hasTenantContext(): boolean {
  return tenantStorage.getStore() !== undefined;
}

/**
 * Execute a function with tenant context
 * All async operations within the callback will have access to the tenant context
 */
export function withTenantContext<T>(
  tenant: TenantContext,
  callback: () => T
): T {
  return tenantStorage.run(tenant, callback);
}

/**
 * Create tenant context from various sources
 */
export function createTenantContext(params: {
  tenantId: string;
  tenantType: TenantType;
  tenantTier: TenantTier;
  tenantName: string;
  companyName: string;
  rezCompanyId?: string;
  metadata?: Record<string, unknown>;
}): TenantContext {
  const { tenantId, tenantType, tenantTier, tenantName, companyName, rezCompanyId, metadata } = params;

  // Determine allowed inventory based on tenant type
  const allowedInventory = getAllowedInventory(tenantType, tenantTier);

  return {
    tenantId,
    tenantType,
    tenantTier,
    tenantName,
    companyName,
    allowedInventory,
    rateLimits: DEFAULT_RATE_LIMITS[tenantTier] || DEFAULT_RATE_LIMITS[TenantTier.EXTERNAL_TIER_1],
    features: DEFAULT_FEATURE_FLAGS[tenantType],
    pricing: DEFAULT_PRICING[tenantType],
    metadata: metadata || {},
    isActive: true,
    createdAt: new Date(),
    lastActivityAt: new Date(),
    ...(rezCompanyId && { metadata: { ...metadata, rezCompanyId } }),
  };
}

/**
 * Get allowed inventory categories based on tenant type
 */
function getAllowedInventory(tenantType: TenantType, tenantTier: TenantTier): InventoryCategory[] {
  // All tenants can access marketplace inventory
  const marketplaceInventory: InventoryCategory[] = [
    InventoryCategory.DOOH_PUBLIC,
    InventoryCategory.QR_PUBLIC,
    InventoryCategory.CREATOR_PUBLIC,
    InventoryCategory.WHATSAPP_PUBLIC,
    InventoryCategory.EVENT_PUBLIC,
    InventoryCategory.BUZZLOCAL_PUBLIC,
    InventoryCategory.SOCIETY_PUBLIC,
    InventoryCategory.HOSPITALITY_PUBLIC,
    InventoryCategory.RETAIL_PUBLIC,
  ];

  // Internal tenants also get internal inventory
  if (tenantType === TenantType.REZ_INTERNAL) {
    const internalInventory: InventoryCategory[] = [
      InventoryCategory.REZ_APP_HOME_FEED,
      InventoryCategory.REZ_APP_RECOMMENDATION,
      InventoryCategory.REZ_RIDE_INAPP,
      InventoryCategory.REZ_RIDE_EXTERNAL,
      InventoryCategory.AIRZY_TRAVELER,
      InventoryCategory.AIRZY_LOUNGE,
      InventoryCategory.STAYOWN_GUEST,
      InventoryCategory.STAYOWN_LOBBY,
      InventoryCategory.CORPPERKS_EMPLOYEE,
      InventoryCategory.BUZZLOCAL_COMMUNITY,
      InventoryCategory.REZNOW_MERCHANT,
      InventoryCategory.RISACARE_HEALTH,
      InventoryCategory.KARMA_LOYALTY,
      InventoryCategory.REZ_WALLET_PLACEMENT,
    ];
    return [...internalInventory, ...marketplaceInventory];
  }

  // External tenants only get marketplace
  return marketplaceInventory;
}

/**
 * Create internal tenant context for REZ ecosystem companies
 */
export function createInternalTenantContext(rezCompanyId: string, tenantName: string): TenantContext {
  // Map REZ company to tier
  const tier = TenantTier.REZ_TIER_0;

  return createTenantContext({
    tenantId: `rez_${rezCompanyId}`,
    tenantType: TenantType.REZ_INTERNAL,
    tenantTier: tier,
    tenantName,
    companyName: tenantName,
    rezCompanyId,
    metadata: {
      source: 'rez_ecosystem',
      ecosystem: true,
    },
  });
}

/**
 * Create external tenant context for marketplace clients
 */
export function createExternalTenantContext(
  tenantId: string,
  tenantName: string,
  companyName: string,
  businessType?: string
): TenantContext {
  return createTenantContext({
    tenantId,
    tenantType: TenantType.EXTERNAL,
    tenantTier: TenantTier.EXTERNAL_TIER_1,
    tenantName,
    companyName,
    metadata: {
      source: 'marketplace',
      ecosystem: false,
      businessType,
    },
  });
}

/**
 * Validate tenant has access to specific inventory category
 */
export function canAccessInventory(tenant: TenantContext, category: InventoryCategory): boolean {
  return tenant.allowedInventory.includes(category);
}

/**
 * Validate tenant has access to all specified inventory categories
 */
export function canAccessAllInventory(tenant: TenantContext, categories: InventoryCategory[]): boolean {
  return categories.every(category => canAccessInventory(tenant, category));
}

/**
 * Filter inventory to only what tenant can access
 */
export function filterAccessibleInventory(
  tenant: TenantContext,
  requested: InventoryCategory[]
): { allowed: InventoryCategory[]; denied: InventoryCategory[] } {
  const allowed: InventoryCategory[] = [];
  const denied: InventoryCategory[] = [];

  for (const category of requested) {
    if (canAccessInventory(tenant, category)) {
      allowed.push(category);
    } else {
      denied.push(category);
    }
  }

  return { allowed, denied };
}

/**
 * Check if tenant is internal (REZ ecosystem)
 */
export function isInternalTenant(tenant: TenantContext): boolean {
  return tenant.tenantType === TenantType.REZ_INTERNAL;
}

/**
 * Check if tenant is external (marketplace)
 */
export function isExternalTenant(tenant: TenantContext): boolean {
  return tenant.tenantType === TenantType.EXTERNAL;
}

// ============================================================================
// CONTEXT SERIALIZATION
// ============================================================================

/**
 * Serialize tenant context for caching/transmission
 */
export function serializeTenantContext(tenant: TenantContext): string {
  return JSON.stringify({
    ...tenant,
    createdAt: tenant.createdAt.toISOString(),
    lastActivityAt: tenant.lastActivityAt.toISOString(),
  });
}

/**
 * Deserialize tenant context from cache/transmission
 */
export function deserializeTenantContext(data: string): TenantContext {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    lastActivityAt: new Date(parsed.lastActivityAt),
  };
}

/**
 * Get tenant ID from various sources
 */
export function extractTenantId(params: {
  header?: string;
  body?: { tenantId?: string };
  query?: { tenantId?: string };
}): string | undefined {
  // Try header first
  if (params.header) {
    return params.header;
  }

  // Try body
  if (params.body?.tenantId) {
    return params.body.tenantId;
  }

  // Try query
  if (params.query?.tenantId) {
    return params.query.tenantId;
  }

  return undefined;
}

// ============================================================================
// HOOKS FOR FRAMEWORK INTEGRATION
// ============================================================================

/**
 * Express middleware to attach tenant context to request
 */
export function attachTenantContext(tenant: TenantContext) {
  return <T extends { tenant?: TenantContext }>(req: T): T => {
    (req as unknown as { tenant: TenantContext }).tenant = tenant;
    return req;
  };
}

/**
 * Create a scoped executor for tenant-specific operations
 */
export function createTenantScopedExecutor(tenant: TenantContext) {
  return {
    run<T>(callback: () => T): T {
      return withTenantContext(tenant, callback);
    },
    runAsync<T>(callback: () => Promise<T>): Promise<T> {
      return withTenantContext(tenant, callback);
    },
  };
}
