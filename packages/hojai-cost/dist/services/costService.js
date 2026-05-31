"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.costService = exports.CostService = exports.BudgetModel = exports.CostEntryModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
const CostEntrySchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    userId: String,
    category: { type: String, enum: Object.values(index_js_1.CostCategory), required: true },
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
    metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
CostEntrySchema.index({ tenantId: 1, createdAt: -1 });
CostEntrySchema.index({ tenantId: 1, category: 1, createdAt: -1 });
const BudgetSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: Object.values(index_js_1.CostCategory), required: true },
    monthlyLimit: { type: Number, required: true },
    alertThreshold: { type: Number, default: 0.8 },
    currentSpend: { type: Number, default: 0 },
    lastReset: Date,
    alertsEnabled: { type: Boolean, default: true },
    alertEmails: [String],
    active: { type: Boolean, default: true }
}, { timestamps: true });
exports.CostEntryModel = mongoose_1.default.model('CostEntry', CostEntrySchema);
exports.BudgetModel = mongoose_1.default.model('Budget', BudgetSchema);
class CostService {
    redis;
    constructor() {
        const Redis = require('ioredis');
        this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    }
    /**
     * Track a cost entry
     */
    async trackCost(entry) {
        const doc = await exports.CostEntryModel.create({ ...entry, id: (0, uuid_1.v4)() });
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
        const entries = await exports.CostEntryModel.aggregate([
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
        const byService = await exports.CostEntryModel.aggregate([
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
        return exports.CostEntryModel.aggregate([
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
        const doc = await exports.BudgetModel.create({
            ...budget,
            id: (0, uuid_1.v4)(),
            currentSpend: 0,
            lastReset: new Date()
        });
        return doc.toObject();
    }
    /**
     * Get budgets
     */
    async getBudgets(tenantId) {
        const budgets = await exports.BudgetModel.find({ tenantId, active: true });
        return budgets.map(b => b.toObject());
    }
    async updateBudgetSpending(tenantId, category, cost) {
        await exports.BudgetModel.updateOne({ tenantId, category, active: true }, { $inc: { currentSpend: cost } });
    }
    async checkBudgetAlerts(tenantId, category) {
        const budget = await exports.BudgetModel.findOne({ tenantId, category, active: true });
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
exports.CostService = CostService;
exports.costService = new CostService();
