/**
 * Hojai Data Platform - Order Repository
 * Version: 1.0 | Date: May 29, 2026
 */
import { Db } from 'mongodb';
import { BaseRepository } from './base-repository';
import { Order, OrderStatus } from '../entities';
/**
 * Order Repository
 */
export declare class OrderRepository extends BaseRepository<Order> {
    constructor(db: Db, tenant_id: string);
    /**
     * Find by order number
     */
    findByOrderNumber(orderNumber: string): Promise<Order | null>;
    /**
     * Find by customer
     */
    findByCustomer(customerId: string): Promise<Order[]>;
    /**
     * Find by status
     */
    findByStatus(status: OrderStatus): Promise<Order[]>;
    /**
     * Find recent orders
     */
    findRecent(limit?: number): Promise<Order[]>;
    /**
     * Update order status
     */
    updateStatus(orderId: string, status: OrderStatus, changedBy: string, reason?: string): Promise<void>;
    /**
     * Get orders by date range
     */
    findByDateRange(startDate: string, endDate: string): Promise<Order[]>;
    /**
     * Calculate revenue metrics
     */
    calculateRevenue(startDate?: string, endDate?: string): Promise<{
        totalRevenue: number;
        orderCount: number;
        avgOrderValue: number;
    }>;
}
//# sourceMappingURL=order-repository.d.ts.map