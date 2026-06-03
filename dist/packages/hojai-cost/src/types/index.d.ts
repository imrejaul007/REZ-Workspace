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
    category: CostCategory;
    id: string;
    createdAt: Date;
    tenantId: string;
    currency: string;
    unit: string;
    quantity: number;
    service: string;
    totalCost: number;
    operation: string;
    unitCost: number;
    metadata?: Record<string, any> | undefined;
    userId?: string | undefined;
    tokensUsed?: number | undefined;
    modelId?: string | undefined;
    latencyMs?: number | undefined;
}, {
    category: CostCategory;
    id: string;
    createdAt: Date;
    tenantId: string;
    unit: string;
    quantity: number;
    service: string;
    totalCost: number;
    operation: string;
    unitCost: number;
    metadata?: Record<string, any> | undefined;
    userId?: string | undefined;
    tokensUsed?: number | undefined;
    currency?: string | undefined;
    modelId?: string | undefined;
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
    name: string;
    category: CostCategory;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
    tenantId: string;
    monthlyLimit: number;
    alertThreshold: number;
    currentSpend: number;
    lastReset: Date;
    alertsEnabled: boolean;
    alertEmails?: string[] | undefined;
}, {
    name: string;
    category: CostCategory;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
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
    createdAt: Date;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    period: "daily" | "weekly" | "monthly";
    totalCost: number;
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
    createdAt: Date;
    tenantId: string;
    startDate: Date;
    endDate: Date;
    period: "daily" | "weekly" | "monthly";
    totalCost: number;
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