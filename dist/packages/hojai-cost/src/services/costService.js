import mongoose, { Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { CostCategory } from '../types/index.js';
const CostEntrySchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    userId: String,
    category: { type: String, enum: Object.values(CostCategory), required: true },
    service: { type: String, required: true },
    operation: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: String,
    unitCost: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    modelId: String,
    tokensUsed: Number,
    latencyMs: Number,
    metadata: { type: Map, of: Schema.Types.Mixed }
}, { timestamps: true });
CostEntrySchema.index({ tenantId: 1, createdAt: -1 });
CostEntrySchema.index({ tenantId: 1, category: 1, createdAt: -1 });
const BudgetSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: Object.values(CostCategory), required: true },
    monthlyLimit: { type: Number, required: true },
    alertThreshold: { type: Number, default: 0.8 },
    currentSpend: { type: Number, default: 0 },
    lastReset: Date,
    alertsEnabled: { type: Boolean, default: true },
    alertEmails: [String],
    active: { type: Boolean, default: true }
}, { timestamps: true });
export const CostEntryModel = mongoose.model('CostEntry', CostEntrySchema);
export const BudgetModel = mongoose.model('Budget', BudgetSchema);
export class CostService {
    redis;
    constructor() {
        const Redis = require('ioredis');
        this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    /**
     * Track a cost entry
     */
    async trackCost(entry) {
        const doc = await CostEntryModel.create({ ...entry, id: uuid() });
        // Update budget
        await this.updateBudgetSpending(entry.tenantId, entry.category, entry.totalCost);
        // Check alerts
        await this.checkBudgetAlerts(entry.tenantId, entry.category);
        return doc.toObject();
    }
    /**
     * Get cost summary
     */
    async getCostSummary(tenantId, period) {
        const entries = await CostEntryModel.aggregate([
            { $match: { tenantId, createdAt: { $gte: period.start, $lte: period.end } } },
            {
                $group: {
                    _id: '$category',
                    totalCost: { $sum: '$totalCost' },
                    totalQuantity: { $sum: '$quantity' },
                    avgCost: { $avg: '$totalCost' }
                }
            }
        ]);
        const byService = await CostEntryModel.aggregate([
            { $match: { tenantId, createdAt: { $gte: period.start, $lte: period.end } } },
            { $group: { _id: '$service', totalCost: { $sum: '$totalCost' } } }
        ]);
        return {
            period,
            totalCost: entries.reduce((sum, e) => sum + e.totalCost, 0),
            totalQuantity: entries.reduce((sum, e) => sum + e.totalQuantity, 0),
            byCategory: Object.fromEntries(entries.map(e => [e._id, e.totalCost])),
            byService: Object.fromEntries(byService.map(e => [e._id, e.totalCost])),
            details: entries
        };
    }
    /**
     * Get cost by user
     */
    async getCostByUser(tenantId, period) {
        return CostEntryModel.aggregate([
            { $match: { tenantId, createdAt: { $gte: period.start, $lte: period.end } } },
            { $group: { _id: '$userId', totalCost: { $sum: '$totalCost' }, count: { $sum: 1 } } },
            { $sort: { totalCost: -1 } },
            { $limit: 100 }
        ]);
    }
    /**
     * Create budget
     */
    async createBudget(budget) {
        const doc = await BudgetModel.create({
            ...budget,
            id: uuid(),
            currentSpend: 0,
            lastReset: new Date()
        });
        return doc.toObject();
    }
    /**
     * Get budgets
     */
    async getBudgets(tenantId) {
        const budgets = await BudgetModel.find({ tenantId, active: true });
        return budgets.map(b => b.toObject());
    }
    async updateBudgetSpending(tenantId, category, cost) {
        await BudgetModel.updateOne({ tenantId, category, active: true }, { $inc: { currentSpend: cost } });
    }
    async checkBudgetAlerts(tenantId, category) {
        const budget = await BudgetModel.findOne({ tenantId, category, active: true });
        if (!budget || !budget.alertsEnabled)
            return;
        const utilization = budget.currentSpend / budget.monthlyLimit;
        if (utilization >= budget.alertThreshold) {
            // In production, send email alert
            console.log(`[ALERT] Budget alert for ${tenantId}/${category}: ${(utilization * 100).toFixed(0)}% used`);
            // Reset if new month
            const now = new Date();
            const lastReset = new Date(budget.lastReset);
            if (now.getMonth() !== lastReset.getMonth()) {
                budget.currentSpend = 0;
                budget.lastReset = now;
                await budget.save();
            }
        }
    }
}
export const costService = new CostService();
//# sourceMappingURL=costService.js.map