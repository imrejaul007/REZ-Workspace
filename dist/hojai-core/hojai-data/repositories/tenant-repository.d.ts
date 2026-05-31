/**
 * Hojai Data Platform - Tenant Repository
 * Version: 1.0 | Date: May 29, 2026
 */
import { Db } from 'mongodb';
import { BaseRepository } from './base-repository';
import { Tenant } from '../entities';
/**
 * Tenant Repository
 * Note: Tenant is not tenant-scoped (it's the root entity)
 */
export declare class TenantRepository extends BaseRepository<Tenant> {
    constructor(db: Db, tenant_id: string);
    /**
     * Find by slug
     */
    findBySlug(slug: string): Promise<Tenant | null>;
    /**
     * Find by email
     */
    findByEmail(email: string): Promise<Tenant | null>;
    /**
     * Find by type
     */
    findByType(type: 'internal' | 'commercial'): Promise<Tenant[]>;
    /**
     * Find by industry
     */
    findByIndustry(industry: string): Promise<Tenant[]>;
    /**
     * Update status
     */
    updateStatus(tenantId: string, status: 'active' | 'suspended' | 'churned'): Promise<void>;
    /**
     * Update plan
     */
    updatePlan(tenantId: string, plan: 'starter' | 'professional' | 'enterprise'): Promise<void>;
}
//# sourceMappingURL=tenant-repository.d.ts.map