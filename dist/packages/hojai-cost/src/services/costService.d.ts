import mongoose from 'mongoose';
import { CostCategory, CostEntry, Budget } from '../types/index.js';
export declare const CostEntryModel: mongoose.Model<{
    tenantId: string;
    category: CostCategory;
    currency: string;
    service: string;
    totalCost: number;
    quantity: number;
    operation: string;
    unitCost: number;
    userId?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    tenantId: string;
    category: CostCategory;
    currency: string;
    service: string;
    totalCost: number;
    quantity: number;
    operation: string;
    unitCost: number;
    userId?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    tenantId: string;
    category: CostCategory;
    currency: string;
    service: string;
    totalCost: number;
    quantity: number;
    operation: string;
    unitCost: number;
    userId?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
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
    tenantId: string;
    category: CostCategory;
    currency: string;
    service: string;
    totalCost: number;
    quantity: number;
    operation: string;
    unitCost: number;
    userId?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    tenantId: string;
    category: CostCategory;
    currency: string;
    service: string;
    totalCost: number;
    quantity: number;
    operation: string;
    unitCost: number;
    userId?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
    tokensUsed?: number | null | undefined;
    unit?: string | null | undefined;
    modelId?: string | null | undefined;
    latencyMs?: number | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    tenantId: string;
    category: CostCategory;
    currency: string;
    service: string;
    totalCost: number;
    quantity: number;
    operation: string;
    unitCost: number;
    userId?: string | null | undefined;
    metadata?: Map<string, any> | null | undefined;
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
    active: boolean;
    name: string;
    tenantId: string;
    category: CostCategory;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    active: boolean;
    name: string;
    tenantId: string;
    category: CostCategory;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    active: boolean;
    name: string;
    tenantId: string;
    category: CostCategory;
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
    active: boolean;
    name: string;
    tenantId: string;
    category: CostCategory;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    category: CostCategory;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    alertsEnabled: boolean;
    alertEmails: string[];
    lastReset?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    active: boolean;
    name: string;
    tenantId: string;
    category: CostCategory;
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