/**
 * HOJAI Performance Dashboard - MongoDB Models
 *
 * Mongoose schemas for KPI tracking, evaluations, compensation, and leaderboards.
 */
import mongoose, { Schema } from 'mongoose';
// Re-export constants from types
export { DEFAULT_EVALUATION_WEIGHTS } from '../types/index.js';
const KPISchema = new Schema({
    kpiId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    tasksCompleted: { type: Number, default: 0 },
    tasksFailed: { type: Number, default: 0 },
    tasksInProgress: { type: Number, default: 0 },
    tasksCancelled: { type: Number, default: 0 },
    totalTasksAttempted: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    minResponseTime: { type: Number, default: 0 },
    maxResponseTime: { type: Number, default: 0 },
    p95ResponseTime: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0, min: 0, max: 100 },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
    revenueGenerated: { type: Number, default: 0 },
    revenuePerTask: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0, min: 0, max: 1 },
    errorRate: { type: Number, default: 0, min: 0, max: 1 },
    escalationRate: { type: Number, default: 0, min: 0, max: 1 },
    escalationCount: { type: Number, default: 0 },
    utilizationRate: { type: Number, default: 0, min: 0, max: 1 },
    avgResolutionTime: { type: Number, default: 0 },
    throughputPerHour: { type: Number, default: 0 },
    peerRating: { type: Number, default: 0, min: 0, max: 100 },
    teamContributionScore: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });
KPISchema.index({ tenantId: 1, period: 1 });
KPISchema.index({ employeeId: 1, period: 1 });
KPISchema.index({ tenantId: 1, employeeId: 1, period: 1 }, { unique: true });
export const KPI = mongoose.model('KPI', KPISchema);
const KPIHistorySchema = new Schema({
    historyId: { type: String, required: true, unique: true, index: true },
    kpiId: { type: String, required: true, index: true },
    employeeId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    changes: { type: Map, of: new Schema({ old: Number, new: Number }, { _id: false }) },
    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });
