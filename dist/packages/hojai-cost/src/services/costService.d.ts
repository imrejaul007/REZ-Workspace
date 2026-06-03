import mongoose from 'mongoose';
import { CostCategory, CostEntry, Budget } from '../types/index.js';
export declare const CostEntryModel: mongoose.Model<{
    category: CostCategory;
    tenantId: string;
    currency: string;
    quantity: number;
    service: string;
    totalCost: number;
    operation: string;
    unitCost: number;
    metadata?: Map<string, any> | null | undefined;
    userId?: string | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    category: CostCategory;
    tenantId: string;
    currency: string;
    quantity: number;
    service: string;
    totalCost: number;
    operation: string;
    unitCost: number;
    metadata?: Map<string, any> | null | undefined;
    userId?: string | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    category: CostCategory;
    tenantId: string;
    currency: string;
    quantity: number;
    service: string;
    totalCost: number;
    operation: string;
    unitCost: number;
    metadata?: Map<string, any> | null | undefined;
    userId?: string | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    category: CostCategory;
    tenantId: string;
    currency: string;
    quantity: number;
    service: string;
    totalCost: number;
    operation: string;
    unitCost: number;
    metadata?: Map<string, any> | null | undefined;
    userId?: string | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    category: CostCategory;
    tenantId: string;
    currency: string;
    quantity: number;
    service: string;
    totalCost: number;
    operation: string;
    unitCost: number;
    metadata?: Map<string, any> | null | undefined;
    userId?: string | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    category: CostCategory;
    tenantId: string;
    currency: string;
    quantity: number;
    service: string;
    totalCost: number;
    operation: string;
    unitCost: number;
    metadata?: Map<string, any> | null | undefined;
    userId?: string | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare const BudgetModel: mongoose.Model<{
    name: string;
    category: CostCategory;
    active: boolean;
    tenantId: string;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    name: string;
    category: CostCategory;
    active: boolean;
    tenantId: string;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    name: string;
    category: CostCategory;
    active: boolean;
    tenantId: string;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    category: CostCategory;
    active: boolean;
    tenantId: string;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    category: CostCategory;
    active: boolean;
    tenantId: string;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    category: CostCategory;
    active: boolean;
    tenantId: string;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export declare class CostService {
    private redis;
    constructor();
    /**
     * Track a cost entry
     */
    trackCost(entry: Omit<CostEntry, 'id' | 'createdAt'>): Promise<CostEntry>;
    /**
     * Get cost summary
     */
    getCostSummary(tenantId: string, period: {
        start: Date;
        end: Date;
    }): Promise<any>;
    /**
     * Get cost by user
     */
    getCostByUser(tenantId: string, period: {
        start: Date;
        end: Date;
    }): Promise<any[]>;
    /**
     * Create budget
     */
    createBudget(budget: Omit<Budget, 'id' | 'currentSpend' | 'lastReset' | 'createdAt' | 'updatedAt'>): Promise<Budget>;
    /**
     * Get budgets
     */
    getBudgets(tenantId: string): Promise<Budget[]>;
    private updateBudgetSpending;
    private checkBudgetAlerts;
}
export declare const costService: CostService;
//# sourceMappingURL=costService.d.ts.map