import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { Tenant } from '../../types/index.js';
/**
 * Tenant Isolation Middleware
 * Ensures all data operations are scoped to the tenant's namespace
 */
export declare class TenantIsolation {
    private redis;
    constructor();
    /**
     * Middleware to set up tenant context
     */
    setupTenantContext: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Build MongoDB collection name with tenant prefix
     */
    getTenantCollection(collectionName: string, tenant: Tenant): string;
    /**
     * Build Redis key with tenant prefix
     */
    getTenantKey(tenant: Tenant, key: string): string;
    /**
     * Build vector collection name with tenant prefix
     */
    getTenantVectorCollection(tenant: Tenant, collectionName: string): string;
    /**
     * Build event namespace for the tenant
     */
    getTenantEventNamespace(tenant: Tenant, eventType: string): string;
    /**
     * Verify tenant can access a specific resource
     */
    verifyResourceAccess(params: {
        tenantId: string;
        resourceTenantId: string;
        resourceType: string;
        action: string;
    }): Promise<boolean>;
    /**
     * Middleware to enforce tenant data boundaries
     */
    enforceTenantBoundary: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get tenant-scoped Redis client
     */
    getTenantRedis(tenantId: string): Promise<Redis>;
    /**
     * Check if a tenant has access to privileged features
     */
    hasPrivilegedAccess(tenantId: string): Promise<boolean>;
    /**
     * Validate data isolation for a query
     */
    validateQueryIsolation(tenant: Tenant, query: Record<string, unknown>): Record<string, unknown>;
    /**
     * Sanitize response to remove cross-tenant data
     */
    sanitizeResponse<T>(tenantId: string, data: T): T;
}
export declare const tenantIsolation: TenantIsolation;
/**
 * Express middleware to automatically scope Redis operations to tenant
 */
export declare const scopeRedisToTenant: (tenantId: string, isolation: Tenant["isolation"]) => (originalMethod: (...args: any[]) => any) => (...args: any[]) => Promise<any>;
/**
 * Middleware to check quota before operations
 */
export declare const checkQuota: (metric: "events" | "api_calls" | "storage") => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=tenantIsolation.d.ts.map