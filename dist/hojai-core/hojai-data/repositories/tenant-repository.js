/**
 * Hojai Data Platform - Tenant Repository
 * Version: 1.0 | Date: May 29, 2026
 */
import { BaseRepository } from './base-repository';
/**
 * Tenant Repository
 * Note: Tenant is not tenant-scoped (it's the root entity)
 */
export class TenantRepository extends BaseRepository {
    constructor(db, tenant_id) {
        super(db, 'tenants', tenant_id);
    }
    /**
     * Find by slug
     */
    async findBySlug(slug) {
        return this.collection.findOne({ slug });
    }
    /**
     * Find by email
     */
    async findByEmail(email) {
        return this.collection.findOne({ email: email.toLowerCase() });
    }
    /**
     * Find by type
     */
    async findByType(type) {
        return this.collection.find({ type }).toArray();
    }
    /**
     * Find by industry
     */
    async findByIndustry(industry) {
        return this.collection.find({ industry }).toArray();
    }
    /**
     * Update status
     */
    async updateStatus(tenantId, status) {
        await this.collection.updateOne({ id: tenantId }, {
            $set: {
                status,
                updated_at: new Date().toISOString(),
                ...(status === 'suspended' ? { suspended_at: new Date().toISOString() } : {})
            }
        });
    }
    /**
     * Update plan
     */
    async updatePlan(tenantId, plan) {
        await this.collection.updateOne({ id: tenantId }, { $set: { plan, updated_at: new Date().toISOString() } });
    }
}
//# sourceMappingURL=tenant-repository.js.map