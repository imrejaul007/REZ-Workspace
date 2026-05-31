/**
 * HOJAI Performance Dashboard - Compensation Calculator Service
 *
 * Calculates pay and compensation for AI employees based on performance.
 * Integrates with hojai-billing for payment processing.
 */
export declare class CompensationCalculator {
    /**
     * Calculate compensation for an employee
     */
    calculateCompensation(employeeId: string, tenantId: string, period: string, overrideBase?: number): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").ICompensation, {}, {}> & import("../models/performanceModel.js").ICompensation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Calculate compensation breakdown
     */
    private calculateBreakdown;
    /**
     * Calculate quality multiplier
     */
    private calculateQualityMultiplier;
    /**
     * Calculate performance multiplier
     */
    private calculatePerformanceMultiplier;
    /**
     * Get compensation record
     */
    getCompensation(employeeId: string, tenantId: string, period?: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").ICompensation, {}, {}> & import("../models/performanceModel.js").ICompensation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get compensation history
     */
    getCompensationHistory(employeeId: string, tenantId: string, limit?: number): Promise<(import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").ICompensation, {}, {}> & import("../models/performanceModel.js").ICompensation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Approve compensation
     */
    approveCompensation(compensationId: string, approverId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").ICompensation, {}, {}> & import("../models/performanceModel.js").ICompensation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Mark compensation as paid
     */
    markAsPaid(compensationId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/performanceModel.js").ICompensation, {}, {}> & import("../models/performanceModel.js").ICompensation & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Process payment via hojai-billing integration
     */
    processPayment(compensationId: string): Promise<{
        success: boolean;
        transactionId?: string;
        error?: string;
    }>;
    /**
     * Get payroll summary for a period
     */
    getPayrollSummary(tenantId: string, period: string): Promise<{
        period: string;
        totalEmployees: number;
        totalGross: number;
        totalTax: number;
        totalPenalties: number;
        totalNet: number;
        totalBonuses: number;
        byStatus: {
            pending: number;
            calculated: number;
            approved: number;
            paid: number;
        };
    }>;
    /**
     * Get compensation statistics
     */
    getCompensationStats(tenantId: string, period?: string): Promise<any>;
    /**
     * Calculate bonuses breakdown
     */
    getBonusBreakdown(employeeId: string, tenantId: string, period: string): Promise<{
        period: string;
        qualityBonus: {
            tasksCompleted: number;
            multiplier: number;
            amount: number;
            breakdown: string;
        };
        performanceBonus: {
            score: number;
            multiplier: number;
            amount: number;
            breakdown: string;
        };
        revenueShare: {
            revenueGenerated: number;
            percentage: number;
            amount: number;
            breakdown: string;
        };
        totalBonus: number;
    }>;
    /**
     * Generate compensation forecast
     */
    generateForecast(tenantId: string, months?: number): Promise<any[]>;
}
export declare const compensationCalculator: CompensationCalculator;
export default compensationCalculator;
//# sourceMappingURL=compensationCalculator.d.ts.map