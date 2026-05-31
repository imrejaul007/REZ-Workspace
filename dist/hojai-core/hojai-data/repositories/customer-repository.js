/**
 * Hojai Data Platform - Customer Repository
 * Version: 1.0 | Date: May 29, 2026
 */
import { BaseRepository } from './base-repository';
/**
 * Customer Repository
 */
export class CustomerRepository extends BaseRepository {
    constructor(db, tenant_id) {
        super(db, 'customers', tenant_id);
    }
    /**
     * Find by phone
     */
    async findByPhone(phone) {
        return this.collection.findOne({ phone });
    }
    /**
     * Find by email
     */
    async findByEmail(email) {
        return this.collection.findOne({ email: email.toLowerCase() });
    }
    /**
     * Find by tags
     */
    async findByTags(tags) {
        return this.collection
            .find({ tags: { $in: tags } })
            .toArray();
    }
    /**
     * Find by segment
     */
    async findBySegment(segmentId) {
        return this.collection
            .find({ segments: segmentId })
            .toArray();
    }
    /**
     * Find high-value customers
     */
    async findHighValue(limit = 100) {
        return this.collection
            .find({ status: 'active' })
            .sort({ lifetime_value: -1 })
            .limit(limit)
            .toArray();
    }
    /**
     * Find at-risk customers
     */
    async findAtRisk() {
        return this.collection
            .find({ churn_risk: 'high', status: 'active' })
            .toArray();
    }
    /**
     * Update engagement score
     */
    async updateEngagementScore(customerId, score) {
        await this.updateOne({ id: customerId }, { engagement_score: score });
    }
    /**
     * Add tag to customer
     */
    async addTag(customerId, tag) {
        await this.collection.updateOne({ id: customerId, tenant_id: this.tenant_id }, { $addToSet: { tags: tag }, $set: { updated_at: new Date().toISOString() } });
    }
    /**
     * Add segment to customer
     */
    async addSegment(customerId, segmentId) {
        await this.collection.updateOne({ id: customerId, tenant_id: this.tenant_id }, { $addToSet: { segments: segmentId }, $set: { updated_at: new Date().toISOString() } });
    }
    /**
     * Update customer stats
     */
    async updateStats(customerId, stats) {
        await this.collection.updateOne({ id: customerId, tenant_id: this.tenant_id }, { $set: { ...stats, updated_at: new Date().toISOString() } });
    }
}
//# sourceMappingURL=customer-repository.js.map