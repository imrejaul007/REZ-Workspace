import { z } from 'zod';
export declare enum CostCategory {
    INFERENCE = "inference",
    STORAGE = "storage",
    COMPUTE = "compute",
    API_CALLS = "api_calls",
    VECTOR_OPERATIONS = "vector_operations",
    EVENT_PROCESSING = "event_processing"
}
export declare const CostEntrySchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    category: z.ZodNativeEnum<typeof CostCategory>;
    service: z.ZodString;
    operation: z.ZodString;
    quantity: z.ZodNumber;
    unit: z.ZodString;
    unitCost: z.ZodNumber;
    totalCost: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    modelId: z.ZodOptional<z.ZodString>;
    tokensUsed: z.ZodOptional<z.ZodNumber>;
    latencyMs: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    currency: string;
    service: string;
    category: CostCategory;
    createdAt: Date;
    operation: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    modelId?: string | undefined;
    userId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    tokensUsed?: number | undefined;
    latencyMs?: number | undefined;
}, {
    id: string;
    tenantId: string;
    service: string;
    category: CostCategory;
    createdAt: Date;
    operation: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    currency?: string | undefined;
    modelId?: string | undefined;
    userId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    tokensUsed?: number | undefined;
    latencyMs?: number | undefined;
}>;
export type CostEntry = z.infer<typeof CostEntrySchema>;
export declare const BudgetSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    name: z.ZodString;
    category: z.ZodNativeEnum<typeof CostCategory>;
    monthlyLimit: z.ZodNumber;
    alertThreshold: z.ZodDefault<z.ZodNumber>;
    currentSpend: z.ZodDefault<z.ZodNumber>;
    lastReset: z.ZodDate;
    alertsEnabled: z.ZodDefault<z.ZodBoolean>;
    alertEmails: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    active: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    active: boolean;
    id: string;
    name: string;
    tenantId: string;
    category: CostCategory;
    createdAt: Date;
    updatedAt: Date;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    lastReset: Date;
    alertsEnabled: boolean;
    alertEmails?: string[] | undefined;
}, {
    id: string;
    name: string;
    tenantId: string;
    category: CostCategory;
    createdAt: Date;
    updatedAt: Date;
    monthlyLimit: number;
    lastReset: Date;
    active?: boolean | undefined;
    alertThreshold?: number | undefined;
    currentSpend?: number | undefined;
    alertsEnabled?: boolean | undefined;
    alertEmails?: string[] | undefined;
}>;
export type Budget = z.infer<typeof BudgetSchema>;
export declare const CostReportSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    period: z.ZodEnum<["daily", "weekly", "monthly"]>;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    totalCost: z.ZodNumber;
    totalQuantity: z.ZodNumber;
    byCategory: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byService: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byUser: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    vsLastPeriod: z.ZodNumber;
    vsBudget: z.ZodNumber;
    projectedMonthlyCost: z.ZodNumber;
    projectedMonthlyOverBudget: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    totalCost: number;
    period: "daily" | "weekly" | "monthly";
    totalQuantity: number;
    byCategory: Record<string, number>;
    byService: Record<string, number>;
    vsLastPeriod: number;
    vsBudget: number;
    projectedMonthlyCost: number;
    byUser?: Record<string, number> | undefined;
    projectedMonthlyOverBudget?: number | undefined;
}, {
    id: string;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    totalCost: number;
    period: "daily" | "weekly" | "monthly";
    totalQuantity: number;
    byCategory: Record<string, number>;
    byService: Record<string, number>;
    vsLastPeriod: number;
    vsBudget: number;
    projectedMonthlyCost: number;
    byUser?: Record<string, number> | undefined;
    projectedMonthlyOverBudget?: number | undefined;
}>;
export type CostReport = z.infer<typeof CostReportSchema>;
//# sourceMappingURL=index.d.ts.map