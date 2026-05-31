/**
 * HOJAI Performance Dashboard - MongoDB Models
 *
 * Mongoose schemas for KPI tracking, evaluations, compensation, and leaderboards.
 */
import mongoose, { Document, Model } from 'mongoose';
export { DEFAULT_EVALUATION_WEIGHTS } from '../types/index.js';
export interface IKPI extends Document {
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
}
export declare const KPI: Model<IKPI>;
export interface IKPIHistory extends Document {
    historyId: string;
    kpiId: string;
    employeeId: string;
    tenantId: string;
    changes: Record<string, {
        old: number;
        new: number;
    }>;
    timestamp: Date;
}
export declare const KPIHistory: Model<IKPIHistory>;
export interface IEvaluation extends Document {
    evaluationId: string;
    employeeId: string;
    tenantId: string;
    evaluatorId: string;
    period: string;
    periodType: 'weekly' | 'monthly' | 'quarterly';
    qualityScore: number;
    productivityScore: number;
    reliabilityScore: number;
    collaborationScore: number;
    growthScore: number;
    overallScore: number;
    percentileRank: number;
    tenantPercentileRank: number;
    status: 'draft' | 'completed' | 'archived';
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    completedAt?: Date;
}
export declare const Evaluation: Model<IEvaluation>;
export interface IEvaluationConfig extends Document {
    configId: string;
    tenantId: string;
    weights: {
        quality: number;
        productivity: number;
        reliability: number;
        collaboration: number;
        growth: number;
    };
    thresholds: {
        exceptional: number;
        exceeds: number;
        meets: number;
        needs: number;
    };
    autoEvaluation: boolean;
    evaluationFrequency: 'weekly' | 'monthly' | 'quarterly';
    updatedAt: Date;
}
export declare const EvaluationConfig: Model<IEvaluationConfig>;
export interface ICompensation extends Document {
    compensationId: string;
    employeeId: string;
    tenantId: string;
    period: string;
    baseAmount: number;
    compensationType: 'salary' | 'bonus' | 'commission' | 'performance_payout';
    performanceBonus: number;
    qualityBonus: number;
    revenueShare: number;
    penalty: number;
    grossAmount: number;
    taxDeduction: number;
    otherDeductions: number;
    netAmount: number;
    status: 'pending' | 'calculated' | 'approved' | 'paid' | 'cancelled';
    approvedBy?: string;
    approvedAt?: Date;
    paidAt?: Date;
    calculationDetails: {
        baseHourlyRate: number;
        hoursWorked: number;
        tasksCompleted: number;
        qualityMultiplier: number;
        performanceMultiplier: number;
        revenueSharePercentage: number;
        penaltyReasons: string[];
    };
    billingTransactionId?: string;
}
export declare const Compensation: Model<ICompensation>;
export interface ILeaderboardEntry {
    rank: number;
    employeeId: string;
    employeeName: string;
    department: string;
    role: string;
    score: number;
    previousRank?: number;
    rankChange: number;
    metrics: Record<string, number>;
    badge?: string;
}
export interface ILeaderboard extends Document {
    leaderboardId: string;
    tenantId: string;
    metric: 'overall' | 'productivity' | 'quality' | 'revenue' | 'efficiency';
    period: 'daily' | 'weekly' | 'monthly';
    periodLabel: string;
    entries: ILeaderboardEntry[];
    totalParticipants: number;
    generatedAt: Date;
}
export declare const Leaderboard: Model<ILeaderboard>;
export interface IPerformanceReport extends Document {
    reportId: string;
    employeeId: string;
    tenantId: string;
    reportType: 'individual' | 'team' | 'department' | 'organization';
    period: string;
    periodStart: Date;
    periodEnd: Date;
    summary: {
        overallScore: number;
        scoreChange: number;
        percentileChange: number;
        topStrength?: string;
        topImprovement?: string;
        totalTasks: number;
        completionRate: number;
        avgCustomerSatisfaction: number;
        totalRevenue: number;
        periodHighlights: string[];
    };
    kpiData: any;
    evaluationHistory: any;
    compensationHistory: any;
    trendAnalysis: any;
    generatedAt: Date;
    generatedBy: string;
}
export declare const PerformanceReport: Model<IPerformanceReport>;
export interface IEmployeeProfile extends Document {
    employeeId: string;
    tenantId: string;
    name: string;
    email: string;
    role: string;
    department: string;
    level: number;
    managerId?: string;
    hireDate: Date;
    status: 'active' | 'inactive' | 'onboarding';
    baseSalary: number;
    hourlyRate: number;
}
export declare const EmployeeProfile: Model<IEmployeeProfile>;
export declare const models: {
    KPI: mongoose.Model<IKPI, {}, {}, {}, mongoose.Document<unknown, {}, IKPI, {}, {}> & IKPI & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    KPIHistory: mongoose.Model<IKPIHistory, {}, {}, {}, mongoose.Document<unknown, {}, IKPIHistory, {}, {}> & IKPIHistory & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    Evaluation: mongoose.Model<IEvaluation, {}, {}, {}, mongoose.Document<unknown, {}, IEvaluation, {}, {}> & IEvaluation & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    EvaluationConfig: mongoose.Model<IEvaluationConfig, {}, {}, {}, mongoose.Document<unknown, {}, IEvaluationConfig, {}, {}> & IEvaluationConfig & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    Compensation: mongoose.Model<ICompensation, {}, {}, {}, mongoose.Document<unknown, {}, ICompensation, {}, {}> & ICompensation & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    Leaderboard: mongoose.Model<ILeaderboard, {}, {}, {}, mongoose.Document<unknown, {}, ILeaderboard, {}, {}> & ILeaderboard & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    PerformanceReport: mongoose.Model<IPerformanceReport, {}, {}, {}, mongoose.Document<unknown, {}, IPerformanceReport, {}, {}> & IPerformanceReport & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
    EmployeeProfile: mongoose.Model<IEmployeeProfile, {}, {}, {}, mongoose.Document<unknown, {}, IEmployeeProfile, {}, {}> & IEmployeeProfile & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    }, any>;
};
export default models;
//# sourceMappingURL=performanceModel.d.ts.map