export const KPIHistory = mongoose.model('KPIHistory', KPIHistorySchema);
const EvaluationSchema = new Schema({
    evaluationId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    evaluatorId: { type: String, required: true },
    period: { type: String, required: true, index: true },
    periodType: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly'],
        required: true,
    },
    qualityScore: { type: Number, required: true, min: 0, max: 100 },
    productivityScore: { type: Number, required: true, min: 0, max: 100 },
    reliabilityScore: { type: Number, required: true, min: 0, max: 100 },
    collaborationScore: { type: Number, required: true, min: 0, max: 100 },
    growthScore: { type: Number, required: true, min: 0, max: 100 },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    percentileRank: { type: Number, default: 0, min: 0, max: 1 },
    tenantPercentileRank: { type: Number, default: 0, min: 0, max: 1 },
    status: {
        type: String,
        enum: ['draft', 'completed', 'archived'],
        default: 'draft',
    },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    recommendations: [{ type: String }],
    completedAt: { type: Date },
}, { timestamps: true });
EvaluationSchema.index({ employeeId: 1, period: 1 });
EvaluationSchema.index({ tenantId: 1, period: 1 });
EvaluationSchema.index({ employeeId: 1, period: 1, periodType: 1 }, { unique: true });
export const Evaluation = mongoose.model('Evaluation', EvaluationSchema);
const EvaluationConfigSchema = new Schema({
    configId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    weights: {
        type: Object,
        default: {
            quality: 0.30,
            productivity: 0.25,
            reliability: 0.20,
            collaboration: 0.15,
            growth: 0.10,
        },
    },
    thresholds: {
        exceptional: { type: Number, default: 95 },
        exceeds: { type: Number, default: 85 },
        meets: { type: Number, default: 70 },
        needs: { type: Number, default: 50 },
    },
    autoEvaluation: { type: Boolean, default: true },
    evaluationFrequency: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly'],
        default: 'monthly',
    },
}, { timestamps: true });
EvaluationConfigSchema.index({ tenantId: 1 }, { unique: true });
export const EvaluationConfig = mongoose.model('EvaluationConfig', EvaluationConfigSchema);
const CompensationSchema = new Schema({
    compensationId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    baseAmount: { type: Number, required: true },
    compensationType: {
        type: String,
        enum: ['salary', 'bonus', 'commission', 'performance_payout'],
        required: true,
    },
    performanceBonus: { type: Number, default: 0 },
    qualityBonus: { type: Number, default: 0 },
    revenueShare: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    grossAmount: { type: Number, required: true },
    taxDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'calculated', 'approved', 'paid', 'cancelled'],
        default: 'pending',
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    paidAt: { type: Date },
    calculationDetails: {
        baseHourlyRate: { type: Number, required: true },
        hoursWorked: { type: Number, required: true },
        tasksCompleted: { type: Number, required: true },
        qualityMultiplier: { type: Number, required: true },
        performanceMultiplier: { type: Number, required: true },
        revenueSharePercentage: { type: Number, required: true },
        penaltyReasons: [{ type: String }],
    },
    billingTransactionId: { type: String, index: true },
}, { timestamps: true });
CompensationSchema.index({ employeeId: 1, period: 1 });
CompensationSchema.index({ tenantId: 1, period: 1 });
CompensationSchema.index({ tenantId: 1, status: 1 });
CompensationSchema.index({ employeeId: 1, period: 1 }, { unique: true });
export const Compensation = mongoose.model('Compensation', CompensationSchema);
const LeaderboardEntrySchema = new Schema({
    rank: { type: Number, required: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, required: true },
    score: { type: Number, required: true },
    previousRank: { type: Number },
    rankChange: { type: Number, default: 0 },
    metrics: { type: Map, of: Number },
    badge: { type: String },
}, { _id: false });
const LeaderboardSchema = new Schema({
    leaderboardId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    metric: {
        type: String,
        enum: ['overall', 'productivity', 'quality', 'revenue', 'efficiency'],
        required: true,
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true,
    },
    periodLabel: { type: String, required: true },
    entries: [LeaderboardEntrySchema],
    totalParticipants: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
LeaderboardSchema.index({ tenantId: 1, metric: 1, period: 1, periodLabel: 1 });
LeaderboardSchema.index({ tenantId: 1, metric: 1, period: 1, periodLabel: 1 }, { unique: true });
export const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);
const PerformanceReportSchema = new Schema({
    reportId: { type: String, required: true, unique: true, index: true },
    employeeId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    reportType: {
        type: String,
        enum: ['individual', 'team', 'department', 'organization'],
        required: true,
    },
    period: { type: String, required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    summary: {
        overallScore: { type: Number, required: true },
        scoreChange: { type: Number, default: 0 },
        percentileChange: { type: Number, default: 0 },
        topStrength: { type: String },
        topImprovement: { type: String },
        totalTasks: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        avgCustomerSatisfaction: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        periodHighlights: [{ type: String }],
    },
    kpiData: { type: mongoose.Schema.Types.Mixed },
    evaluationHistory: { type: mongoose.Schema.Types.Mixed },
    compensationHistory: { type: mongoose.Schema.Types.Mixed },
    trendAnalysis: { type: mongoose.Schema.Types.Mixed },
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: String, required: true },
}, { timestamps: true });
PerformanceReportSchema.index({ employeeId: 1, period: 1 });
PerformanceReportSchema.index({ tenantId: 1, reportType: 1 });
PerformanceReportSchema.index({ tenantId: 1, employeeId: 1, period: 1 }, { unique: true });
export const PerformanceReport = mongoose.model('PerformanceReport', PerformanceReportSchema);
const EmployeeProfileSchema = new Schema({
    employeeId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    level: { type: Number, default: 1, min: 1, max: 10 },
    managerId: { type: String },
    hireDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['active', 'inactive', 'onboarding'],
        default: 'active',
    },
    baseSalary: { type: Number, required: true },
    hourlyRate: { type: Number, required: true },
}, { timestamps: true });
EmployeeProfileSchema.index({ tenantId: 1, department: 1 });
EmployeeProfileSchema.index({ tenantId: 1, status: 1 });
export const EmployeeProfile = mongoose.model('EmployeeProfile', EmployeeProfileSchema);
// ============================================
// EXPORT ALL MODELS
// ============================================
export const models = {
    KPI,
    KPIHistory,
    Evaluation,
    EvaluationConfig,
    Compensation,
    Leaderboard,
    PerformanceReport,
    EmployeeProfile,
};
export default models;
//# sourceMappingURL=performanceModel.js.map