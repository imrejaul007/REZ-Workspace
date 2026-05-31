import { Model } from 'mongoose';
import { Tenant, TenantType, TenantStatus, TenantTier, TenantFeatures, TenantQuotas, TenantIsolation } from '../../types/index.js';
interface TenantDocument extends Tenant {
}
export declare const TenantModel: Model<TenantDocument>;
export declare class TenantManager {
    /**
     * Create a new tenant with proper isolation setup
     */
    createTenant(params: {
        name: string;
        type: TenantType;
        tier?: TenantTier;
        namespace?: string;
        features?: Partial<TenantFeatures>;
    }): Promise<Tenant>;
    /**
     * Set up isolated resources for a tenant
     */
    private setupTenantResources;
    /**
     * Get tenant by ID
     */
    getTenant(tenantId: string): Promise<Tenant | null>;
    /**
     * Get tenant by namespace
     */
    getTenantByNamespace(namespace: string): Promise<Tenant | null>;
    /**
     * Update tenant
     */
    updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant | null>;
    /**
     * Suspend a tenant
     */
    suspendTenant(tenantId: string, reason?: string): Promise<Tenant | null>;
    /**
     * Activate a tenant
     */
    activateTenant(tenantId: string): Promise<Tenant | null>;
    /**
     * Update tenant tier and quotas
     */
    updateTier(tenantId: string, tier: TenantTier): Promise<Tenant | null>;
    /**
     * Check and update quotas
     */
    checkQuota(tenantId: string, metric: keyof TenantQuotas, currentValue: number): Promise<{
        allowed: boolean;
        limit: number;
    }>;
    /**
     * List all tenants with filtering
     */
    listTenants(params?: {
        type?: TenantType;
        status?: TenantStatus;
        tier?: TenantTier;
        limit?: number;
        offset?: number;
    }): Promise<{
        tenants: Tenant[];
        total: number;
    }>;
    /**
     * Get tenant isolation configuration
     */
    getTenantIsolation(tenant: Tenant): TenantIsolation;
    /**
     * Build namespace prefixes for all resources
     */
    buildNamespaceMap(tenant: Tenant): Record<string, string>;
}
export declare const tenantManager: TenantManager;
export {};
//# sourceMappingURL=tenantManager.d.ts.map