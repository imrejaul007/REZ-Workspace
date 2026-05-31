/**
 * Hojai Data Platform - Order Repository
 * Version: 1.0 | Date: May 29, 2026
 */
import { BaseRepository } from './base-repository';
/**
 * Order Repository
 */
export class OrderRepository extends BaseRepository {
    constructor(db, tenant_id) {
        super(db, 'orders', tenant_id);
    }
    /**
     * Find by order number
     */
    async findByOrderNumber(orderNumber) {
        return this.collection.findOne({ order_number: orderNumber });
    }
    /**
     * Find by customer
     */
    async findByCustomer(customerId) {
        return this.collection
            .find({ customer_id: customerId })
            .sort({ created_at: -1 })
            .toArray();
    }
    /**
     * Find by status
     */
    async findByStatus(status) {
        return this.collection
            .find({ status })
            .sort({ created_at: -1 })
            .toArray();
    }
    /**
     * Find recent orders
     */
    async findRecent(limit = 50) {
        return this.collection
            .find({ status: { $ne: 'cancelled' } })
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();
    }
    /**
     * Update order status
     */
    async updateStatus(orderId, status, changedBy, reason) {
        const history = {
            status,
            changed_at: new Date().toISOString(),
            changed_by: changedBy,
            reason
        };
        await this.collection.updateOne({ id: orderId, tenant_id: this.tenant_id }, {
            $set: { status, updated_at: new Date().toISOString() },
            $push: { status_history: history }
        });
    }
    /**
     * Get orders by date range
     */
    async findByDateRange(startDate, endDate) {
        return this.collection
            .find({
            created_at: {
                $gte: startDate,
                $lte: endDate
            }
        })
            .toArray();
    }
    /**
     * Calculate revenue metrics
     */
    async calculateRevenue(startDate, endDate) {
        const match = {
            status: { $in: ['completed', 'delivered'] }
        };
        if (startDate && endDate) {
            match.created_at = { $gte: startDate, $lte: endDate };
        }
        const result = await this.collection.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$total' }
                }
            }
        ]).toArray();
        if (result.length === 0) {
            return { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 };
        }
        return {
            totalRevenue: result[0].totalRevenue || 0,
            orderCount: result[0].orderCount || 0,
            avgOrderValue: result[0].avgOrderValue || 0
        };
    }
}
//# sourceMappingURL=order-repository.js.map