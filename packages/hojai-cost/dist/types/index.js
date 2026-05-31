"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostReportSchema = exports.BudgetSchema = exports.CostEntrySchema = exports.CostCategory = void 0;
const zod_1 = require("zod");
var CostCategory;
(function (CostCategory) {
    CostCategory["INFERENCE"] = "inference";
    CostCategory["STORAGE"] = "storage";
    CostCategory["COMPUTE"] = "compute";
    CostCategory["API_CALLS"] = "api_calls";
    CostCategory["VECTOR_OPERATIONS"] = "vector_operations";
    CostCategory["EVENT_PROCESSING"] = "event_processing";
})(CostCategory || (exports.CostCategory = CostCategory = {}));
exports.CostEntrySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    userId: zod_1.z.string().optional(),
    category: zod_1.z.nativeEnum(CostCategory),
    service: zod_1.z.string(),
    operation: zod_1.z.string(),
    // Usage
    quantity: zod_1.z.number(),
    unit: zod_1.z.string(),
    // Cost
    unitCost: zod_1.z.number(),
    totalCost: zod_1.z.number(),
    currency: zod_1.z.string().default('USD'),
    // Context
    modelId: zod_1.z.string().optional(),
    tokensUsed: zod_1.z.number().optional(),
    latencyMs: zod_1.z.number().optional(),
    // Metadata
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    createdAt: zod_1.z.date()
});
exports.BudgetSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    category: zod_1.z.nativeEnum(CostCategory),
    // Budget limits
    monthlyLimit: zod_1.z.number(),
    alertThreshold: zod_1.z.number().default(0.8), // Alert at 80%
    // Current usage
    currentSpend: zod_1.z.number().default(0),
    lastReset: zod_1.z.date(),
    // Alerts
    alertsEnabled: zod_1.z.boolean().default(true),
    alertEmails: zod_1.z.array(zod_1.z.string()).optional(),
    active: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.CostReportSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    tenantId: zod_1.z.string().uuid(),
    period: zod_1.z.enum(['daily', 'weekly', 'monthly']),
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date(),
    // Totals
    totalCost: zod_1.z.number(),
    totalQuantity: zod_1.z.number(),
    // Breakdown by category
    byCategory: zod_1.z.record(zod_1.z.number()),
    byService: zod_1.z.record(zod_1.z.number()),
    byUser: zod_1.z.record(zod_1.z.number()).optional(),
    // Trends
    vsLastPeriod: zod_1.z.number(), // percentage change
    vsBudget: zod_1.z.number(), // percentage of budget
    // Projections
    projectedMonthlyCost: zod_1.z.number(),
    projectedMonthlyOverBudget: zod_1.z.number().optional(),
    createdAt: zod_1.z.date()
});
