/**
 * HOJAI Performance Dashboard - Type Definitions
 *
 * KPI, Evaluation, Compensation, and Performance Report types for AI employees.
 */
import { z } from 'zod';
export interface KPI {
    kpiId: string;
    employeeId: string;
    tenantId: string;
    period: string;
    tasksCompleted: number;
    tasksFailed: number;
    tasksInProgress: number;
    tasksCancelled: number;
    totalTasksAttempted: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    customerSatisfaction: number;
    qualityScore: number;
    revenueGenerated: number;
    revenuePerTask: number;
    conversionRate: number;
    errorRate: number;
    escalationRate: number;
    escalationCount: number;
    utilizationRate: number;
    avgResolutionTime: number;
    throughputPerHour: number;
    peerRating: number;
    teamContributionScore: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface KPIUpdate {
    tasksCompleted?: number;
    tasksFailed?: number;
    responseTime?: number;
    customerSatisfaction?: number;
    revenueGenerated?: number;
    errorOccurred?: boolean;
    escalationTriggered?: boolean;
}
export type EvaluationPeriod = 'weekly' | 'monthly' | 'quarterly';
export type EvaluationStatus = 'draft' | 'completed' | 'archived';
export interface Evaluation {
    evaluationId: string;
    employeeId: string;
    tenantId: string;
    evaluatorId: string;
    period: string;
    periodType: EvaluationPeriod;
    qualityScore: number;
    productivityScore: number;
    reliabilityScore: number;
    collaborationScore: number;
    growthScore: number;
    overallScore: number;
    percentileRank: number;
    tenantPercentileRank: number;
    status: EvaluationStatus;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export interface EvaluationWeights {
    quality: number;
    productivity: number;
    reliability: number;
    collaboration: number;
    growth: number;
}
export type CompensationStatus = 'pending' | 'calculated' | 'approved' | 'paid' | 'cancelled';
export type CompensationType = 'salary' | 'bonus' | 'commission' | 'performance_payout';
export interface Compensation {
    compensationId: string;
    employeeId: string;
    tenantId: string;
    period: string;
    baseAmount: number;
    compensationType: CompensationType;
    performanceBonus: number;
    qualityBonus: number;
    revenueShare: number;
    penalty: number;
    grossAmount: number;
    taxDeduction: number;
    otherDeductions: number;
    netAmount: number;
    status: CompensationStatus;
    approvedBy?: string;
    approvedAt?: Date;
    paidAt?: Date;
    calculationDetails: CompensationBreakdown;
    billingTransactionId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CompensationBreakdown {
    baseHourlyRate: number;
    hoursWorked: number;
    tasksCompleted: number;
    qualityMultiplier: number;
    performanceMultiplier: number;
    revenueSharePercentage: number;
    penaltyReasons: string[];
}
export interface CompensationConfig {
    baseSalary: number;
    maxBonusMultiplier: number;
    revenueSharePercentage: number;
    taxRate: number;
    qualityThreshold: number;
}
export type LeaderboardMetric = 'overall' | 'productivity' | 'quality' | 'revenue' | 'efficiency';
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';
export interface LeaderboardEntry {
    rank: number;
    employeeId: string;
    employeeName: string;
    department: string;
    role: string;
    score: number;
    previousRank?: number;
    rankChange: number;
    metrics: {
        overall?: number;
        productivity?: number;
        quality?: number;
        revenue?: number;
        efficiency?: number;
    };
    badge?: 'top_performer' | 'most_improved' | 'quality_champion' | 'revenue_leader' | 'streak';
}
export interface Leaderboard {
    leaderboardId: string;
    tenantId: string;
    metric: LeaderboardMetric;
    period: LeaderboardPeriod;
    periodLabel: string;
    entries: LeaderboardEntry[];
    totalParticipants: number;
    generatedAt: Date;
}
export type ReportType = 'individual' | 'team' | 'department' | 'organization';
export type ReportFormat = 'json' | 'pdf' | 'csv';
export interface PerformanceReport {
    reportId: string;
    employeeId: string;
    tenantId: string;
    reportType: ReportType;
    period: string;
    periodStart: Date;
    periodEnd: Date;
    summary: ReportSummary;
    kpiData: KPISummary;
    evaluationHistory: EvaluationSummary[];
    compensationHistory: CompensationSummary[];
    trendAnalysis: TrendData[];
    generatedAt: Date;
    generatedBy: string;
    createdAt: Date;
}
export interface ReportSummary {
    overallScore: number;
    scoreChange: number;
    percentileChange: number;
    topStrength: string;
    topImprovement: string;
    totalTasks: number;
    completionRate: number;
    avgCustomerSatisfaction: number;
    totalRevenue: number;
    periodHighlights: string[];
}
export interface KPISummary {
    current: Partial<KPI>;
    previous: Partial<KPI>;
    changes: Record<string, number>;
}
export interface EvaluationSummary {
    evaluationId: string;
    period: string;
    overallScore: number;
    componentScores: {
        quality: number;
        productivity: number;
        reliability: number;
        collaboration: number;
        growth: number;
    };
}
export interface CompensationSummary {
    compensationId: string;
    period: string;
    grossAmount: number;
    netAmount: number;
    breakdown: {
        base: number;
        bonus: number;
        penalty: number;
    };
}
export interface TrendData {
    date: string;
    metric: string;
    value: number;
}
export interface KPIQueryParams {
    period?: string;
    startDate?: string;
    endDate?: string;
}
export interface LeaderboardQueryParams {
    metric?: LeaderboardMetric;
    period?: LeaderboardPeriod;
    limit?: number;
    department?: string;
}
export interface CompensationCalculateRequest {
    employeeId: string;
    period: string;
    overrideBase?: number;
}
export interface ReportGenerateRequest {
    employeeId: string;
    reportType?: ReportType;
    periodStart: string;
    periodEnd: string;
    format?: ReportFormat;
}
export declare const KPIUpdateSchema: z.ZodObject<{
    tasksCompleted: z.ZodOptional<z.ZodNumber>;
    tasksFailed: z.ZodOptional<z.ZodNumber>;
    responseTime: z.ZodOptional<z.ZodNumber>;
    customerSatisfaction: z.ZodOptional<z.ZodNumber>;
    revenueGenerated: z.ZodOptional<z.ZodNumber>;
    errorOccurred: z.ZodOptional<z.ZodBoolean>;
    escalationTriggered: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    tasksCompleted?: number | undefined;
    tasksFailed?: number | undefined;
    responseTime?: number | undefined;
    customerSatisfaction?: number | undefined;
    revenueGenerated?: number | undefined;
    errorOccurred?: boolean | undefined;
    escalationTriggered?: boolean | undefined;
}, {
    tasksCompleted?: number | undefined;
    tasksFailed?: number | undefined;
    responseTime?: number | undefined;
    customerSatisfaction?: number | undefined;
    revenueGenerated?: number | undefined;
    errorOccurred?: boolean | undefined;
    escalationTriggered?: boolean | undefined;
}>;
export declare const CompensationCalculateSchema: z.ZodObject<{
    employeeId: z.ZodString;
    period: z.ZodString;
    overrideBase: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    period: string;
    employeeId: string;
    overrideBase?: number | undefined;
}, {
    period: string;
    employeeId: string;
    overrideBase?: number | undefined;
}>;
export declare const LeaderboardQuerySchema: z.ZodObject<{
    metric: z.ZodOptional<z.ZodEnum<["overall", "productivity", "quality", "revenue", "efficiency"]>>;
    period: z.ZodOptional<z.ZodEnum<["daily", "weekly", "monthly"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
    department: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    period?: "daily" | "weekly" | "monthly" | undefined;
    metric?: "revenue" | "efficiency" | "quality" | "overall" | "productivity" | undefined;
    department?: string | undefined;
}, {
    limit?: number | undefined;
    period?: "daily" | "weekly" | "monthly" | undefined;
    metric?: "revenue" | "efficiency" | "quality" | "overall" | "productivity" | undefined;
    department?: string | undefined;
}>;
export declare const ReportGenerateSchema: z.ZodObject<{
    employeeId: z.ZodString;
    reportType: z.ZodOptional<z.ZodEnum<["individual", "team", "department", "organization"]>>;
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
    format: z.ZodOptional<z.ZodEnum<["json", "pdf", "csv"]>>;
}, "strip", z.ZodTypeAny, {
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    format?: "pdf" | "csv" | "json" | undefined;
    reportType?: "department" | "organization" | "individual" | "team" | undefined;
}, {
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    format?: "pdf" | "csv" | "json" | undefined;
    reportType?: "department" | "organization" | "individual" | "team" | undefined;
}>;
export declare const DEFAULT_EVALUATION_WEIGHTS: EvaluationWeights;
export declare const DEFAULT_COMPENSATION_CONFIG: CompensationConfig;
export declare const KPI_THRESHOLDS: {
    readonly excellent: 90;
    readonly good: 75;
    readonly average: 60;
    readonly poor: 40;
};
export declare const EVALUATION_GRADES: {
    readonly exceptional: {
        readonly min: 95;
        readonly label: "Exceptional";
        readonly color: "#22C55E";
    };
    readonly exceeds: {
        readonly min: 85;
        readonly label: "Exceeds Expectations";
        readonly color: "#3B82F6";
    };
    readonly meets: {
        readonly min: 70;
        readonly label: "Meets Expectations";
        readonly color: "#FACC15";
    };
    readonly needs: {
        readonly min: 50;
        readonly label: "Needs Improvement";
        readonly color: "#F97316";
    };
    readonly unsatisfactory: {
        readonly min: 0;
        readonly label: "Unsatisfactory";
        readonly color: "#EF4444";
    };
};
//# sourceMappingURL=index.d.ts.map