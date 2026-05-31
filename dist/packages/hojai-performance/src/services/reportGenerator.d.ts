/**
 * HOJAI Performance Dashboard - Report Generator Service
 *
 * Generates comprehensive performance reports for AI employees.
 */
import { ReportType, ReportFormat, ReportSummary } from '../types/index.js';
export declare class ReportGenerator {
    /**
     * Generate performance report for an employee
     */
    generateReport(employeeId: string, tenantId: string, periodStart: Date, periodEnd: Date, reportType?: ReportType, generatedBy?: string): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IPerformanceReport, {}, {}> & import("../models/performanceModel.js").IPerformanceReport & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get report
     */
    getReport(employeeId: string, tenantId: string, period?: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IPerformanceReport, {}, {}> & import("../models/performanceModel.js").IPerformanceReport & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get report history
     */
    getReportHistory(employeeId: string, tenantId: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").IPerformanceReport, {}, {}> & import("../models/performanceModel.js").IPerformanceReport & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Generate team performance report
     */
    generateTeamReport(tenantId: string, department: string, periodStart: Date, periodEnd: Date, generatedBy?: string): Promise<any[]>;
    /**
     * Generate department performance report
     */
    generateDepartmentReport(tenantId: string, department: string, periodStart: Date, periodEnd: Date, generatedBy?: string): Promise<{
        reportId: string;
        employeeId: string;
        tenantId: string;
        reportType: string;
        period: string;
        periodStart: Date;
        periodEnd: Date;
        summary: ReportSummary;
        kpiData: {
            totalTasksCompleted: any;
            totalTasksFailed: any;
            completionRate: number;
            avgCustomerSatisfaction: number;
            avgQualityScore: number;
            totalRevenue: any;
            avgErrorRate: number;
            avgEscalationRate: number;
        };
        evaluationHistory: never[];
        compensationHistory: never[];
        trendAnalysis: never[];
        generatedAt: Date;
        generatedBy: string;
        createdAt: Date;
    }>;
    /**
     * Generate organization-wide report
     */
    generateOrganizationReport(tenantId: string, periodStart: Date, periodEnd: Date, generatedBy?: string): Promise<{
        reportId: string;
        employeeId: string;
        tenantId: string;
        reportType: string;
        period: string;
        periodStart: Date;
        periodEnd: Date;
        summary: {
            overallScore: number;
            scoreChange: number;
            percentileChange: number;
            topStrength: string;
            topImprovement: string;
            totalTasks: any;
            completionRate: number;
            avgCustomerSatisfaction: number;
            totalRevenue: any;
            periodHighlights: string[];
        };
        kpiData: {
            totalTasksCompleted: any;
            totalTasksFailed: any;
            completionRate: number;
            avgCustomerSatisfaction: number;
            avgQualityScore: number;
            totalRevenue: any;
            avgErrorRate: number;
            avgEscalationRate: number;
        };
        evaluationHistory: never[];
        compensationHistory: never[];
        trendAnalysis: never[];
        generatedAt: Date;
        generatedBy: string;
        createdAt: Date;
    }>;
    /**
     * Export report as different formats
     */
    exportReport(employeeId: string, tenantId: string, exportFormat?: ReportFormat, period?: string): Promise<{
        data: string;
        contentType: string;
        filename: string;
    }>;
    private gatherKPIData;
    private gatherEvaluationHistory;
    private gatherCompensationHistory;
    private gatherTrendData;
    private generateSummary;
    private determineTopStrength;
    private determineTopImprovement;
    private aggregateKPIs;
    private aggregateEvaluations;
    private generateDepartmentSummary;
    private generateOrgHighlights;
    private convertToCSV;
}
export declare const reportGenerator: ReportGenerator;
export default reportGenerator;
//# sourceMappingURL=reportGenerator.d.ts.map