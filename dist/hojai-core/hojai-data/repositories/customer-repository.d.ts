/**
 * Hojai Data Platform - Customer Repository
 * Version: 1.0 | Date: May 29, 2026
 */
import { Db } from 'mongodb';
import { BaseRepository } from './base-repository';
import { Customer } from '../entities';
/**
 * Customer Repository
 */
export declare class CustomerRepository extends BaseRepository<Customer> {
    constructor(db: Db, tenant_id: string);
    /**
     * Find by phone
     */
    findByPhone(phone: string): Promise<Customer | null>;
    /**
     * Find by email
     */
    findByEmail(email: string): Promise<Customer | null>;
    /**
     * Find by tags
     */
    findByTags(tags: string[]): Promise<Customer[]>;
    /**
     * Find by segment
     */
    findBySegment(segmentId: string): Promise<Customer[]>;
    /**
     * Find high-value customers
     */
    findHighValue(limit?: number): Promise<Customer[]>;
    /**
     * Find at-risk customers
     */
    findAtRisk(): Promise<Customer[]>;
    /**
     * Update engagement score
     */
    updateEngagementScore(customerId: string, score: number): Promise<void>;
    /**
     * Add tag to customer
     */
    addTag(customerId: string, tag: string): Promise<void>;
    /**
     * Add segment to customer
     */
    addSegment(customerId: string, segmentId: string): Promise<void>;
    /**
     * Update customer stats
     */
    updateStats(customerId: string, stats: {
        lifetime_value?: number;
        order_count?: number;
        avg_order_value?: number;
        last_order_date?: string;
    }): Promise<void>;
}
//# sourceMappingURL=customer-repository.d.ts.map