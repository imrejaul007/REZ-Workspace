/**
 * HOJAI Performance Dashboard - Type Definitions
 *
 * KPI, Evaluation, Compensation, and Performance Report types for AI employees.
 */
import { z } from 'zod';
// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================
export const KPIUpdateSchema = z.object({
    tasksCompleted: z.number().min(0).optional(),
    tasksFailed: z.number().min(0).optional(),
    responseTime: z.number().min(0).optional(),
    customerSatisfaction: z.number().min(0).max(100).optional(),
    revenueGenerated: z.number().min(0).optional(),
    errorOccurred: z.boolean().optional(),
    escalationTriggered: z.boolean().optional(),
});
export const CompensationCalculateSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM format'),
    overrideBase: z.number().min(0).optional(),
});
export const LeaderboardQuerySchema = z.object({
    metric: z.enum(['overall', 'productivity', 'quality', 'revenue', 'efficiency']).optional(),
    period: z.enum(['daily', 'weekly', 'monthly']).optional(),
    limit: z.number().min(1).max(100).optional(),
    department: z.string().optional(),
});
export const ReportGenerateSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    reportType: z.enum(['individual', 'team', 'department', 'organization']).optional(),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format'),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD format'),
    format: z.enum(['json', 'pdf', 'csv']).optional(),
});
// ============================================
// DEFAULT VALUES
// ============================================
export const DEFAULT_EVALUATION_WEIGHTS = {
    quality: 0.30,
    productivity: 0.25,
    reliability: 0.20,
    collaboration: 0.15,
    growth: 0.10,
};
export const DEFAULT_COMPENSATION_CONFIG = {
    baseSalary: 50000,
    maxBonusMultiplier: 1.5,
    revenueSharePercentage: 0.05,
    taxRate: 0.18,
    qualityThreshold: 70,
};
export const KPI_THRESHOLDS = {
    excellent: 90,
    good: 75,
    average: 60,
    poor: 40,
};
export const EVALUATION_GRADES = {
    exceptional: { min: 95, label: 'Exceptional', color: '#22C55E' },
    exceeds: { min: 85, label: 'Exceeds Expectations', color: '#3B82F6' },
    meets: { min: 70, label: 'Meets Expectations', color: '#FACC15' },
    needs: { min: 50, label: 'Needs Improvement', color: '#F97316' },
    unsatisfactory: { min: 0, label: 'Unsatisfactory', color: '#EF4444' },
};
//# sourceMappingURL=index.js.map